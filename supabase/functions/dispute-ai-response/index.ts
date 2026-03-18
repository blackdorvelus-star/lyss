import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Non autorisé");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Non authentifié");

    const { invoice_id } = await req.json();
    if (!invoice_id) throw new Error("invoice_id requis");

    // Fetch invoice + client
    const { data: invoice } = await supabase
      .from("invoices")
      .select("*, clients(*)")
      .eq("id", invoice_id)
      .single();

    if (!invoice) throw new Error("Facture introuvable");

    // Fetch reminders timeline
    const { data: reminders } = await supabase
      .from("reminders")
      .select("*")
      .eq("invoice_id", invoice_id)
      .order("created_at", { ascending: true });

    // Fetch call logs
    const { data: calls } = await supabase
      .from("call_logs")
      .select("*")
      .eq("invoice_id", invoice_id)
      .order("created_at", { ascending: true });

    // Fetch payment settings for tone
    const { data: settings } = await supabase
      .from("payment_settings")
      .select("tone, company_name, assistant_name, greeting_style, follow_up_closing")
      .eq("user_id", user.id)
      .single();

    // Build timeline context
    const timelineContext = [
      ...(reminders || []).map((r: any) => {
        const isNote = r.message_content?.startsWith("[NOTE INTERNE]");
        return `[${new Date(r.sent_at || r.created_at).toLocaleDateString("fr-CA")}] ${isNote ? "Note interne" : r.channel === "sms" ? "SMS envoyé" : "Courriel envoyé"}: ${r.message_content}${r.sms_response ? `\n  → Réponse client: "${r.sms_response}"` : ""}${r.response ? `\n  → Réponse client: "${r.response}"` : ""}`;
      }),
      ...(calls || []).map((c: any) =>
        `[${new Date(c.created_at).toLocaleDateString("fr-CA")}] Appel vocal (${c.duration_seconds ? Math.round(c.duration_seconds / 60) + "min" : "durée inconnue"}) — Sentiment: ${c.client_sentiment || "neutre"} — Résultat: ${c.call_result || "inconnu"}${c.summary ? `\n  Résumé: ${c.summary}` : ""}`
      ),
    ].join("\n");

    const tone = settings?.tone === "vous" ? "vous" : "tu";
    const companyName = settings?.company_name || "notre bureau";
    const assistantName = settings?.assistant_name || "Lyss";
    const clientName = (invoice as any).clients?.name || "le client";
    const amount = invoice.amount;

    const systemPrompt = `Tu es ${assistantName}, adjointe administrative IA spécialisée en recouvrement de créances pour les PME au Québec.

CONTEXTE DU LITIGE:
- Client: ${clientName}
- Montant: ${amount} $ CAD
- Facture: ${invoice.invoice_number || "non numérotée"}
- Date de création: ${new Date(invoice.created_at).toLocaleDateString("fr-CA")}
- Échéance: ${invoice.due_date || "non spécifiée"}

HISTORIQUE DES ÉCHANGES:
${timelineContext || "Aucun échange enregistré."}

INSTRUCTIONS:
1. Analyse la timeline pour comprendre le contexte du litige et le sentiment du client.
2. Rédige une réponse empathique et professionnelle en français québécois (tutoiement: ${tone}).
3. Ton objectif est de désamorcer le conflit tout en préservant la relation commerciale.
4. Propose une solution concrète (plan de paiement, escompte pour paiement rapide, clarification).
5. Respecte la Loi sur le recouvrement de certaines créances du Québec (RLRQ, c. R-2.2).
6. NE MENACE JAMAIS. Reste toujours courtois et solution-orienté.
7. Signe au nom de "${companyName}".

FORMAT:
- Rédige SEULEMENT le message à envoyer au client (pas de métadonnées).
- Maximum 200 mots.
- Inclus un objet/sujet si c'est un courriel (sur la première ligne, précédé de "Objet: ").`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY non configurée");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Rédige une réponse appropriée pour résoudre ce litige avec ${clientName}. Tiens compte du sentiment détecté et de l'historique complet.` },
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Trop de requêtes — réessaie dans quelques secondes." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits IA épuisés." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      throw new Error("Erreur du service IA");
    }

    const aiData = await aiResponse.json();
    const generatedResponse = aiData.choices?.[0]?.message?.content;

    if (!generatedResponse) throw new Error("Aucune réponse générée");

    return new Response(JSON.stringify({
      response: generatedResponse,
      client_name: clientName,
      amount,
      sentiment_summary: (calls || []).some((c: any) => c.client_sentiment === "negative")
        ? "negative"
        : (calls || []).some((c: any) => c.client_sentiment === "positive")
          ? "positive"
          : "neutral",
      timeline_count: (reminders?.length || 0) + (calls?.length || 0),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("dispute-ai-response error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

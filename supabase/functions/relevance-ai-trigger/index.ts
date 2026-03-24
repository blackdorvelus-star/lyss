import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RELEVANCE_AI_ENDPOINT = "https://api-bcbe5a.stack.tryrelevance.com/latest/agents/trigger";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RELEVANCE_AI_API_KEY = Deno.env.get("RELEVANCE_AI_API_KEY");
    const RELEVANCE_AI_AGENT_ID = Deno.env.get("RELEVANCE_AI_AGENT_ID");

    if (!RELEVANCE_AI_API_KEY) throw new Error("RELEVANCE_AI_API_KEY non configurée");
    if (!RELEVANCE_AI_AGENT_ID) throw new Error("RELEVANCE_AI_AGENT_ID non configuré");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { invoice_id, user_id, action_type } = await req.json();

    if (!invoice_id || !user_id) {
      return new Response(JSON.stringify({ error: "invoice_id et user_id requis" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch invoice + client
    const { data: invoice, error: invErr } = await supabase
      .from("invoices")
      .select("*, clients(*)")
      .eq("id", invoice_id)
      .single();

    if (invErr || !invoice) {
      return new Response(JSON.stringify({ error: "Facture introuvable" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch settings and reminders history in parallel
    const [settingsRes, remindersRes, callsRes] = await Promise.all([
      supabase
        .from("payment_settings")
        .select("company_name, assistant_name, tone, active_channels, ai_negotiate, ai_max_discount_percent, ai_propose_payment_plan, interac_email, stripe_link")
        .eq("user_id", user_id)
        .single(),
      supabase
        .from("reminders")
        .select("channel, status, message_content, sms_response, sent_at, created_at")
        .eq("invoice_id", invoice_id)
        .order("created_at", { ascending: true }),
      supabase
        .from("call_logs")
        .select("status, call_result, client_sentiment, duration_seconds, summary, created_at")
        .eq("invoice_id", invoice_id)
        .order("created_at", { ascending: true }),
    ]);

    const settings = settingsRes.data || {};
    const client = (invoice as any).clients;
    const dueDate = invoice.due_date
      ? new Date(invoice.due_date).toLocaleDateString("fr-CA")
      : "Non spécifiée";
    const daysPastDue = invoice.due_date
      ? Math.floor((Date.now() - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    // Build context message for the agent
    const contextMessage = `
DOSSIER DE RECOUVREMENT — Action requise

📋 FACTURE:
- Numéro: ${invoice.invoice_number || "N/A"}
- Montant: ${invoice.amount} $ CAD
- Montant récupéré: ${invoice.amount_recovered || 0} $
- Solde restant: ${invoice.amount - (invoice.amount_recovered || 0)} $
- Échéance: ${dueDate}
- Jours de retard: ${daysPastDue > 0 ? daysPastDue : 0}
- Statut: ${invoice.status}

👤 CLIENT:
- Nom: ${client?.name || "Inconnu"}
- Téléphone: ${client?.phone || "Non disponible"}
- Courriel: ${client?.email || "Non disponible"}

🏢 ENTREPRISE:
- Nom: ${settings.company_name || "Non configuré"}
- Assistante: ${settings.assistant_name || "Lyss"}
- Ton: ${settings.tone === "vous" ? "Vouvoiement" : "Tutoiement"}
- Canaux actifs: ${JSON.stringify(settings.active_channels || ["sms", "email", "phone"])}

📊 HISTORIQUE DES RELANCES (${(remindersRes.data || []).length} entrées):
${(remindersRes.data || []).map((r: any) => {
  const date = new Date(r.sent_at || r.created_at).toLocaleDateString("fr-CA");
  return `- [${date}] ${r.channel.toUpperCase()} (${r.status})${r.sms_response ? ` → Réponse: "${r.sms_response}"` : ""}`;
}).join("\n") || "Aucune relance précédente"}

📞 HISTORIQUE DES APPELS (${(callsRes.data || []).length} entrées):
${(callsRes.data || []).map((c: any) => {
  const date = new Date(c.created_at).toLocaleDateString("fr-CA");
  return `- [${date}] ${c.status} — Sentiment: ${c.client_sentiment || "neutre"} — Résultat: ${c.call_result || "inconnu"}${c.summary ? ` — ${c.summary}` : ""}`;
}).join("\n") || "Aucun appel précédent"}

💳 OPTIONS DE PAIEMENT:
- Interac: ${settings.interac_email ? "Configuré" : "Non configuré"}
- Stripe: ${settings.stripe_link ? "Configuré" : "Non configuré"}
- Négociation IA: ${settings.ai_negotiate ? `Oui (max ${settings.ai_max_discount_percent || 0}%)` : "Non"}
- Plan de paiement: ${settings.ai_propose_payment_plan ? "Oui" : "Non"}

🎯 ACTION DEMANDÉE: ${action_type || "Décider la meilleure prochaine action de relance"}

Instructions: Analyse ce dossier et décide la meilleure action à prendre. Respecte les lois québécoises (RLRQ, c. R-2.2). Ne menace jamais. Sois professionnel et empathique.
`.trim();

    // Trigger Relevance AI agent
    const relevanceRes = await fetch(RELEVANCE_AI_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: RELEVANCE_AI_API_KEY,
      },
      body: JSON.stringify({
        message: {
          role: "user",
          content: contextMessage,
        },
        agent_id: RELEVANCE_AI_AGENT_ID,
      }),
    });

    if (!relevanceRes.ok) {
      const errText = await relevanceRes.text();
      console.error("Relevance AI error:", relevanceRes.status, errText);
      throw new Error(`Relevance AI error [${relevanceRes.status}]`);
    }

    const relevanceData = await relevanceRes.json();

    // Log the trigger in audit
    await supabase.from("audit_logs").insert({
      user_id,
      entity_type: "relevance_ai",
      entity_id: invoice_id,
      action: "agent_triggered",
      details: {
        action_type: action_type || "auto_sequence",
        agent_id: RELEVANCE_AI_AGENT_ID,
        days_past_due: daysPastDue,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        agent_response: relevanceData,
        invoice_id,
        client_name: client?.name,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("relevance-ai-trigger error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

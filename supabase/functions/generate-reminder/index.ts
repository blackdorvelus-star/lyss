import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Tu es un assistant de recouvrement amiable pour des PME au Québec. Tu génères des messages de relance de paiement.

RÈGLES ABSOLUES :
- Ton québécois professionnel : naturel, humain, jamais robotique. Tutoie le client.
- Toujours poli et empathique. JAMAIS menaçant, agressif ou condescendant.
- Propose toujours une solution flexible (paiement en 2-3 fois, Interac).
- Respecte la Loi sur le recouvrement de certaines créances (RLRQ, c. R-2.2) : pas de harcèlement, pas de fausses menaces légales.
- Message court : max 4-5 phrases pour SMS, max 6-8 phrases pour courriel.
- Inclus un lien de paiement fictif sous la forme : payer.lyss.ca/f/{invoice_id}
- Ne mentionne JAMAIS d'intérêts de retard, de frais, ou de conséquences légales.

Tu dois retourner exactement un JSON avec cette structure (pas de markdown, pas de texte autour) :
{
  "sms": "le message SMS",
  "email_subject": "l'objet du courriel",
  "email_body": "le corps du courriel"
}`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing Supabase credentials");
    }

    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verify user
    const anonClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { invoice_id } = await req.json();
    if (!invoice_id) {
      return new Response(JSON.stringify({ error: "invoice_id requis" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch invoice + client
    const { data: invoice, error: invError } = await supabase
      .from("invoices")
      .select("*, clients(*)")
      .eq("id", invoice_id)
      .eq("user_id", user.id)
      .single();

    if (invError || !invoice) {
      return new Response(JSON.stringify({ error: "Facture introuvable" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const client = invoice.clients;
    const dueDateStr = invoice.due_date
      ? new Date(invoice.due_date).toLocaleDateString("fr-CA", { day: "numeric", month: "long" })
      : "récemment";

    const userPrompt = `Génère les messages de relance pour cette facture :
- Nom du client : ${client.name}
- Montant : ${invoice.amount} $
- Numéro de facture : ${invoice.invoice_number || "N/A"}
- Date d'échéance : ${dueDateStr}
- ID facture (pour le lien) : ${invoice.id}

C'est la première relance (ton amical).`;

    // Call Lovable AI
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      const body = await aiResponse.text();
      console.error("AI gateway error:", status, body);

      if (status === 429) {
        return new Response(JSON.stringify({ error: "Trop de requêtes. Réessaie dans un moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Crédits IA épuisés." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error [${status}]`);
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.choices?.[0]?.message?.content || "";

    // Parse JSON from response (handle markdown code blocks)
    let messages;
    try {
      const cleaned = rawContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      messages = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response:", rawContent);
      throw new Error("L'IA n'a pas retourné un format valide.");
    }

    // Save reminders to DB
    const remindersToInsert = [];

    if (messages.sms && client.phone) {
      remindersToInsert.push({
        invoice_id: invoice.id,
        user_id: user.id,
        channel: "sms",
        message_content: messages.sms,
        status: "scheduled",
      });
    }

    if (messages.email_body && client.email) {
      remindersToInsert.push({
        invoice_id: invoice.id,
        user_id: user.id,
        channel: "email",
        message_content: `Objet: ${messages.email_subject}\n\n${messages.email_body}`,
        status: "scheduled",
      });
    }

    if (remindersToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from("reminders")
        .insert(remindersToInsert);

      if (insertError) {
        console.error("Error inserting reminders:", insertError);
      }
    }

    // Update invoice status
    await supabase
      .from("invoices")
      .update({ status: "in_progress" })
      .eq("id", invoice.id);

    return new Response(
      JSON.stringify({
        success: true,
        messages,
        reminders_created: remindersToInsert.length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("generate-reminder error:", e);
    const message = e instanceof Error ? e.message : "Erreur inconnue";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

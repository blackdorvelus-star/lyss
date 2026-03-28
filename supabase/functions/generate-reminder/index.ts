import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function buildSystemPrompt(settings: any): string {
  const name = settings.assistant_name || "Lyss";
  const role = settings.assistant_role || "adjointe";
  const company = settings.company_name || "l'entreprise";
  const tone = settings.tone === "vous" ? "Vouvoie le client." : "Tutoie le client.";
  const personality = settings.vapi_personality || "chaleureuse";
  const greeting = settings.greeting_style === "formel" ? "Utilise le nom de famille du client." : "Utilise le prénom du client.";
  const closing = settings.follow_up_closing || "Bonne journée !";
  const smsSig = settings.sms_signature ? `\n- Termine le SMS par : "${settings.sms_signature}"` : "";
  const emailSig = settings.email_signature ? `\n- Termine le courriel par :\n${settings.email_signature}` : "";
  const negotiate = settings.ai_negotiate
    ? `\n- Tu peux proposer un rabais jusqu'à ${settings.ai_max_discount_percent || 0}% si le client hésite.`
    : "\n- Ne propose AUCUN rabais.";
  const paymentPlan = settings.ai_propose_payment_plan
    ? "\n- Propose une solution flexible (paiement en 2-3 fois, Interac)."
    : "\n- Ne propose PAS de plan de paiement.";

  return `Tu es ${name}, ${role} IA pour ${company}. Tu génères des messages de suivi de courtoisie pour des factures en attente de paiement.

PERSONNALITÉ : ${personality}
${tone}
${greeting}

RÈGLES ABSOLUES :
- TOUJOURS te présenter par ton nom (${name}) dès le début du message. Ex: "Bonjour [prénom du client], c'est ${name}, ${role} chez ${company}."
- Ton québécois professionnel : naturel, humain, jamais robotique.
- Toujours poli et empathique. JAMAIS menaçant, agressif ou condescendant.${paymentPlan}${negotiate}
- Respecte la Loi sur le recouvrement de certaines créances (RLRQ, c. R-2.2).
- Message court : max 4-5 phrases pour SMS, max 6-8 phrases pour courriel.
- N'inclus AUCUN lien de paiement dans le message.
- Ne mentionne JAMAIS d'intérêts de retard, de frais, ou de conséquences légales.
- Utilise le terme "suivi de courtoisie" et non "relance" ou "recouvrement".
- TRÈS IMPORTANT : Le paiement doit TOUJOURS être dirigé vers ${company}, JAMAIS vers ${name} ou Lyss. Le client paie ${company} directement. ${name} ne perçoit aucun paiement. Formule toujours comme : "envoyer votre paiement à ${company}" ou "régler directement auprès de ${company}".
- Termine chaque message par : "${closing}"${smsSig}${emailSig}

Tu dois retourner exactement un JSON (pas de markdown, pas de texte autour) :
{
  "sms": "le message SMS",
  "email_subject": "l'objet du courriel",
  "email_body": "le corps du courriel"
}`;
}

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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const anonClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!);
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

    // Fetch invoice + client AND user settings in parallel
    const [invoiceRes, settingsRes] = await Promise.all([
      supabase
        .from("invoices")
        .select("*, clients(*)")
        .eq("id", invoice_id)
        .eq("user_id", user.id)
        .single(),
      supabase
        .from("payment_settings")
        .select("*")
        .eq("user_id", user.id)
        .single(),
    ]);

    const invoice = invoiceRes.data;
    if (invoiceRes.error || !invoice) {
      return new Response(JSON.stringify({ error: "Facture introuvable" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (invoice.status === 'disputed') {
      return new Response(JSON.stringify({ error: "Facture contestée — relances suspendues" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const settings = settingsRes.data || {};
    const activeChannels = (settings.active_channels as string[]) || ["sms", "email", "phone"];

    const client = invoice.clients;
    const dueDateStr = invoice.due_date
      ? new Date(invoice.due_date).toLocaleDateString("fr-CA", { day: "numeric", month: "long" })
      : "récemment";

    const assistantName = settings.assistant_name || "Lyss";
    const assistantRole = settings.assistant_role || "adjointe";
    const companyName = settings.company_name || "l'entreprise";

    let messages: { sms: string; email_subject: string; email_body: string };

    // Check if user wants custom templates
    if (settings.use_custom_templates && (settings.sms_template || settings.email_body_template)) {
      const replaceVars = (tpl: string) =>
        tpl
          .replace(/{prénom}/g, client.name.split(" ")[0])
          .replace(/{nom}/g, client.name)
          .replace(/{montant}/g, String(invoice.amount))
          .replace(/{facture}/g, invoice.invoice_number || "N/A")
          .replace(/{date_échéance}/g, dueDateStr)
          .replace(/{nom_assistant}/g, assistantName)
          .replace(/{rôle}/g, assistantRole)
          .replace(/{entreprise}/g, companyName);

      messages = {
        sms: settings.sms_template ? replaceVars(settings.sms_template) : "",
        email_subject: settings.email_subject_template ? replaceVars(settings.email_subject_template) : "",
        email_body: settings.email_body_template ? replaceVars(settings.email_body_template) : "",
      };
    } else {
      // AI-generated messages
      const userPrompt = `Génère les messages de suivi de courtoisie pour cette facture :
- Nom du client : ${client.name}
- Montant : ${invoice.amount} $
- Numéro de facture : ${invoice.invoice_number || "N/A"}
- Date d'échéance : ${dueDateStr}
- ID facture (pour le lien) : ${invoice.id}

C'est le premier suivi de courtoisie.`;

      const systemPrompt = buildSystemPrompt(settings);

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
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (status === 402) {
          return new Response(JSON.stringify({ error: "Crédits IA épuisés." }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw new Error(`AI gateway error [${status}]`);
      }

      const aiData = await aiResponse.json();
      const rawContent = aiData.choices?.[0]?.message?.content || "";

      try {
        const cleaned = rawContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        messages = JSON.parse(cleaned);
      } catch {
        console.error("Failed to parse AI response:", rawContent);
        throw new Error("L'IA n'a pas retourné un format valide.");
      }
    }

    // Only create reminders for active channels
    const remindersToInsert = [];

    if (messages.sms && client.phone && activeChannels.includes("sms")) {
      remindersToInsert.push({
        invoice_id: invoice.id,
        user_id: user.id,
        channel: "sms",
        message_content: messages.sms,
        status: "scheduled",
      });
    }

    if (messages.email_body && client.email && activeChannels.includes("email")) {
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
      if (insertError) console.error("Error inserting reminders:", insertError);
    }

    await supabase
      .from("invoices")
      .update({ status: "in_progress" })
      .eq("id", invoice.id);

    return new Response(
      JSON.stringify({ success: true, messages, reminders_created: remindersToInsert.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-reminder error:", e);
    const message = e instanceof Error ? e.message : "Erreur inconnue";
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

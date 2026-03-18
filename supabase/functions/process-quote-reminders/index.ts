import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const QUOTE_FOLLOW_UP_DAYS = 5;

function buildQuoteReminderPrompt(settings: any): string {
  const name = settings.assistant_name || "Lyss";
  const role = settings.assistant_role || "adjointe";
  const company = settings.company_name || "l'entreprise";
  const tone = settings.tone === "vous" ? "Vouvoie le client." : "Tutoie le client.";
  const personality = settings.vapi_personality || "chaleureuse";
  const closing = settings.follow_up_closing || "Bonne journée !";
  const smsSig = settings.sms_signature ? `\n- Termine le SMS par : "${settings.sms_signature}"` : "";

  return `Tu es ${name}, ${role} IA pour ${company}. Tu génères un SMS de suivi pour une soumission (devis) envoyée mais sans réponse du client.

PERSONNALITÉ : ${personality}
${tone}

RÈGLES :
- Présente-toi par ton nom (${name}) dès le début.
- Ton québécois professionnel, naturel, jamais robotique.
- Toujours poli et empathique. JAMAIS insistant ou agressif.
- Message court : max 3-4 phrases.
- Rappelle le montant et la description de la soumission.
- Demande gentiment si le client a des questions ou souhaite aller de l'avant.
- Ne mentionne JAMAIS de pression, de délai urgent ou de conséquences.
- Termine par : "${closing}"${smsSig}

Retourne exactement un JSON : {"sms":"le message SMS"}`;
}

function isWithinWorkingHours(settings: any): boolean {
  if (!settings) return true;
  const now = new Date();
  const montrealTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Montreal" }));
  const currentHour = `${String(montrealTime.getHours()).padStart(2, "0")}:${String(montrealTime.getMinutes()).padStart(2, "0")}`;
  const start = settings.working_hours_start || "08:00";
  const end = settings.working_hours_end || "18:00";
  if (currentHour < start || currentHour > end) return false;

  const dayMap = ["dim", "lun", "mar", "mer", "jeu", "ven", "sam"];
  const currentDay = dayMap[montrealTime.getDay()];
  const workingDays = (settings.working_days as string[]) || ["lun", "mar", "mer", "jeu", "ven"];
  return workingDays.includes(currentDay);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const TELNYX_API_KEY = Deno.env.get("TELNYX_API_KEY");
    const TELNYX_PHONE_NUMBER = Deno.env.get("TELNYX_PHONE_NUMBER");

    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
    if (!TELNYX_API_KEY) throw new Error("TELNYX_API_KEY is not configured");
    if (!TELNYX_PHONE_NUMBER) throw new Error("TELNYX_PHONE_NUMBER is not configured");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const now = new Date();
    const cutoffDate = new Date(now.getTime() - QUOTE_FOLLOW_UP_DAYS * 24 * 60 * 60 * 1000).toISOString();
    let totalProcessed = 0;

    // Find all quotes sent more than 5 days ago still in "sent" status
    const { data: quotes, error: quotesErr } = await supabase
      .from("quotes")
      .select("*, clients(*)")
      .eq("status", "sent")
      .not("sent_at", "is", null)
      .lt("sent_at", cutoffDate);

    if (quotesErr) {
      console.error("Error fetching quotes:", quotesErr);
      throw new Error("Erreur lors de la récupération des soumissions");
    }

    if (!quotes || quotes.length === 0) {
      return new Response(
        JSON.stringify({ success: true, processed: 0, message: "Aucune soumission à relancer" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Group quotes by user_id to batch settings lookup
    const userIds = [...new Set(quotes.map((q: any) => q.user_id))];

    const { data: allSettings } = await supabase
      .from("payment_settings")
      .select("*")
      .in("user_id", userIds);

    const settingsMap = new Map((allSettings || []).map((s: any) => [s.user_id, s]));

    // Check which quotes already had a follow-up reminder (avoid duplicates)
    const quoteIds = quotes.map((q: any) => q.id);
    const { data: existingReminders } = await supabase
      .from("audit_logs")
      .select("entity_id")
      .eq("entity_type", "quote")
      .eq("action", "quote_sms_followup")
      .in("entity_id", quoteIds);

    const alreadyReminded = new Set((existingReminders || []).map((r: any) => r.entity_id));

    for (const quote of quotes) {
      // Skip if already reminded
      if (alreadyReminded.has(quote.id)) continue;

      const client = quote.clients;
      if (!client?.phone) {
        console.log(`Skipping quote ${quote.id}: client has no phone`);
        continue;
      }

      const settings = settingsMap.get(quote.user_id) || {};

      // Check working hours
      if (!isWithinWorkingHours(settings)) {
        console.log(`Skipping quote ${quote.id}: outside working hours`);
        continue;
      }

      // Check if SMS channel is active
      const activeChannels = (settings.active_channels as string[]) || ["sms", "email", "phone"];
      if (!activeChannels.includes("sms")) continue;

      // Generate SMS via AI
      const systemPrompt = buildQuoteReminderPrompt(settings);
      const description = quote.description || "services professionnels";
      const userPrompt = `Génère un SMS de suivi pour cette soumission :
- Client : ${client.name}
- Montant : ${quote.amount} $
- Numéro de soumission : ${quote.quote_number || "N/A"}
- Description : ${description}
- Envoyée le : ${new Date(quote.sent_at).toLocaleDateString("fr-CA", { day: "numeric", month: "long" })}`;

      try {
        const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
          }),
        });

        if (!aiRes.ok) {
          console.error(`AI error for quote ${quote.id}: ${aiRes.status}`);
          continue;
        }

        const aiData = await aiRes.json();
        const raw = aiData.choices?.[0]?.message?.content || "";
        const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const { sms } = JSON.parse(cleaned);

        if (!sms) continue;

        // Send SMS via Telnyx
        const telnyxRes = await fetch("https://api.telnyx.com/v2/messages", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${TELNYX_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: TELNYX_PHONE_NUMBER,
            to: client.phone,
            text: sms,
            type: "SMS",
            webhook_url: `${SUPABASE_URL}/functions/v1/telnyx-webhook`,
          }),
        });

        const telnyxData = await telnyxRes.json();

        if (!telnyxRes.ok) {
          console.error(`Telnyx error for quote ${quote.id}:`, JSON.stringify(telnyxData));
          continue;
        }

        const messageId = telnyxData.data?.id;

        // Log the follow-up in audit_logs to prevent duplicates
        await supabase.from("audit_logs").insert({
          user_id: quote.user_id,
          entity_type: "quote",
          entity_id: quote.id,
          action: "quote_sms_followup",
          details: { sms_content: sms, telnyx_message_id: messageId, client_phone: client.phone },
        });

        // Create a notification for the user
        await supabase.from("notifications").insert({
          user_id: quote.user_id,
          title: "📋 Suivi soumission envoyé",
          message: `Lyss a relancé ${client.name} par SMS pour la soumission de ${quote.amount} $ (envoyée il y a ${QUOTE_FOLLOW_UP_DAYS}+ jours).`,
          type: "info",
        });

        totalProcessed++;
        console.log(`Quote ${quote.id}: SMS sent to ${client.phone}, Telnyx ID: ${messageId}`);
      } catch (e) {
        console.error(`Error processing quote ${quote.id}:`, e);
        continue;
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed: totalProcessed }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("process-quote-reminders error:", e);
    const message = e instanceof Error ? e.message : "Erreur inconnue";
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

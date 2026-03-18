import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Build a dynamic system prompt from user settings
function buildSystemPrompt(settings: any): string {
  const name = settings.assistant_name || "Lyss";
  const role = settings.assistant_role || "adjointe";
  const company = settings.company_name || "l'entreprise";
  const tone = settings.tone === "vous" ? "Vouvoie le client." : "Tutoie le client.";
  const personality = settings.vapi_personality || "chaleureuse";
  const closing = settings.follow_up_closing || "Bonne journée !";
  const smsSig = settings.sms_signature ? `\n- Termine le SMS par : "${settings.sms_signature}"` : "";
  const emailSig = settings.email_signature ? `\n- Termine le courriel par :\n${settings.email_signature}` : "";
  const negotiate = settings.ai_negotiate
    ? `\n- Tu peux proposer un rabais jusqu'à ${settings.ai_max_discount_percent || 0}% si le client hésite.`
    : "\n- Ne propose AUCUN rabais.";
  const paymentPlan = settings.ai_propose_payment_plan
    ? "\n- Propose une solution flexible (paiement en 2-3 fois, Interac)."
    : "\n- Ne propose PAS de plan de paiement.";

  return `Tu es ${name}, ${role} IA pour ${company}. Tu génères des messages de suivi de courtoisie pour des factures en attente.

PERSONNALITÉ : ${personality}
${tone}

RÈGLES :
- Ton québécois professionnel, naturel, jamais robotique.
- Toujours poli et empathique. JAMAIS menaçant.${paymentPlan}${negotiate}
- Message court : max 4-5 phrases pour SMS, max 6-8 phrases pour courriel.
- N'inclus AUCUN lien de paiement.
- Ne mentionne JAMAIS d'intérêts, frais ou conséquences légales.
- Termine chaque message par : "${closing}"${smsSig}${emailSig}

Retourne exactement un JSON : {"sms":"...","email_subject":"...","email_body":"..."}`;
}

// Check if current time is within user's working hours (Montreal TZ)
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

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const now = new Date();
    let totalProcessed = 0;

    // Get all active sequences
    const { data: sequences, error: seqErr } = await supabase
      .from("reminder_sequences")
      .select("*")
      .eq("enabled", true);

    if (seqErr || !sequences || sequences.length === 0) {
      return new Response(JSON.stringify({ processed: 0, message: "No active sequences" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    for (const seq of sequences) {
      // Fetch user settings for this sequence owner
      const { data: settings } = await supabase
        .from("payment_settings")
        .select("*")
        .eq("user_id", seq.user_id)
        .single();

      // Skip if outside working hours
      if (!isWithinWorkingHours(settings)) {
        console.log(`Skipping user ${seq.user_id}: outside working hours`);
        continue;
      }

      const activeChannels = (settings?.active_channels as string[]) || ["sms", "email", "phone"];
      const steps = seq.steps as Array<{ day: number; channel: string; label: string }>;
      const maxAttempts = seq.max_attempts_per_channel as Record<string, number>;

      const { data: invoices } = await supabase
        .from("invoices")
        .select("*, clients(*)")
        .eq("user_id", seq.user_id)
        .in("status", ["pending", "in_progress"]) // exclut "recovered" et "disputed"
        .not("due_date", "is", null);

      if (!invoices || invoices.length === 0) continue;

      // ── Vérifier les appels avec sentiment négatif pour escalade humaine ──
      const { data: negativeCalls } = await supabase
        .from("call_logs")
        .select("invoice_id")
        .eq("user_id", seq.user_id)
        .eq("client_sentiment", "negative");

      const negativeInvoiceIds = new Set((negativeCalls || []).map(c => c.invoice_id));

      for (const invoice of invoices) {
        const dueDate = new Date(invoice.due_date);
        const daysPastDue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysPastDue < 0) continue;

        // ── Escalade humaine : suspendre les relances si sentiment négatif ──
        if (negativeInvoiceIds.has(invoice.id)) {
          console.log(`Skipping invoice ${invoice.id}: negative sentiment detected, human escalation required`);
          // Créer une notification d'escalade (une seule fois)
          const { count: existingEscalation } = await supabase
            .from("notifications")
            .select("*", { count: "exact", head: true })
            .eq("invoice_id", invoice.id)
            .eq("type", "warning")
            .ilike("title", "%intervention%");

          if (!existingEscalation || existingEscalation === 0) {
            const assistantName = settings?.assistant_name || "Lyss";
            await supabase.from("notifications").insert({
              user_id: seq.user_id,
              invoice_id: invoice.id,
              title: "🚨 Intervention humaine requise",
              message: `${assistantName} a suspendu les relances pour ${invoice.clients?.name} (${invoice.amount} $) suite à une réponse négative. Veuillez intervenir personnellement.`,
              type: "warning",
            });
          }
          continue;
        }

        const currentStep = invoice.current_sequence_step || 0;
        if (currentStep >= steps.length) continue;

        const nextStep = steps[currentStep];
        if (daysPastDue < nextStep.day) continue;

        // Check cooldown
        if (invoice.last_sequence_action_at) {
          const lastAction = new Date(invoice.last_sequence_action_at);
          if ((now.getTime() - lastAction.getTime()) / (1000 * 60 * 60) < 20) continue;
        }

        // Skip if channel is disabled in user settings
        if (!activeChannels.includes(nextStep.channel)) {
          await supabase.from("invoices").update({
            current_sequence_step: currentStep + 1,
            last_sequence_action_at: now.toISOString(),
          }).eq("id", invoice.id);
          continue;
        }

        // Check max attempts for this channel
        const { count } = await supabase
          .from("reminders")
          .select("*", { count: "exact", head: true })
          .eq("invoice_id", invoice.id)
          .eq("channel", nextStep.channel);

        const maxForChannel = maxAttempts[nextStep.channel] || 3;
        if ((count || 0) >= maxForChannel) {
          await supabase.from("invoices").update({
            current_sequence_step: currentStep + 1,
            last_sequence_action_at: now.toISOString(),
          }).eq("id", invoice.id);
          continue;
        }

        const client = invoice.clients;

        if (nextStep.channel === "sms" && client.phone && TELNYX_API_KEY && TELNYX_PHONE_NUMBER) {
          try {
            const message = await generateMessage(LOVABLE_API_KEY!, settings, invoice, client, "sms");
            if (message) {
              const { data: reminder } = await supabase.from("reminders").insert({
                invoice_id: invoice.id, user_id: seq.user_id,
                channel: "sms", message_content: message.sms, status: "scheduled",
              }).select().single();

              if (reminder) {
                const telnyxRes = await fetch("https://api.telnyx.com/v2/messages", {
                  method: "POST",
                  headers: { Authorization: `Bearer ${TELNYX_API_KEY}`, "Content-Type": "application/json" },
                  body: JSON.stringify({
                    from: TELNYX_PHONE_NUMBER, to: client.phone,
                    text: message.sms, type: "SMS",
                    webhook_url: `${SUPABASE_URL}/functions/v1/telnyx-webhook`,
                  }),
                });

                const telnyxData = await telnyxRes.json();
                if (telnyxRes.ok) {
                  await supabase.from("reminders").update({
                    status: "sent", sent_at: now.toISOString(),
                    delivery_status: "queued", delivery_provider_id: telnyxData.data?.id,
                  }).eq("id", reminder.id);
                }
              }
            }
          } catch (e) {
            console.error(`SMS step failed for invoice ${invoice.id}:`, e);
          }
        } else if (nextStep.channel === "email" && client.email) {
          try {
            const message = await generateMessage(LOVABLE_API_KEY!, settings, invoice, client, "email");
            if (message) {
              await supabase.from("reminders").insert({
                invoice_id: invoice.id, user_id: seq.user_id,
                channel: "email",
                message_content: `Objet: ${message.email_subject}\n\n${message.email_body}`,
                status: "scheduled",
              });
            }
          } catch (e) {
            console.error(`Email step failed for invoice ${invoice.id}:`, e);
          }
        } else if (nextStep.channel === "phone" && client.phone) {
          const assistantName = settings?.assistant_name || "Lyss";
          await supabase.from("notifications").insert({
            user_id: seq.user_id, invoice_id: invoice.id,
            title: "📞 Appel de suivi recommandé",
            message: `${assistantName} recommande un appel à ${client.name} (${client.phone}) pour la facture de ${invoice.amount} $.`,
            type: "info",
          });
        }

        await supabase.from("invoices").update({
          current_sequence_step: currentStep + 1,
          last_sequence_action_at: now.toISOString(),
          status: invoice.status === "pending" ? "in_progress" : invoice.status,
        }).eq("id", invoice.id);

        totalProcessed++;
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed: totalProcessed }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("process-sequences error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Generate reminder messages via Lovable AI using user settings
async function generateMessage(
  apiKey: string,
  settings: any,
  invoice: any,
  client: any,
  channel: string
): Promise<{ sms: string; email_subject: string; email_body: string } | null> {
  const dueDateStr = invoice.due_date
    ? new Date(invoice.due_date).toLocaleDateString("fr-CA", { day: "numeric", month: "long" })
    : "récemment";

  const systemPrompt = buildSystemPrompt(settings || {});

  const userPrompt = `Génère les messages pour :
- Client : ${client.name}
- Montant : ${invoice.amount} $
- Facture : ${invoice.invoice_number || "N/A"}
- Échéance : ${dueDateStr}
- Canal prioritaire : ${channel}`;

  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content || "";
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

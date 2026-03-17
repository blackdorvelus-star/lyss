import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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

    // Get all users with active sequences
    const { data: sequences, error: seqErr } = await supabase
      .from("reminder_sequences")
      .select("*")
      .eq("enabled", true);

    if (seqErr || !sequences || sequences.length === 0) {
      return new Response(JSON.stringify({ processed: 0, message: "No active sequences" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    for (const seq of sequences) {
      const steps = seq.steps as Array<{ day: number; channel: string; label: string }>;
      const maxAttempts = seq.max_attempts_per_channel as Record<string, number>;

      // Get overdue invoices for this user that are pending or in_progress (not disputed/recovered/cancelled)
      const { data: invoices } = await supabase
        .from("invoices")
        .select("*, clients(*)")
        .eq("user_id", seq.user_id)
        .in("status", ["pending", "in_progress"])
        .not("due_date", "is", null);

      if (!invoices || invoices.length === 0) continue;

      for (const invoice of invoices) {
        const dueDate = new Date(invoice.due_date);
        const daysPastDue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

        if (daysPastDue < 0) continue; // Not yet overdue

        const currentStep = invoice.current_sequence_step || 0;

        // Find the next step to execute
        if (currentStep >= steps.length) continue; // All steps done

        const nextStep = steps[currentStep];
        if (daysPastDue < nextStep.day) continue; // Not time yet

        // Check if we already acted today to avoid duplicates
        if (invoice.last_sequence_action_at) {
          const lastAction = new Date(invoice.last_sequence_action_at);
          const hoursSince = (now.getTime() - lastAction.getTime()) / (1000 * 60 * 60);
          if (hoursSince < 20) continue; // At least 20h between actions
        }

        // Count existing reminders for this channel to enforce max attempts
        const { count } = await supabase
          .from("reminders")
          .select("*", { count: "exact", head: true })
          .eq("invoice_id", invoice.id)
          .eq("channel", nextStep.channel);

        const maxForChannel = maxAttempts[nextStep.channel] || 3;
        if ((count || 0) >= maxForChannel) {
          // Skip this channel, advance to next step
          await supabase
            .from("invoices")
            .update({
              current_sequence_step: currentStep + 1,
              last_sequence_action_at: now.toISOString(),
            })
            .eq("id", invoice.id);
          continue;
        }

        const client = invoice.clients;

        // Execute the step based on channel
        if (nextStep.channel === "sms" && client.phone && TELNYX_API_KEY && TELNYX_PHONE_NUMBER) {
          // Generate message via AI then send SMS
          try {
            const message = await generateMessage(LOVABLE_API_KEY!, invoice, client, "sms");
            if (message) {
              // Create reminder
              const { data: reminder } = await supabase
                .from("reminders")
                .insert({
                  invoice_id: invoice.id,
                  user_id: seq.user_id,
                  channel: "sms",
                  message_content: message.sms,
                  status: "scheduled",
                })
                .select()
                .single();

              // Send via Telnyx
              if (reminder) {
                const telnyxRes = await fetch("https://api.telnyx.com/v2/messages", {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${TELNYX_API_KEY}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    from: TELNYX_PHONE_NUMBER,
                    to: client.phone,
                    text: message.sms,
                    type: "SMS",
                    webhook_url: `${SUPABASE_URL}/functions/v1/telnyx-webhook`,
                  }),
                });

                const telnyxData = await telnyxRes.json();
                if (telnyxRes.ok) {
                  await supabase
                    .from("reminders")
                    .update({
                      status: "sent",
                      sent_at: now.toISOString(),
                      delivery_status: "queued",
                      delivery_provider_id: telnyxData.data?.id,
                    })
                    .eq("id", reminder.id);
                }
              }
            }
          } catch (e) {
            console.error(`SMS step failed for invoice ${invoice.id}:`, e);
          }
        } else if (nextStep.channel === "email" && client.email) {
          // Generate email message and save as reminder
          try {
            const message = await generateMessage(LOVABLE_API_KEY!, invoice, client, "email");
            if (message) {
              await supabase
                .from("reminders")
                .insert({
                  invoice_id: invoice.id,
                  user_id: seq.user_id,
                  channel: "email",
                  message_content: `Objet: ${message.email_subject}\n\n${message.email_body}`,
                  status: "scheduled",
                });
            }
          } catch (e) {
            console.error(`Email step failed for invoice ${invoice.id}:`, e);
          }
        } else if (nextStep.channel === "phone" && client.phone) {
          // Create a notification to prompt manual call (or auto-call via Vapi in future)
          await supabase
            .from("notifications")
            .insert({
              user_id: seq.user_id,
              invoice_id: invoice.id,
              title: "📞 Appel de suivi recommandé",
              message: `La séquence automatique recommande un appel à ${client.name} (${client.phone}) pour la facture de ${invoice.amount} $.`,
              type: "info",
            });
        }

        // Advance step and record action
        await supabase
          .from("invoices")
          .update({
            current_sequence_step: currentStep + 1,
            last_sequence_action_at: now.toISOString(),
            status: invoice.status === "pending" ? "in_progress" : invoice.status,
          })
          .eq("id", invoice.id);

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
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Helper: Generate reminder messages via Lovable AI
async function generateMessage(
  apiKey: string,
  invoice: any,
  client: any,
  channel: string
): Promise<{ sms: string; email_subject: string; email_body: string } | null> {
  const dueDateStr = invoice.due_date
    ? new Date(invoice.due_date).toLocaleDateString("fr-CA", { day: "numeric", month: "long" })
    : "récemment";

  const SYSTEM_PROMPT = `Tu es Lyss, l'adjointe administrative IA pour des PME au Québec. Tu génères des messages de suivi de courtoisie pour des factures en attente.

RÈGLES :
- Ton québécois professionnel, naturel, jamais robotique. Tutoie le client.
- Toujours poli et empathique. JAMAIS menaçant.
- Propose une solution flexible (paiement en 2-3 fois, Interac).
- Message court : max 4-5 phrases pour SMS, max 6-8 phrases pour courriel.
- N'inclus AUCUN lien de paiement.
- Ne mentionne JAMAIS d'intérêts, frais ou conséquences légales.

Retourne exactement un JSON : {"sms":"...","email_subject":"...","email_body":"..."}`;

  const userPrompt = `Génère les messages pour :
- Client : ${client.name}
- Montant : ${invoice.amount} $
- Facture : ${invoice.invoice_number || "N/A"}
- Échéance : ${dueDateStr}
- Canal prioritaire : ${channel}`;

  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
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

    if (!res.ok) return null;

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content || "";
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

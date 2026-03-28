import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Relevance AI Webhook — receives agent decisions and executes actions.
 *
 * Expected payload from Relevance AI (configure as a webhook tool in the agent):
 * {
 *   "secret": "<shared secret>",
 *   "action": "send_sms" | "send_email" | "schedule_call" | "add_note" | "mark_resolved" | "escalate",
 *   "invoice_id": "uuid",
 *   "user_id": "uuid",
 *   "data": {
 *     "message": "text of SMS or email body",
 *     "email_subject": "subject line (for email)",
 *     "note": "internal note text (for add_note)",
 *     "reason": "escalation reason (for escalate)"
 *   }
 * }
 */

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const TELNYX_API_KEY = Deno.env.get("TELNYX_API_KEY");
    const TELNYX_PHONE_NUMBER = Deno.env.get("TELNYX_PHONE_NUMBER");
    const WEBHOOK_SECRET = Deno.env.get("RELEVANCE_AI_WEBHOOK_SECRET");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body = await req.json();
    const { action, invoice_id, user_id, data, secret } = body;

    // Validate webhook secret if configured
    if (WEBHOOK_SECRET && secret !== WEBHOOK_SECRET) {
      console.error("Invalid webhook secret");
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!action || !invoice_id || !user_id) {
      return new Response(
        JSON.stringify({ error: "action, invoice_id et user_id requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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

    // Safety: don't act on recovered or disputed invoices
    if (invoice.status === "recovered" || invoice.status === "disputed") {
      return new Response(
        JSON.stringify({ error: `Facture ${invoice.status} — action annulée`, skipped: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const client = (invoice as any).clients;
    const result: Record<string, any> = { action, invoice_id, success: false };

    switch (action) {
      // ── SEND SMS ──
      case "send_sms": {
        if (!data?.message) {
          result.error = "data.message requis pour send_sms";
          break;
        }
        if (!client?.phone) {
          result.error = "Le client n'a pas de numéro de téléphone";
          break;
        }
        if (!TELNYX_API_KEY || !TELNYX_PHONE_NUMBER) {
          result.error = "Telnyx non configuré";
          break;
        }

        // Create reminder
        const { data: reminder, error: remErr } = await supabase
          .from("reminders")
          .insert({
            invoice_id,
            user_id,
            channel: "sms",
            message_content: data.message,
            status: "scheduled",
          })
          .select()
          .single();

        if (remErr) {
          result.error = `Erreur DB: ${remErr.message}`;
          break;
        }

        // Send via Telnyx
        const smsRes = await fetch("https://api.telnyx.com/v2/messages", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${TELNYX_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: TELNYX_PHONE_NUMBER,
            to: client.phone,
            text: data.message,
            type: "SMS",
            webhook_url: `${SUPABASE_URL}/functions/v1/telnyx-webhook`,
          }),
        });

        const smsData = await smsRes.json();
        if (smsRes.ok) {
          await supabase
            .from("reminders")
            .update({
              status: "sent",
              sent_at: new Date().toISOString(),
              delivery_status: "queued",
              delivery_provider_id: smsData.data?.id,
            })
            .eq("id", reminder.id);
          result.success = true;
          result.reminder_id = reminder.id;
        } else {
          result.error = `Telnyx error: ${JSON.stringify(smsData)}`;
        }
        break;
      }

      // ── SEND EMAIL ──
      case "send_email": {
        if (!data?.message || !data?.email_subject) {
          result.error = "data.message et data.email_subject requis pour send_email";
          break;
        }
        if (!client?.email) {
          result.error = "Le client n'a pas d'adresse courriel";
          break;
        }

        const { data: emailReminder, error: emailErr } = await supabase
          .from("reminders")
          .insert({
            invoice_id,
            user_id,
            channel: "email",
            message_content: `Objet: ${data.email_subject}\n\n${data.message}`,
            status: "scheduled",
          })
          .select()
          .single();

        if (emailErr) {
          result.error = `Erreur DB: ${emailErr.message}`;
        } else {
          result.success = true;
          result.reminder_id = emailReminder.id;
        }
        break;
      }

      // ── SCHEDULE CALL ──
      case "schedule_call": {
        if (!client?.phone) {
          result.error = "Le client n'a pas de numéro de téléphone";
          break;
        }

        const { data: settings } = await supabase
          .from("payment_settings")
          .select("assistant_name")
          .eq("user_id", user_id)
          .single();

        const assistantName = settings?.assistant_name || "Lyss";

        await supabase.from("notifications").insert({
          user_id,
          invoice_id,
          title: "📞 Appel recommandé par Relevance AI",
          message: `${assistantName} recommande un appel à ${client.name} (${client.phone}) pour la facture de ${invoice.amount} $. ${data?.reason || ""}`.trim(),
          type: "info",
        });

        result.success = true;
        break;
      }

      // ── ADD INTERNAL NOTE ──
      case "add_note": {
        if (!data?.note) {
          result.error = "data.note requis pour add_note";
          break;
        }

        await supabase.from("reminders").insert({
          invoice_id,
          user_id,
          channel: "sms",
          message_content: `[NOTE INTERNE] ${data.note}`,
          status: "sent",
          sent_at: new Date().toISOString(),
        });

        result.success = true;
        break;
      }

      // ── MARK RESOLVED / PAID ──
      case "mark_resolved":
      case "mark_paid": {
        await supabase
          .from("invoices")
          .update({
            status: "recovered",
            amount_recovered: invoice.amount,
            next_action_at: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", invoice_id);

        result.success = true;
        break;
      }

      // ── CREATE LEAD ──
      case "create_lead": {
        if (!data?.nom_entreprise) {
          result.error = "data.nom_entreprise requis pour create_lead";
          break;
        }

        const { error: leadErr } = await supabase.from("leads").insert({
          user_id,
          nom_entreprise: data.nom_entreprise,
          contact_nom: data.contact_nom || null,
          email: data.email || null,
          telephone: data.telephone || null,
          statut: data.statut || "nouveau",
          source: data.source || "relevance_ai",
          notes: data.notes || null,
        });

        if (leadErr) {
          result.error = `Erreur DB: ${leadErr.message}`;
        } else {
          result.success = true;
        }
        break;
      }

      // ── ESCALATE TO HUMAN ──
      case "escalate": {
        const { data: escSettings } = await supabase
          .from("payment_settings")
          .select("assistant_name")
          .eq("user_id", user_id)
          .single();

        await supabase.from("notifications").insert({
          user_id,
          invoice_id,
          title: "🚨 Escalade — Intervention humaine requise",
          message: `${escSettings?.assistant_name || "Lyss"} recommande une intervention manuelle pour ${client.name} (${invoice.amount} $). Raison: ${data?.reason || "Décision de l'agent IA"}`,
          type: "warning",
        });

        result.success = true;
        break;
      }

      default:
        result.error = `Action inconnue: ${action}`;
    }

    // Audit log
    await supabase.from("audit_logs").insert({
      user_id,
      entity_type: "relevance_ai_webhook",
      entity_id: invoice_id,
      action: `webhook_${action}`,
      details: { success: result.success, error: result.error || null },
    });

    // Update invoice timestamp
    if (result.success && action !== "mark_resolved" && action !== "mark_paid") {
      await supabase
        .from("invoices")
        .update({
          last_sequence_action_at: new Date().toISOString(),
          status: invoice.status === "pending" ? "in_progress" : invoice.status,
        })
        .eq("id", invoice_id);
    }

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("relevance-ai-webhook error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

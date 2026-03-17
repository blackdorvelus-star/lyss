import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing Supabase credentials");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const body = await req.json();

    const eventType = body.data?.event_type;
    const payload = body.data?.payload;

    if (!eventType || !payload) {
      return new Response(JSON.stringify({ received: true }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Telnyx webhook event:", eventType);

    // ── SMS delivery status updates ──
    if (eventType.startsWith("message.")) {
      const messageId = payload.id;
      const status = payload.to?.[0]?.status || payload.status;

      let deliveryStatus = "unknown";
      switch (status) {
        case "queued": deliveryStatus = "queued"; break;
        case "sending": deliveryStatus = "sending"; break;
        case "sent": deliveryStatus = "sent"; break;
        case "delivered": deliveryStatus = "delivered"; break;
        case "delivery_failed":
        case "sending_failed": deliveryStatus = "failed"; break;
        default: deliveryStatus = status || "unknown";
      }

      const updateData: Record<string, unknown> = { delivery_status: deliveryStatus };
      if (deliveryStatus === "delivered") {
        updateData.delivered_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("reminders")
        .update(updateData)
        .eq("delivery_provider_id", messageId);

      if (error) console.error("Error updating delivery status:", error);
    }

    // ── Incoming SMS replies ──
    if (eventType === "message.received") {
      const fromNumber = payload.from?.phone_number;
      const messageText = payload.text;

      if (fromNumber && messageText) {
        const { data: reminders } = await supabase
          .from("reminders")
          .select("*, invoices(*, clients(*))")
          .eq("channel", "sms")
          .eq("status", "sent")
          .order("sent_at", { ascending: false });

        const matchedReminder = reminders?.find(
          (r: any) => r.invoices?.clients?.phone === fromNumber
        );

        if (matchedReminder) {
          await supabase.from("reminders").update({
            sms_response: messageText,
            sms_response_at: new Date().toISOString(),
            response: messageText,
          }).eq("id", matchedReminder.id);

          await supabase.from("notifications").insert({
            user_id: matchedReminder.user_id,
            invoice_id: matchedReminder.invoice_id,
            title: "Réponse SMS reçue 📱",
            message: `${matchedReminder.invoices?.clients?.name} a répondu : "${messageText.substring(0, 100)}"`,
            type: "info",
          });
        }
      }
    }

    // ── Call events ──
    if (eventType.startsWith("call.")) {
      const callControlId = payload.call_control_id;
      if (!callControlId) {
        console.log("No call_control_id in call event");
        return new Response(JSON.stringify({ received: true }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (eventType === "call.answered") {
        await supabase.from("call_logs").update({
          status: "active",
        }).eq("vapi_call_id", callControlId);
      }

      if (eventType === "call.hangup" || eventType === "call.machine.detection.ended") {
        const startTime = payload.start_time ? new Date(payload.start_time) : null;
        const endTime = payload.end_time ? new Date(payload.end_time) : null;
        const durationSeconds = startTime && endTime
          ? Math.round((endTime.getTime() - startTime.getTime()) / 1000)
          : null;

        let callResult = "completed";
        if (eventType === "call.machine.detection.ended") {
          callResult = payload.result === "machine" ? "voicemail" : "completed";
        }
        if (payload.hangup_cause === "normal_clearing") callResult = "completed";
        if (payload.hangup_cause === "no_answer") callResult = "no_answer";
        if (payload.hangup_cause === "busy") callResult = "busy";

        await supabase.from("call_logs").update({
          status: "completed",
          duration_seconds: durationSeconds,
          ended_at: new Date().toISOString(),
          call_result: callResult,
        }).eq("vapi_call_id", callControlId);

        // Also create a notification
        const { data: callLog } = await supabase
          .from("call_logs")
          .select("user_id, invoice_id")
          .eq("vapi_call_id", callControlId)
          .single();

        if (callLog) {
          const durationStr = durationSeconds
            ? `${Math.floor(durationSeconds / 60)}m${(durationSeconds % 60).toString().padStart(2, "0")}s`
            : "durée inconnue";

          await supabase.from("notifications").insert({
            user_id: callLog.user_id,
            invoice_id: callLog.invoice_id,
            title: "📞 Appel terminé",
            message: `Appel de suivi terminé (${durationStr}) — ${callResult === "voicemail" ? "Boîte vocale" : callResult === "no_answer" ? "Sans réponse" : "Complété"}.`,
            type: "info",
          });
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("telnyx-webhook error:", e);
    return new Response(JSON.stringify({ error: "Webhook processing failed" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

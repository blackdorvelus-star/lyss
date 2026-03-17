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
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Telnyx webhook event:", eventType);

    // Handle delivery status updates
    if (eventType.startsWith("message.")) {
      const messageId = payload.id;
      const status = payload.to?.[0]?.status || payload.status;

      // Map Telnyx statuses to our statuses
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

      const updateData: Record<string, unknown> = {
        delivery_status: deliveryStatus,
      };

      if (deliveryStatus === "delivered") {
        updateData.delivered_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("reminders")
        .update(updateData)
        .eq("delivery_provider_id", messageId);

      if (error) {
        console.error("Error updating delivery status:", error);
      }
    }

    // Handle incoming SMS replies
    if (eventType === "message.received") {
      const fromNumber = payload.from?.phone_number;
      const messageText = payload.text;

      if (fromNumber && messageText) {
        // Find the most recent SMS reminder sent to this number
        const { data: reminders } = await supabase
          .from("reminders")
          .select("*, invoices(*, clients(*))")
          .eq("channel", "sms")
          .eq("status", "sent")
          .order("sent_at", { ascending: false });

        // Match by client phone number
        const matchedReminder = reminders?.find(
          (r: any) => r.invoices?.clients?.phone === fromNumber
        );

        if (matchedReminder) {
          // Update the reminder with the response
          await supabase
            .from("reminders")
            .update({
              sms_response: messageText,
              sms_response_at: new Date().toISOString(),
              response: messageText,
            })
            .eq("id", matchedReminder.id);

          // Create a notification for the user
          await supabase
            .from("notifications")
            .insert({
              user_id: matchedReminder.user_id,
              invoice_id: matchedReminder.invoice_id,
              title: "Réponse SMS reçue 📱",
              message: `${matchedReminder.invoices?.clients?.name} a répondu : "${messageText.substring(0, 100)}"`,
              type: "info",
            });
        } else {
          console.log("No matching reminder found for incoming SMS from:", fromNumber);
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("telnyx-webhook error:", e);
    return new Response(JSON.stringify({ error: "Webhook processing failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TELNYX_API_URL = "https://api.telnyx.com/v2";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const TELNYX_API_KEY = Deno.env.get("TELNYX_API_KEY");
    if (!TELNYX_API_KEY) throw new Error("TELNYX_API_KEY is not configured");

    const TELNYX_PHONE_NUMBER = Deno.env.get("TELNYX_PHONE_NUMBER");
    if (!TELNYX_PHONE_NUMBER) throw new Error("TELNYX_PHONE_NUMBER is not configured");

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

    const { reminder_id } = await req.json();
    if (!reminder_id) {
      return new Response(JSON.stringify({ error: "reminder_id requis" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch the reminder with invoice + client info
    const { data: reminder, error: remError } = await supabase
      .from("reminders")
      .select("*, invoices(*, clients(*))")
      .eq("id", reminder_id)
      .eq("user_id", user.id)
      .single();

    if (remError || !reminder) {
      return new Response(JSON.stringify({ error: "Relance introuvable" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (reminder.channel !== "sms") {
      return new Response(JSON.stringify({ error: "Cette relance n'est pas un SMS" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const clientPhone = reminder.invoices?.clients?.phone;
    if (!clientPhone) {
      return new Response(JSON.stringify({ error: "Le client n'a pas de numéro de téléphone" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send SMS via Telnyx
    const telnyxResponse = await fetch(`${TELNYX_API_URL}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TELNYX_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: TELNYX_PHONE_NUMBER,
        to: clientPhone,
        text: reminder.message_content,
        type: "SMS",
        webhook_url: `${SUPABASE_URL}/functions/v1/telnyx-webhook`,
        webhook_failover_url: `${SUPABASE_URL}/functions/v1/telnyx-webhook`,
      }),
    });

    const telnyxData = await telnyxResponse.json();

    if (!telnyxResponse.ok) {
      console.error("Telnyx API error:", JSON.stringify(telnyxData));
      throw new Error(`Telnyx error [${telnyxResponse.status}]: ${JSON.stringify(telnyxData)}`);
    }

    const messageId = telnyxData.data?.id;

    // Update reminder with sent status and provider ID
    await supabase
      .from("reminders")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        delivery_status: "queued",
        delivery_provider_id: messageId,
      })
      .eq("id", reminder_id);

    return new Response(
      JSON.stringify({
        success: true,
        message_id: messageId,
        to: clientPhone,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("send-sms error:", e);
    const message = e instanceof Error ? e.message : "Erreur inconnue";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

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
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Missing Supabase credentials");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const anonClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { invoice_id, client_phone, client_name, amount, invoice_number } = await req.json();
    if (!invoice_id || !client_phone) {
      return new Response(JSON.stringify({ error: "invoice_id et client_phone requis" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch user settings
    const { data: settings } = await supabase
      .from("payment_settings")
      .select("*")
      .eq("user_id", user.id)
      .single();

    // Check if phone channel is active
    const activeChannels = (settings?.active_channels as string[]) || ["sms", "email", "phone"];
    if (!activeChannels.includes("phone")) {
      return new Response(JSON.stringify({ error: "Le canal téléphone est désactivé dans vos réglages" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Initiate call via Telnyx
    const telnyxResponse = await fetch(`${TELNYX_API_URL}/calls`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TELNYX_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        connection_id: Deno.env.get("TELNYX_CONNECTION_ID") || undefined,
        to: client_phone,
        from: TELNYX_PHONE_NUMBER,
        webhook_url: `${SUPABASE_URL}/functions/v1/telnyx-webhook`,
        webhook_url_method: "POST",
        answering_machine_detection: "detect",
      }),
    });

    const telnyxData = await telnyxResponse.json();

    if (!telnyxResponse.ok) {
      console.error("Telnyx call error:", JSON.stringify(telnyxData));
      throw new Error(`Telnyx error [${telnyxResponse.status}]: ${JSON.stringify(telnyxData)}`);
    }

    const callControlId = telnyxData.data?.call_control_id;
    const callLegId = telnyxData.data?.call_leg_id;

    // Create call log
    const { data: callLog } = await supabase
      .from("call_logs")
      .insert({
        user_id: user.id,
        invoice_id,
        status: "initiated",
        vapi_call_id: callControlId, // reusing column for telnyx call control id
      })
      .select("id")
      .single();

    return new Response(
      JSON.stringify({
        success: true,
        call_control_id: callControlId,
        call_leg_id: callLegId,
        call_log_id: callLog?.id,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("make-call error:", e);
    const message = e instanceof Error ? e.message : "Erreur inconnue";
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

    const { call_control_id } = await req.json();
    if (!call_control_id) {
      return new Response(JSON.stringify({ error: "call_control_id requis" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const telnyxResponse = await fetch(
      `${TELNYX_API_URL}/calls/${call_control_id}/actions/hangup`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${TELNYX_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      }
    );

    if (!telnyxResponse.ok) {
      const data = await telnyxResponse.json();
      console.error("Telnyx hangup error:", JSON.stringify(data));
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("hangup-call error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

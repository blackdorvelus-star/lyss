import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log("Vapi webhook received:", JSON.stringify(payload).slice(0, 500));

    const { message } = payload;
    if (!message) {
      return new Response(JSON.stringify({ ok: true, skipped: "no message" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const messageType = message.type;

    // We care about end-of-call-report
    if (messageType !== "end-of-call-report") {
      return new Response(JSON.stringify({ ok: true, skipped: messageType }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const call = message.call || {};
    const vapiCallId = call.id || message.callId || null;
    const durationSeconds = call.duration ? Math.round(call.duration) : null;
    const endedAt = call.endedAt || new Date().toISOString();
    const summary = message.summary || null;
    const endedReason = message.endedReason || call.endedReason || null;

    // Extract sentiment from analysis if available
    let clientSentiment: string | null = null;
    let callResult: string | null = null;

    if (message.analysis) {
      clientSentiment = message.analysis.sentiment || null;
      callResult = message.analysis.successEvaluation || null;
    }

    // Map endedReason to a call result if analysis didn't provide one
    if (!callResult && endedReason) {
      const reasonMap: Record<string, string> = {
        "customer-ended-call": "client_ended",
        "assistant-ended-call": "completed",
        "silence-timed-out": "no_response",
        "max-duration-reached": "max_duration",
        "customer-did-not-answer": "no_answer",
        "voicemail": "voicemail",
      };
      callResult = reasonMap[endedReason] || endedReason;
    }

    if (!vapiCallId) {
      console.log("No vapi_call_id found in webhook payload");
      return new Response(JSON.stringify({ ok: true, skipped: "no call id" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Try to update existing call log by vapi_call_id
    const { data: existing } = await supabase
      .from("call_logs")
      .select("id")
      .eq("vapi_call_id", vapiCallId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("call_logs")
        .update({
          status: "completed",
          duration_seconds: durationSeconds,
          ended_at: endedAt,
          summary,
          client_sentiment: clientSentiment,
          call_result: callResult,
        })
        .eq("id", existing.id);

      if (error) console.error("Error updating call_log:", error);
      else console.log("Updated call_log:", existing.id);
    } else {
      console.log("No matching call_log found for vapi_call_id:", vapiCallId);
    }

    return new Response(JSON.stringify({ ok: true, updated: !!existing }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

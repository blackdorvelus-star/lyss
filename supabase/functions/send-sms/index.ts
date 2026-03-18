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

    const { reminder_id } = await req.json();
    if (!reminder_id) {
      return new Response(JSON.stringify({ error: "reminder_id requis" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch reminder AND user settings in parallel
    const [remRes, settingsRes] = await Promise.all([
      supabase
        .from("reminders")
        .select("*, invoices(*, clients(*))")
        .eq("id", reminder_id)
        .eq("user_id", user.id)
        .single(),
      supabase
        .from("payment_settings")
        .select("active_channels, working_hours_start, working_hours_end, working_days")
        .eq("user_id", user.id)
        .single(),
    ]);

    const reminder = remRes.data;
    if (remRes.error || !reminder) {
      return new Response(JSON.stringify({ error: "Relance introuvable" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (reminder.channel !== "sms") {
      return new Response(JSON.stringify({ error: "Cette relance n'est pas un SMS" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Garde-fou : vérifier que la facture n'est pas déjà réglée ──
    const invoiceStatus = reminder.invoices?.status;
    if (invoiceStatus === "recovered") {
      return new Response(JSON.stringify({ error: "Cette facture est déjà réglée. SMS annulé pour éviter un doublon." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (invoiceStatus === "disputed") {
      return new Response(JSON.stringify({ error: "Cette facture est en litige. Les relances sont suspendues." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if SMS channel is active in user settings
    const settings = settingsRes.data;
    if (settings) {
      const activeChannels = (settings.active_channels as string[]) || ["sms", "email", "phone"];
      if (!activeChannels.includes("sms")) {
        return new Response(JSON.stringify({ error: "Le canal SMS est désactivé dans vos réglages" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check working hours
      const now = new Date();
      const montrealTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Montreal" }));
      const currentHour = `${String(montrealTime.getHours()).padStart(2, "0")}:${String(montrealTime.getMinutes()).padStart(2, "0")}`;
      const start = settings.working_hours_start || "08:00";
      const end = settings.working_hours_end || "18:00";

      if (currentHour < start || currentHour > end) {
        return new Response(JSON.stringify({
          error: `Envoi hors des heures de travail (${start} - ${end}). Le SMS sera envoyé au prochain créneau.`,
        }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check working days
      const dayMap = ["dim", "lun", "mar", "mer", "jeu", "ven", "sam"];
      const currentDay = dayMap[montrealTime.getDay()];
      const workingDays = (settings.working_days as string[]) || ["lun", "mar", "mer", "jeu", "ven"];
      if (!workingDays.includes(currentDay)) {
        return new Response(JSON.stringify({
          error: "Envoi hors des jours de travail configurés. Le SMS sera envoyé au prochain jour ouvrable.",
        }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const clientPhone = reminder.invoices?.clients?.phone;
    if (!clientPhone) {
      return new Response(JSON.stringify({ error: "Le client n'a pas de numéro de téléphone" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
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
      JSON.stringify({ success: true, message_id: messageId, to: clientPhone }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("send-sms error:", e);
    const message = e instanceof Error ? e.message : "Erreur inconnue";
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

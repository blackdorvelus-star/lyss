import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface CreateAppointmentRequest {
  slot_id: string;
  client_name: string;
  client_email?: string;
  client_phone?: string;
  title?: string;
  description?: string;
  location?: string;
  meeting_link?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { slot_id, client_name, client_email, client_phone, title, description, location, meeting_link }: CreateAppointmentRequest = await req.json();

    if (!slot_id || !client_name) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Verify slot exists and is available
    const { data: slot, error: slotError } = await supabase
      .from("available_slots")
      .select(`
        *,
        appointment_type:appointment_types (
          id,
          name,
          duration_minutes
        )
      `)
      .eq("id", slot_id)
      .eq("booked", false)
      .single();

    if (slotError || !slot) {
      return new Response(JSON.stringify({ error: "Slot not available or not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Check if slot belongs to user
    if (slot.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Create appointment
    const appointmentData = {
      user_id: user.id,
      appointment_type_id: slot.appointment_type_id,
      title: title || `Rendez-vous avec ${client_name}`,
      description,
      start_time: slot.start_time,
      end_time: slot.end_time,
      timezone: 'America/Toronto', // Default, should come from user settings
      status: 'scheduled',
      client_name,
      client_email: client_email || null,
      client_phone: client_phone || null,
      location: location || (meeting_link ? 'Visio-conférence' : 'Phone call'),
      meeting_link: meeting_link || null,
    };

    const { data: appointment, error: appointmentError } = await supabase
      .from("appointments")
      .insert(appointmentData)
      .select()
      .single();

    if (appointmentError) {
      console.error("Failed to create appointment:", appointmentError);
      return new Response(JSON.stringify({ error: "Failed to create appointment" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Mark slot as booked
    const { error: updateError } = await supabase
      .from("available_slots")
      .update({ booked: true, booked_by_appointment_id: appointment.id })
      .eq("id", slot_id);

    if (updateError) {
      console.error("Failed to update slot:", updateError);
      // Don't fail the whole request, just log it
    }

    // 5. Send confirmation email (if email provided)
    if (client_email) {
      try {
        await supabase.functions.invoke("send-appointment-confirmation", {
          body: {
            appointment_id: appointment.id,
            to_email: client_email,
          },
        });
      } catch (emailError) {
        console.warn("Failed to send confirmation email:", emailError);
      }
    }

    // 6. Send confirmation SMS (if phone provided)
    if (client_phone) {
      try {
        await supabase.functions.invoke("send-sms", {
          body: {
            to: client_phone,
            message: `Bonjour ${client_name}, votre rendez-vous est confirmé pour le ${new Date(slot.start_time).toLocaleDateString('fr-CA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} à ${new Date(slot.start_time).toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })}.`,
          },
        });
      } catch (smsError) {
        console.warn("Failed to send confirmation SMS:", smsError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        appointment,
        message: "Rendez-vous créé avec succès",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("create-appointment error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

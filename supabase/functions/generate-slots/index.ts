import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface GenerateSlotsRequest {
  days_ahead?: number;
  appointment_type_id?: string;
}

interface CalendarSettings {
  timezone: string;
  work_hours_start: string;
  work_hours_end: string;
  work_days: number[];
  slot_duration_minutes: number;
  buffer_before_minutes: number;
  buffer_after_minutes: number;
  max_daily_appointments: number;
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

    const { days_ahead = 14, appointment_type_id }: GenerateSlotsRequest = await req.json();

    // 1. Get user's calendar settings
    const { data: settings, error: settingsError } = await supabase
      .from("calendar_settings")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (settingsError || !settings) {
      // Create default settings if none exist
      const defaultSettings: CalendarSettings = {
        timezone: "America/Toronto",
        work_hours_start: "09:00:00",
        work_hours_end: "17:00:00",
        work_days: [1, 2, 3, 4, 5], // Mon-Fri
        slot_duration_minutes: 30,
        buffer_before_minutes: 5,
        buffer_after_minutes: 10,
        max_daily_appointments: 8,
      };

      const { data: newSettings, error: insertError } = await supabase
        .from("calendar_settings")
        .insert({ user_id: user.id, ...defaultSettings })
        .select()
        .single();

      if (insertError) {
        console.error("Failed to create default calendar settings:", insertError);
        return new Response(JSON.stringify({ error: "Calendar configuration error" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return await generateSlots(supabase, user.id, newSettings, days_ahead, appointment_type_id);
    }

    return await generateSlots(supabase, user.id, settings, days_ahead, appointment_type_id);
  } catch (error) {
    console.error("generate-slots error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function generateSlots(
  supabase: any,
  userId: string,
  settings: CalendarSettings,
  daysAhead: number,
  appointmentTypeId?: string
) {
  const slots = [];
  const now = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + daysAhead);

  // Get existing appointments to block booked times
  const { data: existingAppointments, error: appointmentsError } = await supabase
    .from("appointments")
    .select("start_time, end_time")
    .eq("user_id", userId)
    .gte("start_time", now.toISOString())
    .lte("start_time", endDate.toISOString())
    .in("status", ["scheduled", "confirmed"]);

  if (appointmentsError) {
    console.error("Failed to fetch existing appointments:", appointmentsError);
  }

  const bookedTimes = existingAppointments?.map((apt: any) => ({
    start: new Date(apt.start_time),
    end: new Date(apt.end_time),
  })) || [];

  // Get appointment type duration if specified
  let slotDuration = settings.slot_duration_minutes;
  if (appointmentTypeId) {
    const { data: appointmentType } = await supabase
      .from("appointment_types")
      .select("duration_minutes")
      .eq("id", appointmentTypeId)
      .single();
    
    if (appointmentType?.duration_minutes) {
      slotDuration = appointmentType.duration_minutes;
    }
  }

  // Generate slots for each day
  for (let day = 0; day < daysAhead; day++) {
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() + day);
    currentDate.setHours(0, 0, 0, 0);

    const dayOfWeek = currentDate.getDay(); // 0=Sunday, 1=Monday, etc.
    const adjustedDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek; // Convert to 1=Monday, 7=Sunday

    // Skip non-work days
    if (!settings.work_days.includes(adjustedDayOfWeek)) {
      continue;
    }

    const [startHour, startMinute] = settings.work_hours_start.split(":").map(Number);
    const [endHour, endMinute] = settings.work_hours_end.split(":").map(Number);

    const workStart = new Date(currentDate);
    workStart.setHours(startHour, startMinute, 0, 0);

    const workEnd = new Date(currentDate);
    workEnd.setHours(endHour, endMinute, 0, 0);

    // Generate slots for this day
    let slotStart = new Date(workStart);
    let dailyAppointmentCount = 0;

    while (slotStart < workEnd && dailyAppointmentCount < settings.max_daily_appointments) {
      const slotEnd = new Date(slotStart);
      slotEnd.setMinutes(slotEnd.getMinutes() + slotDuration);

      // Check if slot overlaps with any booked time
      const isBooked = bookedTimes.some((booked: any) => {
        return (
          (slotStart >= booked.start && slotStart < booked.end) ||
          (slotEnd > booked.start && slotEnd <= booked.end) ||
          (slotStart <= booked.start && slotEnd >= booked.end)
        );
      });

      // Check if slot is in the past
      const isPast = slotStart < now;

      if (!isBooked && !isPast && slotEnd <= workEnd) {
        slots.push({
          date: currentDate.toISOString().split("T")[0],
          start_time: slotStart.toISOString(),
          end_time: slotEnd.toISOString(),
          duration_minutes: slotDuration,
          appointment_type_id: appointmentTypeId || null,
        });
        dailyAppointmentCount++;
      }

      // Move to next slot with buffer
      slotStart = new Date(slotEnd);
      slotStart.setMinutes(slotStart.getMinutes() + settings.buffer_after_minutes);
    }
  }

  // Insert or update available slots
  if (slots.length > 0) {
    const { error: insertError } = await supabase
      .from("available_slots")
      .upsert(
        slots.map(slot => ({
          user_id: userId,
          date: slot.date,
          start_time: slot.start_time,
          end_time: slot.end_time,
          appointment_type_id: slot.appointment_type_id,
          booked: false,
        })),
        { onConflict: "user_id,start_time,appointment_type_id" }
      );

    if (insertError) {
      console.error("Failed to insert slots:", insertError);
    }
  }

  // Return available slots for next 7 days
  const { data: availableSlots, error: slotsError } = await supabase
    .from("available_slots")
    .select(`
      *,
      appointment_types (
        name,
        duration_minutes,
        color
      )
    `)
    .eq("user_id", userId)
    .eq("booked", false)
    .gte("start_time", now.toISOString())
    .lte("start_time", new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString())
    .order("start_time", { ascending: true });

  if (slotsError) {
    console.error("Failed to fetch available slots:", slotsError);
    return new Response(
      JSON.stringify({ error: "Failed to fetch slots" }),
      { status: 500, headers: corsHeaders, "Content-Type": "application/json" }
    );
  }

  return new Response(
    JSON.stringify({
      slots: availableSlots || [],
      settings,
      generated_count: slots.length,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

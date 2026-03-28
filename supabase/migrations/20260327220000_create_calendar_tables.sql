-- Migration: create calendar tables for appointment scheduling
-- Purpose: simple Calendly-like functionality for Lyss users

-- Calendar settings per user
CREATE TABLE IF NOT EXISTS calendar_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  timezone TEXT DEFAULT 'America/Toronto',
  work_hours_start TIME DEFAULT '09:00:00',
  work_hours_end TIME DEFAULT '17:00:00',
  work_days INTEGER[] DEFAULT '{1,2,3,4,5}', -- 1=Monday, 7=Sunday
  slot_duration_minutes INTEGER DEFAULT 30,
  buffer_before_minutes INTEGER DEFAULT 5,
  buffer_after_minutes INTEGER DEFAULT 10,
  max_daily_appointments INTEGER DEFAULT 8,
  calendar_integration JSONB DEFAULT '{"type": "none"}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Appointment types (e.g., "Consultation recouvrement", "Révision contrat")
CREATE TABLE IF NOT EXISTS appointment_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  color TEXT DEFAULT '#3b82f6', -- hex color for UI
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Scheduled appointments
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  appointment_type_id UUID REFERENCES appointment_types(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  timezone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'cancelled', 'completed', 'no_show')),
  meeting_link TEXT, -- Zoom/Teams/Google Meet link
  location TEXT, -- Physical location or "Phone call"
  client_email TEXT,
  client_phone TEXT,
  client_name TEXT NOT NULL,
  notes TEXT,
  reminder_sent BOOLEAN DEFAULT false,
  confirmation_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Available slots (pre-calculated for performance)
CREATE TABLE IF NOT EXISTS available_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  appointment_type_id UUID REFERENCES appointment_types(id) ON DELETE CASCADE,
  booked BOOLEAN DEFAULT false,
  booked_by_appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, start_time, appointment_type_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_start_time ON appointments(start_time);
CREATE INDEX IF NOT EXISTS idx_appointments_client_id ON appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_available_slots_user_date ON available_slots(user_id, date);
CREATE INDEX IF NOT EXISTS idx_available_slots_booked ON available_slots(booked) WHERE NOT booked;
CREATE INDEX IF NOT EXISTS idx_appointment_types_user ON appointment_types(user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_calendar_settings_updated_at
  BEFORE UPDATE ON calendar_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- View for today's appointments
CREATE OR REPLACE VIEW today_appointments AS
SELECT 
  a.*,
  at.name as appointment_type_name,
  at.color as appointment_type_color,
  at.duration_minutes,
  c.name as client_company_name
FROM appointments a
LEFT JOIN appointment_types at ON a.appointment_type_id = at.id
LEFT JOIN clients c ON a.client_id = c.id
WHERE DATE(a.start_time AT TIME ZONE a.timezone) = CURRENT_DATE
  AND a.status IN ('scheduled', 'confirmed')
ORDER BY a.start_time;

-- View for available slots in next 7 days
CREATE OR REPLACE VIEW next_7day_slots AS
SELECT 
  s.*,
  at.name as appointment_type_name,
  at.duration_minutes
FROM available_slots s
LEFT JOIN appointment_types at ON s.appointment_type_id = at.id
WHERE s.date BETWEEN CURRENT_DATE AND CURRENT_DATE + 7
  AND s.booked = false
  AND s.start_time > NOW()
ORDER BY s.start_time;

COMMENT ON TABLE calendar_settings IS 'User preferences for calendar/scheduling';
COMMENT ON TABLE appointment_types IS 'Types of appointments users can offer';
COMMENT ON TABLE appointments IS 'Scheduled appointments with clients';
COMMENT ON TABLE available_slots IS 'Pre-calculated available time slots for booking';
COMMENT ON VIEW today_appointments IS 'Today''s appointments with joined data';
COMMENT ON VIEW next_7day_slots IS 'Available slots for next 7 days';


-- Table to store each user's reminder sequence configuration
CREATE TABLE public.reminder_sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  steps jsonb NOT NULL DEFAULT '[
    {"day": 3, "channel": "sms", "label": "SMS de courtoisie"},
    {"day": 7, "channel": "email", "label": "Courriel de suivi"},
    {"day": 14, "channel": "phone", "label": "Appel vocal"}
  ]'::jsonb,
  max_attempts_per_channel jsonb NOT NULL DEFAULT '{"sms": 5, "email": 3, "phone": 2}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.reminder_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sequences"
  ON public.reminder_sequences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sequences"
  ON public.reminder_sequences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sequences"
  ON public.reminder_sequences FOR UPDATE
  USING (auth.uid() = user_id);

-- Timestamp trigger
CREATE TRIGGER update_reminder_sequences_updated_at
  BEFORE UPDATE ON public.reminder_sequences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Track which sequence step each invoice is on
ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS current_sequence_step integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_sequence_action_at timestamptz;

-- Enable pg_cron and pg_net for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

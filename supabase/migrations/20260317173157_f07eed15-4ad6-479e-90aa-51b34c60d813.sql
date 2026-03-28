
-- Add delivery tracking and SMS response fields to reminders
ALTER TABLE public.reminders
ADD COLUMN IF NOT EXISTS delivery_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS delivery_provider_id text,
ADD COLUMN IF NOT EXISTS delivered_at timestamptz,
ADD COLUMN IF NOT EXISTS sms_response text,
ADD COLUMN IF NOT EXISTS sms_response_at timestamptz;

-- Create index for webhook lookups by provider ID
CREATE INDEX IF NOT EXISTS idx_reminders_delivery_provider_id ON public.reminders(delivery_provider_id);

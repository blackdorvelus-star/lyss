
-- Add comprehensive customization columns to payment_settings
ALTER TABLE public.payment_settings
ADD COLUMN IF NOT EXISTS tone text DEFAULT 'tu',
ADD COLUMN IF NOT EXISTS working_hours_start text DEFAULT '08:00',
ADD COLUMN IF NOT EXISTS working_hours_end text DEFAULT '18:00',
ADD COLUMN IF NOT EXISTS working_days jsonb DEFAULT '["lun","mar","mer","jeu","ven"]'::jsonb,
ADD COLUMN IF NOT EXISTS active_channels jsonb DEFAULT '["sms","email","phone"]'::jsonb,
ADD COLUMN IF NOT EXISTS sms_signature text,
ADD COLUMN IF NOT EXISTS email_signature text,
ADD COLUMN IF NOT EXISTS ai_propose_payment_plan boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS ai_negotiate boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS ai_max_discount_percent integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS notify_on_response boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_on_payment boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_on_dispute boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_on_negative_sentiment boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS greeting_style text DEFAULT 'prenom',
ADD COLUMN IF NOT EXISTS follow_up_closing text DEFAULT 'Bonne journée !';

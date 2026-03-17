
ALTER TABLE public.payment_settings
  ADD COLUMN IF NOT EXISTS sms_template text,
  ADD COLUMN IF NOT EXISTS email_subject_template text,
  ADD COLUMN IF NOT EXISTS email_body_template text,
  ADD COLUMN IF NOT EXISTS use_custom_templates boolean NOT NULL DEFAULT false;

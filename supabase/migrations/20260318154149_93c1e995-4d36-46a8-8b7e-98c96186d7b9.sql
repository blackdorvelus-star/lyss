
ALTER TABLE public.payment_settings
  ADD COLUMN IF NOT EXISTS script_promise text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS script_dispute text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS script_no_response text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS script_partial_payment text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS script_call_full text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS script_sms_followup text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS script_email_followup text DEFAULT NULL;

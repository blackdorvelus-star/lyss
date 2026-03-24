ALTER TABLE public.payment_settings
  ADD COLUMN IF NOT EXISTS paypal_link text,
  ADD COLUMN IF NOT EXISTS bank_institution text,
  ADD COLUMN IF NOT EXISTS bank_transit text,
  ADD COLUMN IF NOT EXISTS bank_account text,
  ADD COLUMN IF NOT EXISTS bank_name text,
  ADD COLUMN IF NOT EXISTS cheque_address text,
  ADD COLUMN IF NOT EXISTS deposit_instructions text;
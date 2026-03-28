ALTER TABLE public.payment_settings
  ADD COLUMN IF NOT EXISTS vapi_voice_provider text DEFAULT 'elevenlabs',
  ADD COLUMN IF NOT EXISTS vapi_voice_id text DEFAULT '21m00Tcm4TlvDq8ikWAM',
  ADD COLUMN IF NOT EXISTS vapi_personality text DEFAULT 'chaleureuse',
  ADD COLUMN IF NOT EXISTS vapi_custom_instructions text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS vapi_first_message_template text DEFAULT NULL;
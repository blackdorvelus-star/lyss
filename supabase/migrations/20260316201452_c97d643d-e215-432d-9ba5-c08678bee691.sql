ALTER TABLE public.payment_settings ADD COLUMN IF NOT EXISTS vapi_public_key text DEFAULT NULL;

CREATE TABLE IF NOT EXISTS public.call_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  vapi_call_id text,
  status text NOT NULL DEFAULT 'initiated',
  duration_seconds integer,
  client_sentiment text,
  call_result text,
  summary text,
  created_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz
);

ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own call logs" ON public.call_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own call logs" ON public.call_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own call logs" ON public.call_logs FOR UPDATE USING (auth.uid() = user_id);
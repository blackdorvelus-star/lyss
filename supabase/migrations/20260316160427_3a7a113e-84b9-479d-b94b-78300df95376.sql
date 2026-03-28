
-- Payment settings per user (Interac email, Stripe link, company branding)
CREATE TABLE public.payment_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  interac_email text,
  interac_question text DEFAULT 'Paiement',
  interac_answer text,
  stripe_link text,
  company_name text,
  company_logo_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payment settings"
  ON public.payment_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payment settings"
  ON public.payment_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payment settings"
  ON public.payment_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- Payment tokens for public portal access
CREATE TABLE public.payment_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  expires_at timestamp with time zone DEFAULT (now() + interval '30 days'),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_tokens ENABLE ROW LEVEL SECURITY;

-- Users can manage their own tokens
CREATE POLICY "Users can view their own tokens"
  ON public.payment_tokens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tokens"
  ON public.payment_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Public read access for portal (anyone with the token can view)
CREATE POLICY "Public can view tokens by token value"
  ON public.payment_tokens FOR SELECT
  USING (true);

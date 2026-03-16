
CREATE TABLE public.freshbooks_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  account_id text NOT NULL,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  token_expires_at timestamp with time zone NOT NULL,
  business_name text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE public.freshbooks_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own FB connection"
  ON public.freshbooks_connections FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own FB connection"
  ON public.freshbooks_connections FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own FB connection"
  ON public.freshbooks_connections FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own FB connection"
  ON public.freshbooks_connections FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER update_freshbooks_connections_updated_at
  BEFORE UPDATE ON public.freshbooks_connections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

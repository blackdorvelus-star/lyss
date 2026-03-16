
DROP TABLE IF EXISTS public.freshbooks_connections;

CREATE TABLE public.sage_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  resource_owner_id text NOT NULL,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  token_expires_at timestamp with time zone NOT NULL,
  business_name text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE public.sage_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own Sage connection"
  ON public.sage_connections FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own Sage connection"
  ON public.sage_connections FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own Sage connection"
  ON public.sage_connections FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own Sage connection"
  ON public.sage_connections FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_sage_connections_updated_at
  BEFORE UPDATE ON public.sage_connections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

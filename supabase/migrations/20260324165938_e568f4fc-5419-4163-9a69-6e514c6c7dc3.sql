
-- Table collection_sequences pour l'orchestration Relevance AI
CREATE TABLE public.collection_sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company_id text NOT NULL,
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
  customer_name text NOT NULL,
  customer_email text,
  customer_phone text,
  amount_due numeric NOT NULL DEFAULT 0,
  due_date date,
  status text NOT NULL DEFAULT 'waiting',
  sequence_step text NOT NULL DEFAULT 'email_1',
  next_action_at timestamp with time zone,
  last_action_at timestamp with time zone,
  stopped_reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(company_id, invoice_id)
);

-- RLS
ALTER TABLE public.collection_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sequences"
  ON public.collection_sequences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sequences"
  ON public.collection_sequences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sequences"
  ON public.collection_sequences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Trigger updated_at
CREATE TRIGGER update_collection_sequences_updated_at
  BEFORE UPDATE ON public.collection_sequences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

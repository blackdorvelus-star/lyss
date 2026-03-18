
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own audit logs" ON public.audit_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own audit logs" ON public.audit_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_audit_logs_user_created ON public.audit_logs (user_id, created_at DESC);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs (entity_type, entity_id);

-- Auto-log invoice changes
CREATE OR REPLACE FUNCTION public.log_invoice_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (user_id, entity_type, entity_id, action, details)
    VALUES (NEW.user_id, 'invoice', NEW.id, 'created', jsonb_build_object('amount', NEW.amount, 'status', NEW.status, 'invoice_number', NEW.invoice_number));
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO public.audit_logs (user_id, entity_type, entity_id, action, details)
      VALUES (NEW.user_id, 'invoice', NEW.id, 'status_changed', jsonb_build_object('from', OLD.status, 'to', NEW.status, 'amount', NEW.amount, 'amount_recovered', NEW.amount_recovered));
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (user_id, entity_type, entity_id, action, details)
    VALUES (OLD.user_id, 'invoice', OLD.id, 'deleted', jsonb_build_object('amount', OLD.amount, 'invoice_number', OLD.invoice_number));
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER audit_invoice_changes
AFTER INSERT OR UPDATE OR DELETE ON public.invoices
FOR EACH ROW EXECUTE FUNCTION public.log_invoice_change();

-- Auto-log reminder sends
CREATE OR REPLACE FUNCTION public.log_reminder_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (user_id, entity_type, entity_id, action, details)
    VALUES (NEW.user_id, 'reminder', NEW.id, 'created', jsonb_build_object('channel', NEW.channel, 'invoice_id', NEW.invoice_id, 'status', NEW.status));
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.audit_logs (user_id, entity_type, entity_id, action, details)
    VALUES (NEW.user_id, 'reminder', NEW.id, 'status_changed', jsonb_build_object('channel', NEW.channel, 'from', OLD.status, 'to', NEW.status, 'invoice_id', NEW.invoice_id));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER audit_reminder_changes
AFTER INSERT OR UPDATE ON public.reminders
FOR EACH ROW EXECUTE FUNCTION public.log_reminder_change();

-- Auto-log call logs
CREATE OR REPLACE FUNCTION public.log_call_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (user_id, entity_type, entity_id, action, details)
    VALUES (NEW.user_id, 'call', NEW.id, 'created', jsonb_build_object('invoice_id', NEW.invoice_id, 'status', NEW.status));
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (user_id, entity_type, entity_id, action, details)
    VALUES (NEW.user_id, 'call', NEW.id, 'updated', jsonb_build_object('status', NEW.status, 'call_result', NEW.call_result, 'client_sentiment', NEW.client_sentiment, 'duration_seconds', NEW.duration_seconds));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER audit_call_changes
AFTER INSERT OR UPDATE ON public.call_logs
FOR EACH ROW EXECUTE FUNCTION public.log_call_change();

-- Auto-log quote changes
CREATE OR REPLACE FUNCTION public.log_quote_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (user_id, entity_type, entity_id, action, details)
    VALUES (NEW.user_id, 'quote', NEW.id, 'created', jsonb_build_object('amount', NEW.amount, 'status', NEW.status, 'quote_number', NEW.quote_number));
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.audit_logs (user_id, entity_type, entity_id, action, details)
    VALUES (NEW.user_id, 'quote', NEW.id, 'status_changed', jsonb_build_object('from', OLD.status, 'to', NEW.status, 'amount', NEW.amount));
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (user_id, entity_type, entity_id, action, details)
    VALUES (OLD.user_id, 'quote', OLD.id, 'deleted', jsonb_build_object('amount', OLD.amount));
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER audit_quote_changes
AFTER INSERT OR UPDATE OR DELETE ON public.quotes
FOR EACH ROW EXECUTE FUNCTION public.log_quote_change();

ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs;

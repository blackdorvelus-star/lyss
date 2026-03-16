
-- Notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'payment')),
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own notifications" ON public.notifications FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(user_id, is_read);

-- Function to auto-create notification when a reminder is created
CREATE OR REPLACE FUNCTION public.notify_on_reminder()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, invoice_id, title, message, type)
  VALUES (
    NEW.user_id,
    NEW.invoice_id,
    CASE NEW.channel
      WHEN 'sms' THEN 'SMS de relance planifié'
      WHEN 'email' THEN 'Courriel de relance planifié'
      ELSE 'Relance planifiée'
    END,
    'Un message de relance a été généré et sera envoyé prochainement.',
    'info'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_notify_on_reminder
AFTER INSERT ON public.reminders
FOR EACH ROW EXECUTE FUNCTION public.notify_on_reminder();

-- Function to notify when invoice is marked as recovered
CREATE OR REPLACE FUNCTION public.notify_on_recovery()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'recovered' AND (OLD.status IS DISTINCT FROM 'recovered') THEN
    INSERT INTO public.notifications (user_id, invoice_id, title, message, type)
    VALUES (
      NEW.user_id,
      NEW.id,
      'Facture récupérée ! 🎉',
      'Le montant de ' || NEW.amount_recovered || ' $ a été marqué comme récupéré.',
      'success'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_notify_on_recovery
AFTER UPDATE ON public.invoices
FOR EACH ROW EXECUTE FUNCTION public.notify_on_recovery();

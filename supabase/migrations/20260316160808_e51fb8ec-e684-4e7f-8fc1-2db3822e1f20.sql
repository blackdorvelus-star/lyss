
ALTER TABLE public.payment_settings
  ADD COLUMN assistant_name text DEFAULT 'Lyss',
  ADD COLUMN assistant_role text DEFAULT 'adjointe';

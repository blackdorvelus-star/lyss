
CREATE TABLE public.visitor_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_type TEXT NOT NULL DEFAULT 'exit_intent',
  reason TEXT,
  details TEXT,
  page_time_seconds INTEGER,
  page_url TEXT,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.visitor_feedback ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (anonymous visitors)
CREATE POLICY "Anyone can submit feedback"
ON public.visitor_feedback
FOR INSERT
TO public
WITH CHECK (true);

-- Only admins can read
CREATE POLICY "Admins can read feedback"
ON public.visitor_feedback
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

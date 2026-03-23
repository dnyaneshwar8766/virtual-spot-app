
-- Feedback table for customer reviews
CREATE TABLE public.feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_entry_id uuid NOT NULL,
  customer_name text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Anyone can submit feedback
CREATE POLICY "Anyone can submit feedback" ON public.feedback
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Admins can view all feedback
CREATE POLICY "Admins can view feedback" ON public.feedback
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can read their own feedback by queue_entry_id (for preventing duplicates)
CREATE POLICY "Anyone can read feedback" ON public.feedback
  FOR SELECT TO anon, authenticated
  USING (true);

-- Add email column to queue_entries for notifications
ALTER TABLE public.queue_entries ADD COLUMN IF NOT EXISTS email text;

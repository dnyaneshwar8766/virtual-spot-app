
-- Queue settings table for pause/resume and business hours
CREATE TABLE public.queue_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_paused boolean NOT NULL DEFAULT false,
  paused_message text DEFAULT 'Queue is currently paused. Please check back later.',
  business_hours_enabled boolean NOT NULL DEFAULT false,
  business_open_time time DEFAULT '09:00',
  business_close_time time DEFAULT '17:00',
  business_days integer[] DEFAULT ARRAY[1,2,3,4,5],
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

-- Insert default settings row
INSERT INTO public.queue_settings (id) VALUES (gen_random_uuid());

-- RLS
ALTER TABLE public.queue_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view queue settings"
  ON public.queue_settings FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can update queue settings"
  ON public.queue_settings FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add priority column to queue_entries
ALTER TABLE public.queue_entries ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'normal';

-- Add served_by column to queue_entries for staff tracking
ALTER TABLE public.queue_entries ADD COLUMN IF NOT EXISTS served_by uuid;

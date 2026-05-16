
-- Create login_attempts table
CREATE TABLE public.login_attempts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  ip_address text,
  attempted_at timestamptz NOT NULL DEFAULT now(),
  is_blocked boolean NOT NULL DEFAULT false
);

-- Enable RLS
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Only edge functions (service role) and admins can read
CREATE POLICY "Admins can view login attempts"
ON public.login_attempts FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow public inserts (edge function uses service role, but anon inserts must also work)
CREATE POLICY "Service can insert login attempts"
ON public.login_attempts FOR INSERT
WITH CHECK (true);

-- Admins can delete/cleanup
CREATE POLICY "Admins can delete login attempts"
ON public.login_attempts FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Index for fast lookups by email + time
CREATE INDEX idx_login_attempts_email_time ON public.login_attempts (email, attempted_at DESC);

-- Seed default max_login_attempts setting
INSERT INTO public.site_settings (key, value)
VALUES ('max_login_attempts', '3'::jsonb)
ON CONFLICT DO NOTHING;

-- Cleanup function for old attempts (older than 1 hour)
CREATE OR REPLACE FUNCTION public.cleanup_old_login_attempts()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.login_attempts
  WHERE attempted_at < now() - interval '1 hour';
$$;

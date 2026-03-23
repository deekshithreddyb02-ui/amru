
-- Create site_visits table for analytics
CREATE TABLE public.site_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id text NOT NULL,
  visited_at timestamp with time zone NOT NULL DEFAULT now(),
  user_agent text,
  page_path text DEFAULT '/'
);

-- Enable RLS
ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;

-- Anyone can insert visits (anonymous + authenticated)
CREATE POLICY "Anyone can insert visits" ON public.site_visits
  FOR INSERT TO public
  WITH CHECK (true);

-- Only admins can read visits
CREATE POLICY "Admins can read visits" ON public.site_visits
  FOR SELECT TO public
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Create index for efficient queries
CREATE INDEX idx_site_visits_visited_at ON public.site_visits (visited_at DESC);
CREATE INDEX idx_site_visits_session_id ON public.site_visits (session_id);
CREATE INDEX idx_site_visits_user_id ON public.site_visits (user_id);

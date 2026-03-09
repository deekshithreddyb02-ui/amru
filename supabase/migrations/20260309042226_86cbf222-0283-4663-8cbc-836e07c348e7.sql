-- Revert: site_settings needs public read access for navbar, footer, contact info display
-- This is NOT sensitive data - it contains display configuration only
DROP POLICY IF EXISTS "Only admins can read site_settings" ON public.site_settings;
CREATE POLICY "Anyone can read settings" ON public.site_settings
  FOR SELECT USING (true);
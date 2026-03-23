DROP POLICY IF EXISTS "Anyone can read settings" ON public.site_settings;

CREATE POLICY "Authenticated users can read settings"
  ON public.site_settings FOR SELECT
  TO authenticated USING (true);
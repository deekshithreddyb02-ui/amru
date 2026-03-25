DROP POLICY "Anyone can insert visits" ON public.site_visits;

CREATE POLICY "Anyone can insert visits" ON public.site_visits
  FOR INSERT TO public
  WITH CHECK (
    user_id IS NULL OR auth.uid() = user_id
  );
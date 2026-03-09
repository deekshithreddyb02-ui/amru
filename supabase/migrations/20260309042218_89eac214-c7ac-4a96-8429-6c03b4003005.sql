-- Fix: Restrict site_settings SELECT to admins only (currently any authenticated user can read)
DROP POLICY IF EXISTS "Authenticated users can read settings" ON public.site_settings;
CREATE POLICY "Only admins can read site_settings" ON public.site_settings
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
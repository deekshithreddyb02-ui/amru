-- Fix 1: Add WITH CHECK to reviews UPDATE policy to prevent self-verification
DROP POLICY IF EXISTS "Users can update their own reviews" ON public.reviews;
CREATE POLICY "Users can update their own reviews" ON public.reviews
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND (is_verified IS NULL OR is_verified = false));

-- Fix 2: Restrict site_settings SELECT to authenticated users only
DROP POLICY IF EXISTS "Anyone can read settings" ON public.site_settings;
CREATE POLICY "Authenticated users can read settings" ON public.site_settings
  FOR SELECT TO authenticated USING (true);
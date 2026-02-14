
-- Drop the restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "Admins can manage gallery images" ON public.gallery_images;
DROP POLICY IF EXISTS "Anyone can view visible gallery images" ON public.gallery_images;

-- Recreate as PERMISSIVE
CREATE POLICY "Admins can manage gallery images"
ON public.gallery_images
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view visible gallery images"
ON public.gallery_images
FOR SELECT
TO anon, authenticated
USING (is_visible = true);

-- Also ensure storage policies exist for the main bucket
CREATE POLICY "Admins can upload to main bucket"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'main' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update main bucket objects"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'main' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete main bucket objects"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'main' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can read main bucket objects"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'main');

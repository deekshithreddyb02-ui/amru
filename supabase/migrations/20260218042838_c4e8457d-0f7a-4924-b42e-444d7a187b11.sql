-- Tighten storage read policy to allowlist specific folders
DROP POLICY IF EXISTS "Public can read gallery and service images" ON storage.objects;

CREATE POLICY "Public can read gallery and service images"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'main' 
  AND (
    (storage.foldername(name))[1] = 'gallery'
    OR (storage.foldername(name))[1] = 'services'
    OR (storage.foldername(name))[1] = 'hero'
    OR (storage.foldername(name))[1] = 'certifications'
    OR (storage.foldername(name))[1] = 'testimonials'
    OR name NOT LIKE '%/%'
  )
);
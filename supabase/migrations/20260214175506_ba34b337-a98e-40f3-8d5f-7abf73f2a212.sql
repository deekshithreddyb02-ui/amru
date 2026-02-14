-- Replace the overly broad public read policy with path-specific ones
DROP POLICY "Anyone can read main bucket objects" ON storage.objects;

-- Allow public read access to gallery images (top-level files uploaded by admins)
-- These are referenced in gallery_images table and services
CREATE POLICY "Public can read gallery and service images"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'main' 
  AND (storage.foldername(name))[1] IS DISTINCT FROM 'chat-uploads'
);

-- Chat uploads already have a user-scoped read policy (Users can read own chat uploads)
-- No additional policy needed for chat-uploads

-- Add database-level rate limiting for contact form submissions
CREATE OR REPLACE FUNCTION public.rate_limit_contact_messages()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  recent_count INTEGER;
BEGIN
  -- Limit: max 5 submissions from same email in 1 hour
  SELECT COUNT(*) INTO recent_count
  FROM public.contact_messages
  WHERE email = NEW.email
    AND created_at > now() - interval '1 hour';

  IF recent_count >= 5 THEN
    RAISE EXCEPTION 'Too many submissions. Please try again later.';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER check_contact_rate_limit
BEFORE INSERT ON public.contact_messages
FOR EACH ROW
EXECUTE FUNCTION public.rate_limit_contact_messages();
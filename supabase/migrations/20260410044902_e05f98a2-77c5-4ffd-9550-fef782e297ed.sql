-- 1. Fix reviews UPDATE policy to prevent users from re-publishing admin-suppressed reviews
DROP POLICY IF EXISTS "Users can update their own reviews" ON public.reviews;

CREATE POLICY "Users can update their own reviews"
ON public.reviews
FOR UPDATE
TO public
USING (
  (auth.uid() = user_id)
  AND ((is_published IS NULL) OR (is_published = true))
)
WITH CHECK (
  (auth.uid() = user_id)
  AND ((is_verified IS NULL) OR (is_verified = false))
  AND ((is_published IS NULL) OR (is_published = true))
);

-- 2. Remove overly broad exclusion-based storage read policy
DROP POLICY IF EXISTS "Anyone can read public main bucket objects" ON storage.objects;
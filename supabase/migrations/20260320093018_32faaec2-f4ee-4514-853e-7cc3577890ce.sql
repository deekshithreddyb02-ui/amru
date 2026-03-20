-- Fix: Narrow public read policy on storage.objects to exclude chat-uploads folder
-- This prevents user chat attachments from being publicly readable

DROP POLICY IF EXISTS "Anyone can read main bucket objects" ON storage.objects;

CREATE POLICY "Anyone can read public main bucket objects"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'main' AND
  (storage.foldername(name))[1] != 'chat-uploads'
);
-- Remove duplicate chat upload policies from the public 'main' bucket
-- These should only exist on the private 'chat-uploads' bucket

DROP POLICY IF EXISTS "Users can upload to own chat folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own chat uploads" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own chat uploads" ON storage.objects;
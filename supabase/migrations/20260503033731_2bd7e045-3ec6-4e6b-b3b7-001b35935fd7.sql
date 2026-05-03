-- Restrict expense receipts storage policy to workspace members
DROP POLICY IF EXISTS "CRM members read expense receipts" ON storage.objects;

CREATE POLICY "CRM members read expense receipts"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'crm-documents'
  AND (storage.foldername(name))[1] = 'expenses'
  AND public.is_crm_member(auth.uid(), ((storage.foldername(name))[2])::uuid)
);

DROP POLICY IF EXISTS "CRM members upload expense receipts" ON storage.objects;

CREATE POLICY "CRM members upload expense receipts"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'crm-documents'
  AND (storage.foldername(name))[1] = 'expenses'
  AND public.is_crm_member(auth.uid(), ((storage.foldername(name))[2])::uuid)
);
DROP POLICY IF EXISTS "Public can read survey by token" ON public.crm_feedback_surveys;
DROP POLICY IF EXISTS "Public can submit response by token" ON public.crm_feedback_surveys;

DROP POLICY IF EXISTS "Members read report photos" ON storage.objects;
DROP POLICY IF EXISTS "Members upload report photos" ON storage.objects;
DROP POLICY IF EXISTS "Members delete own report photos" ON storage.objects;

CREATE POLICY "Members read report photos"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'crm-report-photos'
  AND array_length(storage.foldername(name), 1) >= 1
  AND (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$'
  AND public.is_crm_member(auth.uid(), ((storage.foldername(name))[1])::uuid)
);

CREATE POLICY "Members upload report photos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'crm-report-photos'
  AND array_length(storage.foldername(name), 1) >= 1
  AND (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$'
  AND public.is_crm_member(auth.uid(), ((storage.foldername(name))[1])::uuid)
);

CREATE POLICY "Members delete own report photos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'crm-report-photos'
  AND array_length(storage.foldername(name), 1) >= 1
  AND (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$'
  AND public.is_crm_member(auth.uid(), ((storage.foldername(name))[1])::uuid)
);

DROP POLICY IF EXISTS "No direct insert to scoring history" ON public.crm_lead_scoring_history;
DROP POLICY IF EXISTS "No direct update to scoring history" ON public.crm_lead_scoring_history;
DROP POLICY IF EXISTS "No direct delete to scoring history" ON public.crm_lead_scoring_history;

CREATE POLICY "No direct insert to scoring history"
ON public.crm_lead_scoring_history
FOR INSERT
TO public
WITH CHECK (false);

CREATE POLICY "No direct update to scoring history"
ON public.crm_lead_scoring_history
FOR UPDATE
TO public
USING (false)
WITH CHECK (false);

CREATE POLICY "No direct delete to scoring history"
ON public.crm_lead_scoring_history
FOR DELETE
TO public
USING (false);
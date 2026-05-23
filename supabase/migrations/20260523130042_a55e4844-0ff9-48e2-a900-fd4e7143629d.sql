
-- 1) Remove client INSERT on crm_audit_log; trigger crm_audit_trigger continues to log via SECURITY DEFINER.
DROP POLICY IF EXISTS "Authenticated insert audit log" ON public.crm_audit_log;

-- 2) Replace permissive anon/auth INSERT policies on crm_quotation_signatures with token-validated checks.
DROP POLICY IF EXISTS "anon insert signature" ON public.crm_quotation_signatures;
DROP POLICY IF EXISTS "auth insert signature" ON public.crm_quotation_signatures;

CREATE POLICY "anon insert signature with valid token"
ON public.crm_quotation_signatures
FOR INSERT
TO anon
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.crm_signing_tokens t
    WHERE t.quotation_id = crm_quotation_signatures.quotation_id
      AND t.workspace_id = crm_quotation_signatures.workspace_id
      AND (t.expires_at IS NULL OR t.expires_at > now())
      AND t.used_at IS NULL
  )
);

CREATE POLICY "auth insert signature with valid token"
ON public.crm_quotation_signatures
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.crm_signing_tokens t
    WHERE t.quotation_id = crm_quotation_signatures.quotation_id
      AND t.workspace_id = crm_quotation_signatures.workspace_id
      AND (t.expires_at IS NULL OR t.expires_at > now())
      AND t.used_at IS NULL
  )
  OR public.is_crm_member(auth.uid(), workspace_id)
);

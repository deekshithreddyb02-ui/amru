-- 1. Block client-side INSERTs into login_attempts.
-- Edge functions use the service_role key which bypasses RLS, so this only blocks
-- anon/authenticated direct writes (e.g., fabricating blocked status for an email).
CREATE POLICY "Block client inserts into login_attempts"
ON public.login_attempts
AS RESTRICTIVE
FOR INSERT
TO anon, authenticated
WITH CHECK (false);

-- 2. Lock down get_email_by_username: revoke from authenticated as well.
-- The check-login edge function uses the service role and is unaffected.
-- No client code calls this RPC.
REVOKE EXECUTE ON FUNCTION public.get_email_by_username(TEXT) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.get_email_by_username(TEXT) FROM PUBLIC;
-- Remove the overly permissive INSERT policy on login_attempts.
-- The record-login-attempt edge function uses the service role key,
-- which bypasses RLS, so no client-side INSERT policy is needed.
DROP POLICY IF EXISTS "Authenticated can insert login attempts" ON public.login_attempts;
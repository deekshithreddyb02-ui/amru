
DROP POLICY IF EXISTS "Service can insert login attempts" ON public.login_attempts;

-- No public insert needed; edge function uses service_role which bypasses RLS
-- Only allow authenticated inserts as a safety net
CREATE POLICY "Authenticated can insert login attempts"
ON public.login_attempts FOR INSERT
TO authenticated
WITH CHECK (true);

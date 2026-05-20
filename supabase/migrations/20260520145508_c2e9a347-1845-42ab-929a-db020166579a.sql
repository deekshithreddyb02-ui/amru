
DROP POLICY IF EXISTS "anon read token" ON public.crm_signing_tokens;
DROP POLICY IF EXISTS "Anyone view active web forms" ON public.crm_web_forms;

-- _mirror_config: only super admins
CREATE POLICY "Super admins manage mirror config"
ON public._mirror_config
FOR ALL
TO authenticated
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));


-- Block direct INSERT into crm_audit_log from clients; trigger runs as SECURITY DEFINER and bypasses RLS.
CREATE POLICY "Block direct inserts to audit log"
  ON public.crm_audit_log
  AS RESTRICTIVE
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (false);

-- Block direct INSERT into crm_notifications from clients; server-side code uses service_role.
CREATE POLICY "Block direct inserts to notifications"
  ON public.crm_notifications
  AS RESTRICTIVE
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (false);

-- Explicitly deny non-admin SELECT on deleted_users.
CREATE POLICY "Deny non-admin reads of deleted users"
  ON public.deleted_users
  AS RESTRICTIVE
  FOR SELECT
  TO anon, authenticated
  USING (public.has_role(auth.uid(), 'admin'));

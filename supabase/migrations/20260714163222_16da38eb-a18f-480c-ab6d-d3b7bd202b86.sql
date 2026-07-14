
CREATE OR REPLACE FUNCTION public.log_employee_created_audit(
  _workspace_id uuid,
  _target_user_id uuid,
  _email text,
  _full_name text,
  _username text
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _actor uuid := auth.uid();
  _actor_email text;
BEGIN
  IF NOT public.is_super_admin(_actor) THEN
    RAISE EXCEPTION 'Only super admins can log employee creation';
  END IF;

  BEGIN
    SELECT email::text INTO _actor_email FROM auth.users WHERE id = _actor;
  EXCEPTION WHEN OTHERS THEN _actor_email := NULL; END;

  INSERT INTO public.crm_audit_log
    (workspace_id, actor_id, actor_email, action, entity_type, entity_id, entity_label, changes)
  VALUES (
    _workspace_id, _actor, _actor_email, 'created', 'employee', _target_user_id,
    COALESCE(_full_name, _email, _username),
    jsonb_build_object(
      'email', _email,
      'full_name', _full_name,
      'username', _username,
      'workspace_id', _workspace_id
    )
  );
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.log_employee_created_audit(uuid, uuid, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_employee_created_audit(uuid, uuid, text, text, text) TO authenticated;

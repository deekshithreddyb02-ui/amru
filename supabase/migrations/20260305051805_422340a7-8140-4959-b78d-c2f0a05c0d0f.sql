
CREATE OR REPLACE FUNCTION public.admin_delete_user(_target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check caller is admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Prevent self-deletion
  IF auth.uid() = _target_user_id THEN
    RAISE EXCEPTION 'Cannot delete yourself';
  END IF;

  -- Delete from auth.users (cascades to user_roles, profiles, etc.)
  DELETE FROM auth.users WHERE id = _target_user_id;

  RETURN true;
END;
$$;

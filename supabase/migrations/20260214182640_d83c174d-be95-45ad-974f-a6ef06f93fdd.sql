
CREATE OR REPLACE FUNCTION public.get_users_with_emails()
RETURNS TABLE(user_id uuid, email text, created_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT au.id, au.email::text, au.created_at
  FROM auth.users au
  WHERE public.has_role(auth.uid(), 'admin')
$$;

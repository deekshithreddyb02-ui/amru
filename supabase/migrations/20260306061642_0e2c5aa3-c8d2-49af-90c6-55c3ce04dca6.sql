
DROP FUNCTION IF EXISTS public.get_users_with_emails();

CREATE OR REPLACE FUNCTION public.get_users_with_emails()
RETURNS TABLE(user_id uuid, email text, created_at timestamptz, last_sign_in_at timestamptz, is_banned boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT au.id, au.email::text, au.created_at, au.last_sign_in_at, COALESCE(au.banned_until > now(), false) as is_banned
  FROM auth.users au
  WHERE public.has_role(auth.uid(), 'admin')
$$;

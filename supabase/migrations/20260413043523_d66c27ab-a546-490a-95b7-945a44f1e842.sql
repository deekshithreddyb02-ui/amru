
-- Add username column to profiles
ALTER TABLE public.profiles ADD COLUMN username TEXT UNIQUE;

-- Create index for fast username lookups
CREATE INDEX idx_profiles_username ON public.profiles (username);

-- Security definer function to look up email by username (no auth required)
CREATE OR REPLACE FUNCTION public.get_email_by_username(_username TEXT)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT au.email::text
  FROM public.profiles p
  JOIN auth.users au ON au.id = p.user_id
  WHERE p.username = lower(trim(_username))
  LIMIT 1;
$$;

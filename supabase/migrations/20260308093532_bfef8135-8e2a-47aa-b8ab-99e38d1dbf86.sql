
-- Add is_approved column to profiles for admin approval flow
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_approved boolean NOT NULL DEFAULT true;

-- Create site_settings table for verification mode
CREATE TABLE IF NOT EXISTS public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings
CREATE POLICY "Anyone can read settings" ON public.site_settings
  FOR SELECT USING (true);

-- Only admins can update settings
CREATE POLICY "Admins can manage settings" ON public.site_settings
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Insert default verification setting
INSERT INTO public.site_settings (key, value) 
VALUES ('verification_mode', '"admin_approval"'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Create deleted_users table for recycle bin
CREATE TABLE IF NOT EXISTS public.deleted_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_user_id uuid NOT NULL,
  email text NOT NULL,
  full_name text DEFAULT '',
  phone text DEFAULT '',
  role text DEFAULT 'user',
  deleted_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.deleted_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can manage deleted users" ON public.deleted_users
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

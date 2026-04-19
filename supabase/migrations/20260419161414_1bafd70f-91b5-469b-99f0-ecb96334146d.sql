-- Promote primary admin (superadmin) to super_admin role
UPDATE public.user_roles
SET role = 'super_admin'
WHERE user_id = 'e00d115e-0240-47a7-a128-9f3af495a7d5'
  AND role = 'admin';
-- Allow targeted deletion of the duplicate admin role row
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

DELETE FROM public.user_roles
WHERE role = 'admin'
  AND user_id IN (
    SELECT user_id FROM public.user_roles WHERE role = 'super_admin'
  );

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

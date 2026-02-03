-- Add explicit DENY policies for direct mutations on user_roles table
-- This prevents privilege escalation by ensuring users cannot directly modify roles
-- Role changes must go through the admin_update_user_role() RPC function

-- Prevent direct role insertions (handle_new_user trigger uses SECURITY DEFINER, so it still works)
CREATE POLICY "Prevent direct role insertions"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (false);

-- Prevent direct role updates (must use admin_update_user_role RPC)
CREATE POLICY "Prevent direct role updates"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (false);

-- Prevent direct role deletions
CREATE POLICY "Prevent direct role deletions"
ON public.user_roles
FOR DELETE
TO authenticated
USING (false);
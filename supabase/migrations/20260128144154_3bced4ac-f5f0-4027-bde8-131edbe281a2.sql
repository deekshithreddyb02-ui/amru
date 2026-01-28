-- Create secure RPC function for admin role management
CREATE OR REPLACE FUNCTION public.admin_update_user_role(
  _target_user_id UUID,
  _new_role app_role
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _admin_count INTEGER;
BEGIN
  -- Check if caller is admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can update user roles';
  END IF;

  -- Prevent self-demotion
  IF auth.uid() = _target_user_id AND _new_role != 'admin' THEN
    RAISE EXCEPTION 'Cannot demote yourself from admin';
  END IF;

  -- Prevent removing last admin
  IF _new_role != 'admin' THEN
    SELECT COUNT(*) INTO _admin_count
    FROM public.user_roles
    WHERE role = 'admin' AND user_id != _target_user_id;
    
    IF _admin_count = 0 THEN
      RAISE EXCEPTION 'Cannot remove the last admin';
    END IF;
  END IF;

  -- Update the role
  UPDATE public.user_roles
  SET role = _new_role
  WHERE user_id = _target_user_id;

  RETURN TRUE;
END;
$$;

-- Add storage policies for chat uploads
-- Make the bucket private for chat-uploads path
CREATE POLICY "Users can upload to own chat folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'main' AND
  (storage.foldername(name))[1] = 'chat-uploads' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "Users can read own chat uploads"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'main' AND
  (storage.foldername(name))[1] = 'chat-uploads' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "Users can delete own chat uploads"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'main' AND
  (storage.foldername(name))[1] = 'chat-uploads' AND
  (storage.foldername(name))[2] = auth.uid()::text
);
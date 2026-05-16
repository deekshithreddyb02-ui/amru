-- 1. Extend role enum with management roles (committed before being used)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'crm_ceo';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'crm_support_mgr';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'crm_marketing_mgr';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'crm_ops_mgr';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'crm_accountant';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'crm_field_staff';

-- 2. Reporting hierarchy + department on workspace members
ALTER TABLE public.crm_workspace_members
  ADD COLUMN IF NOT EXISTS manager_user_id uuid,
  ADD COLUMN IF NOT EXISTS department text;

CREATE INDEX IF NOT EXISTS idx_crm_members_manager
  ON public.crm_workspace_members(workspace_id, manager_user_id);

-- 3. Permission matrix table
CREATE TABLE IF NOT EXISTS public.crm_role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.crm_workspaces(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  module text NOT NULL,
  can_view boolean NOT NULL DEFAULT true,
  can_create boolean NOT NULL DEFAULT false,
  can_edit boolean NOT NULL DEFAULT false,
  can_delete boolean NOT NULL DEFAULT false,
  can_approve boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, role, module)
);

CREATE INDEX IF NOT EXISTS idx_crm_perms_lookup
  ON public.crm_role_permissions(workspace_id, role, module);

ALTER TABLE public.crm_role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view permissions"
  ON public.crm_role_permissions FOR SELECT
  USING (public.is_crm_member(auth.uid(), workspace_id));

CREATE POLICY "CRM admins insert permissions"
  ON public.crm_role_permissions FOR INSERT
  WITH CHECK (
    public.is_super_admin(auth.uid())
    OR public.has_crm_role(auth.uid(), workspace_id, 'crm_admin'::app_role)
  );

CREATE POLICY "CRM admins update permissions"
  ON public.crm_role_permissions FOR UPDATE
  USING (
    public.is_super_admin(auth.uid())
    OR public.has_crm_role(auth.uid(), workspace_id, 'crm_admin'::app_role)
  )
  WITH CHECK (
    public.is_super_admin(auth.uid())
    OR public.has_crm_role(auth.uid(), workspace_id, 'crm_admin'::app_role)
  );

CREATE POLICY "CRM admins delete permissions"
  ON public.crm_role_permissions FOR DELETE
  USING (
    public.is_super_admin(auth.uid())
    OR public.has_crm_role(auth.uid(), workspace_id, 'crm_admin'::app_role)
  );

CREATE TRIGGER trg_crm_role_permissions_updated
  BEFORE UPDATE ON public.crm_role_permissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Permission check helper (security definer; super-admin + crm_admin always pass)
CREATE OR REPLACE FUNCTION public.crm_has_permission(
  _user_id uuid,
  _workspace_id uuid,
  _module text,
  _perm text
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_role app_role;
  _allowed boolean;
BEGIN
  IF public.is_super_admin(_user_id) THEN
    RETURN true;
  END IF;

  SELECT crm_role INTO _user_role
  FROM public.crm_workspace_members
  WHERE user_id = _user_id AND workspace_id = _workspace_id
  LIMIT 1;

  IF _user_role IS NULL THEN
    RETURN false;
  END IF;

  IF _user_role = 'crm_admin' THEN
    RETURN true;
  END IF;

  SELECT
    CASE _perm
      WHEN 'view' THEN can_view
      WHEN 'create' THEN can_create
      WHEN 'edit' THEN can_edit
      WHEN 'delete' THEN can_delete
      WHEN 'approve' THEN can_approve
      ELSE false
    END
  INTO _allowed
  FROM public.crm_role_permissions
  WHERE workspace_id = _workspace_id
    AND role = _user_role
    AND module = _module
  LIMIT 1;

  RETURN COALESCE(_allowed, false);
END;
$$;
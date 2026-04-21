-- 1. Organizations
CREATE TABLE public.crm_organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.crm_workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  industry text,
  website text,
  phone text,
  email text,
  street text,
  city text,
  state text,
  pincode text,
  country text DEFAULT 'India',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);
CREATE INDEX idx_crm_orgs_workspace ON public.crm_organizations(workspace_id);
ALTER TABLE public.crm_organizations ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_crm_orgs_updated BEFORE UPDATE ON public.crm_organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Contacts
CREATE TABLE public.crm_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.crm_workspaces(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES public.crm_organizations(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  title text,
  email text,
  phone text,
  whatsapp text,
  city text,
  state text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);
CREATE INDEX idx_crm_contacts_workspace ON public.crm_contacts(workspace_id);
CREATE INDEX idx_crm_contacts_org ON public.crm_contacts(organization_id);
ALTER TABLE public.crm_contacts ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_crm_contacts_updated BEFORE UPDATE ON public.crm_contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Deals
CREATE TABLE public.crm_deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.crm_workspaces(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES public.crm_organizations(id) ON DELETE SET NULL,
  contact_id uuid REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  lead_id uuid REFERENCES public.crm_leads(id) ON DELETE SET NULL,
  owner_id uuid,
  title text NOT NULL,
  description text,
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'INR',
  stage text NOT NULL DEFAULT 'new',
  probability integer NOT NULL DEFAULT 10,
  expected_close date,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);
CREATE INDEX idx_crm_deals_workspace ON public.crm_deals(workspace_id);
CREATE INDEX idx_crm_deals_stage ON public.crm_deals(workspace_id, stage, position);
CREATE INDEX idx_crm_deals_owner ON public.crm_deals(owner_id);
ALTER TABLE public.crm_deals ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_crm_deals_updated BEFORE UPDATE ON public.crm_deals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. RLS — orgs
CREATE POLICY "Members view orgs" ON public.crm_organizations
  FOR SELECT USING (public.is_crm_member(auth.uid(), workspace_id));
CREATE POLICY "Members create orgs" ON public.crm_organizations
  FOR INSERT WITH CHECK (public.is_crm_member(auth.uid(), workspace_id));
CREATE POLICY "Members update orgs" ON public.crm_organizations
  FOR UPDATE USING (public.is_crm_member(auth.uid(), workspace_id))
  WITH CHECK (public.is_crm_member(auth.uid(), workspace_id));
CREATE POLICY "CRM admins delete orgs" ON public.crm_organizations
  FOR DELETE USING (
    public.is_super_admin(auth.uid())
    OR public.has_crm_role(auth.uid(), workspace_id, 'crm_admin')
  );

-- 5. RLS — contacts
CREATE POLICY "Members view contacts" ON public.crm_contacts
  FOR SELECT USING (public.is_crm_member(auth.uid(), workspace_id));
CREATE POLICY "Members create contacts" ON public.crm_contacts
  FOR INSERT WITH CHECK (public.is_crm_member(auth.uid(), workspace_id));
CREATE POLICY "Members update contacts" ON public.crm_contacts
  FOR UPDATE USING (public.is_crm_member(auth.uid(), workspace_id))
  WITH CHECK (public.is_crm_member(auth.uid(), workspace_id));
CREATE POLICY "CRM admins delete contacts" ON public.crm_contacts
  FOR DELETE USING (
    public.is_super_admin(auth.uid())
    OR public.has_crm_role(auth.uid(), workspace_id, 'crm_admin')
  );

-- 6. RLS — deals
CREATE POLICY "Members view deals" ON public.crm_deals
  FOR SELECT USING (public.is_crm_member(auth.uid(), workspace_id));
CREATE POLICY "Members create deals" ON public.crm_deals
  FOR INSERT WITH CHECK (public.is_crm_member(auth.uid(), workspace_id));
CREATE POLICY "Members update deals" ON public.crm_deals
  FOR UPDATE USING (public.is_crm_member(auth.uid(), workspace_id))
  WITH CHECK (public.is_crm_member(auth.uid(), workspace_id));
CREATE POLICY "CRM admins delete deals" ON public.crm_deals
  FOR DELETE USING (
    public.is_super_admin(auth.uid())
    OR public.has_crm_role(auth.uid(), workspace_id, 'crm_admin')
  );
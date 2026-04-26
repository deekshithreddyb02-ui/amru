
-- ============================================================
-- PHASE 7: Products, Vendors, Sales Orders, Purchase Orders,
--          Marketing (Campaigns, Web Forms, Email Templates)
-- ============================================================

-- PRODUCTS
CREATE TABLE IF NOT EXISTS public.crm_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.crm_workspaces(id) ON DELETE CASCADE,
  sku text,
  name text NOT NULL,
  description text,
  product_type text NOT NULL DEFAULT 'product',
  category text,
  unit text DEFAULT 'unit',
  hsn_sac text,
  tax_rate numeric NOT NULL DEFAULT 18,
  unit_price numeric NOT NULL DEFAULT 0,
  cost_price numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'INR',
  stock_quantity numeric NOT NULL DEFAULT 0,
  reorder_level numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_crm_products_ws ON public.crm_products(workspace_id);
ALTER TABLE public.crm_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view products" ON public.crm_products FOR SELECT USING (public.is_crm_member(auth.uid(), workspace_id));
CREATE POLICY "Members create products" ON public.crm_products FOR INSERT WITH CHECK (public.is_crm_member(auth.uid(), workspace_id));
CREATE POLICY "Members update products" ON public.crm_products FOR UPDATE USING (public.is_crm_member(auth.uid(), workspace_id)) WITH CHECK (public.is_crm_member(auth.uid(), workspace_id));
CREATE POLICY "CRM admins delete products" ON public.crm_products FOR DELETE USING (public.is_super_admin(auth.uid()) OR public.has_crm_role(auth.uid(), workspace_id, 'crm_admin'));
CREATE TRIGGER trg_crm_products_updated BEFORE UPDATE ON public.crm_products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- VENDORS
CREATE TABLE IF NOT EXISTS public.crm_vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.crm_workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  contact_person text,
  email text, phone text, website text,
  gstin text, pan text,
  street text, city text, state text, pincode text, country text DEFAULT 'India',
  payment_terms text, notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_crm_vendors_ws ON public.crm_vendors(workspace_id);
ALTER TABLE public.crm_vendors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view vendors" ON public.crm_vendors FOR SELECT USING (public.is_crm_member(auth.uid(), workspace_id));
CREATE POLICY "Members create vendors" ON public.crm_vendors FOR INSERT WITH CHECK (public.is_crm_member(auth.uid(), workspace_id));
CREATE POLICY "Members update vendors" ON public.crm_vendors FOR UPDATE USING (public.is_crm_member(auth.uid(), workspace_id)) WITH CHECK (public.is_crm_member(auth.uid(), workspace_id));
CREATE POLICY "CRM admins delete vendors" ON public.crm_vendors FOR DELETE USING (public.is_super_admin(auth.uid()) OR public.has_crm_role(auth.uid(), workspace_id, 'crm_admin'));
CREATE TRIGGER trg_crm_vendors_updated BEFORE UPDATE ON public.crm_vendors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- SALES ORDERS
CREATE TABLE IF NOT EXISTS public.crm_sales_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.crm_workspaces(id) ON DELETE CASCADE,
  so_number text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  approval_status text NOT NULL DEFAULT 'draft',
  quotation_id uuid REFERENCES public.crm_quotations(id) ON DELETE SET NULL,
  deal_id uuid REFERENCES public.crm_deals(id) ON DELETE SET NULL,
  contact_id uuid REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  organization_id uuid REFERENCES public.crm_organizations(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  customer_email text, customer_phone text, customer_address text,
  customer_state text, customer_gstin text,
  order_date date NOT NULL DEFAULT CURRENT_DATE,
  delivery_date date,
  currency text NOT NULL DEFAULT 'INR',
  gst_type text NOT NULL DEFAULT 'intra',
  subtotal numeric NOT NULL DEFAULT 0,
  discount numeric NOT NULL DEFAULT 0,
  cgst numeric NOT NULL DEFAULT 0,
  sgst numeric NOT NULL DEFAULT 0,
  igst numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  notes text, terms text,
  created_by uuid, approved_by uuid, approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_crm_sales_orders_ws ON public.crm_sales_orders(workspace_id);
ALTER TABLE public.crm_sales_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view sales orders" ON public.crm_sales_orders FOR SELECT USING (public.is_crm_member(auth.uid(), workspace_id));
CREATE POLICY "Members create sales orders" ON public.crm_sales_orders FOR INSERT WITH CHECK (public.is_crm_member(auth.uid(), workspace_id));
CREATE POLICY "Members update sales orders" ON public.crm_sales_orders FOR UPDATE USING (public.is_crm_member(auth.uid(), workspace_id)) WITH CHECK (public.is_crm_member(auth.uid(), workspace_id));
CREATE POLICY "CRM admins delete sales orders" ON public.crm_sales_orders FOR DELETE USING (public.is_super_admin(auth.uid()) OR public.has_crm_role(auth.uid(), workspace_id, 'crm_admin'));
CREATE TRIGGER trg_crm_sales_orders_updated BEFORE UPDATE ON public.crm_sales_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.crm_sales_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_order_id uuid NOT NULL REFERENCES public.crm_sales_orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.crm_products(id) ON DELETE SET NULL,
  position integer NOT NULL DEFAULT 0,
  description text NOT NULL,
  hsn_sac text, unit text,
  quantity numeric NOT NULL DEFAULT 1,
  rate numeric NOT NULL DEFAULT 0,
  tax_rate numeric NOT NULL DEFAULT 18,
  amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_crm_so_items_so ON public.crm_sales_order_items(sales_order_id);
ALTER TABLE public.crm_sales_order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view so items" ON public.crm_sales_order_items FOR SELECT USING (EXISTS (SELECT 1 FROM public.crm_sales_orders s WHERE s.id = sales_order_id AND public.is_crm_member(auth.uid(), s.workspace_id)));
CREATE POLICY "Members insert so items" ON public.crm_sales_order_items FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.crm_sales_orders s WHERE s.id = sales_order_id AND public.is_crm_member(auth.uid(), s.workspace_id)));
CREATE POLICY "Members update so items" ON public.crm_sales_order_items FOR UPDATE USING (EXISTS (SELECT 1 FROM public.crm_sales_orders s WHERE s.id = sales_order_id AND public.is_crm_member(auth.uid(), s.workspace_id))) WITH CHECK (EXISTS (SELECT 1 FROM public.crm_sales_orders s WHERE s.id = sales_order_id AND public.is_crm_member(auth.uid(), s.workspace_id)));
CREATE POLICY "Members delete so items" ON public.crm_sales_order_items FOR DELETE USING (EXISTS (SELECT 1 FROM public.crm_sales_orders s WHERE s.id = sales_order_id AND public.is_crm_member(auth.uid(), s.workspace_id)));

-- PURCHASE ORDERS
CREATE TABLE IF NOT EXISTS public.crm_purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.crm_workspaces(id) ON DELETE CASCADE,
  po_number text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  approval_status text NOT NULL DEFAULT 'draft',
  vendor_id uuid REFERENCES public.crm_vendors(id) ON DELETE SET NULL,
  vendor_name text NOT NULL,
  vendor_email text, vendor_phone text, vendor_address text, vendor_gstin text,
  order_date date NOT NULL DEFAULT CURRENT_DATE,
  expected_delivery date,
  currency text NOT NULL DEFAULT 'INR',
  gst_type text NOT NULL DEFAULT 'intra',
  subtotal numeric NOT NULL DEFAULT 0,
  discount numeric NOT NULL DEFAULT 0,
  cgst numeric NOT NULL DEFAULT 0,
  sgst numeric NOT NULL DEFAULT 0,
  igst numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  notes text, terms text,
  created_by uuid, approved_by uuid, approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_crm_po_ws ON public.crm_purchase_orders(workspace_id);
ALTER TABLE public.crm_purchase_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view purchase orders" ON public.crm_purchase_orders FOR SELECT USING (public.is_crm_member(auth.uid(), workspace_id));
CREATE POLICY "Members create purchase orders" ON public.crm_purchase_orders FOR INSERT WITH CHECK (public.is_crm_member(auth.uid(), workspace_id));
CREATE POLICY "Members update purchase orders" ON public.crm_purchase_orders FOR UPDATE USING (public.is_crm_member(auth.uid(), workspace_id)) WITH CHECK (public.is_crm_member(auth.uid(), workspace_id));
CREATE POLICY "CRM admins delete purchase orders" ON public.crm_purchase_orders FOR DELETE USING (public.is_super_admin(auth.uid()) OR public.has_crm_role(auth.uid(), workspace_id, 'crm_admin'));
CREATE TRIGGER trg_crm_po_updated BEFORE UPDATE ON public.crm_purchase_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.crm_purchase_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id uuid NOT NULL REFERENCES public.crm_purchase_orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.crm_products(id) ON DELETE SET NULL,
  position integer NOT NULL DEFAULT 0,
  description text NOT NULL,
  hsn_sac text, unit text,
  quantity numeric NOT NULL DEFAULT 1,
  rate numeric NOT NULL DEFAULT 0,
  tax_rate numeric NOT NULL DEFAULT 18,
  amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_crm_po_items_po ON public.crm_purchase_order_items(purchase_order_id);
ALTER TABLE public.crm_purchase_order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view po items" ON public.crm_purchase_order_items FOR SELECT USING (EXISTS (SELECT 1 FROM public.crm_purchase_orders p WHERE p.id = purchase_order_id AND public.is_crm_member(auth.uid(), p.workspace_id)));
CREATE POLICY "Members insert po items" ON public.crm_purchase_order_items FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.crm_purchase_orders p WHERE p.id = purchase_order_id AND public.is_crm_member(auth.uid(), p.workspace_id)));
CREATE POLICY "Members update po items" ON public.crm_purchase_order_items FOR UPDATE USING (EXISTS (SELECT 1 FROM public.crm_purchase_orders p WHERE p.id = purchase_order_id AND public.is_crm_member(auth.uid(), p.workspace_id))) WITH CHECK (EXISTS (SELECT 1 FROM public.crm_purchase_orders p WHERE p.id = purchase_order_id AND public.is_crm_member(auth.uid(), p.workspace_id)));
CREATE POLICY "Members delete po items" ON public.crm_purchase_order_items FOR DELETE USING (EXISTS (SELECT 1 FROM public.crm_purchase_orders p WHERE p.id = purchase_order_id AND public.is_crm_member(auth.uid(), p.workspace_id)));

-- EMAIL TEMPLATES
CREATE TABLE IF NOT EXISTS public.crm_email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.crm_workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  subject text NOT NULL,
  body_html text NOT NULL,
  body_text text,
  category text DEFAULT 'general',
  variables jsonb DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_crm_email_tpl_ws ON public.crm_email_templates(workspace_id);
ALTER TABLE public.crm_email_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view email templates" ON public.crm_email_templates FOR SELECT USING (public.is_crm_member(auth.uid(), workspace_id));
CREATE POLICY "Members create email templates" ON public.crm_email_templates FOR INSERT WITH CHECK (public.is_crm_member(auth.uid(), workspace_id));
CREATE POLICY "Members update email templates" ON public.crm_email_templates FOR UPDATE USING (public.is_crm_member(auth.uid(), workspace_id)) WITH CHECK (public.is_crm_member(auth.uid(), workspace_id));
CREATE POLICY "CRM admins delete email templates" ON public.crm_email_templates FOR DELETE USING (public.is_super_admin(auth.uid()) OR public.has_crm_role(auth.uid(), workspace_id, 'crm_admin'));
CREATE TRIGGER trg_crm_email_tpl_updated BEFORE UPDATE ON public.crm_email_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- CAMPAIGNS
CREATE TABLE IF NOT EXISTS public.crm_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.crm_workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  channel text NOT NULL DEFAULT 'email',
  status text NOT NULL DEFAULT 'draft',
  description text,
  audience_filter jsonb DEFAULT '{}'::jsonb,
  email_template_id uuid REFERENCES public.crm_email_templates(id) ON DELETE SET NULL,
  scheduled_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  budget numeric DEFAULT 0,
  cost numeric DEFAULT 0,
  expected_revenue numeric DEFAULT 0,
  actual_revenue numeric DEFAULT 0,
  total_recipients integer DEFAULT 0,
  total_sent integer DEFAULT 0,
  total_opens integer DEFAULT 0,
  total_clicks integer DEFAULT 0,
  total_bounces integer DEFAULT 0,
  total_leads_generated integer DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_crm_campaigns_ws ON public.crm_campaigns(workspace_id);
ALTER TABLE public.crm_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view campaigns" ON public.crm_campaigns FOR SELECT USING (public.is_crm_member(auth.uid(), workspace_id));
CREATE POLICY "Members create campaigns" ON public.crm_campaigns FOR INSERT WITH CHECK (public.is_crm_member(auth.uid(), workspace_id));
CREATE POLICY "Members update campaigns" ON public.crm_campaigns FOR UPDATE USING (public.is_crm_member(auth.uid(), workspace_id)) WITH CHECK (public.is_crm_member(auth.uid(), workspace_id));
CREATE POLICY "CRM admins delete campaigns" ON public.crm_campaigns FOR DELETE USING (public.is_super_admin(auth.uid()) OR public.has_crm_role(auth.uid(), workspace_id, 'crm_admin'));
CREATE TRIGGER trg_crm_campaigns_updated BEFORE UPDATE ON public.crm_campaigns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- WEB FORMS
CREATE TABLE IF NOT EXISTS public.crm_web_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.crm_workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  redirect_url text,
  thank_you_message text DEFAULT 'Thank you for your enquiry. We will get back to you shortly.',
  auto_assign_to uuid,
  default_lead_source text DEFAULT 'web_form',
  campaign_id uuid REFERENCES public.crm_campaigns(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  total_submissions integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_crm_web_forms_ws ON public.crm_web_forms(workspace_id);
ALTER TABLE public.crm_web_forms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone view active web forms" ON public.crm_web_forms FOR SELECT USING (is_active = true);
CREATE POLICY "Members view all web forms" ON public.crm_web_forms FOR SELECT USING (public.is_crm_member(auth.uid(), workspace_id));
CREATE POLICY "Members create web forms" ON public.crm_web_forms FOR INSERT WITH CHECK (public.is_crm_member(auth.uid(), workspace_id));
CREATE POLICY "Members update web forms" ON public.crm_web_forms FOR UPDATE USING (public.is_crm_member(auth.uid(), workspace_id)) WITH CHECK (public.is_crm_member(auth.uid(), workspace_id));
CREATE POLICY "CRM admins delete web forms" ON public.crm_web_forms FOR DELETE USING (public.is_super_admin(auth.uid()) OR public.has_crm_role(auth.uid(), workspace_id, 'crm_admin'));
CREATE TRIGGER trg_crm_web_forms_updated BEFORE UPDATE ON public.crm_web_forms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- CAMPAIGN MEMBERS
CREATE TABLE IF NOT EXISTS public.crm_campaign_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.crm_workspaces(id) ON DELETE CASCADE,
  campaign_id uuid NOT NULL REFERENCES public.crm_campaigns(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  lead_id uuid REFERENCES public.crm_leads(id) ON DELETE SET NULL,
  email text, phone text,
  status text NOT NULL DEFAULT 'queued',
  sent_at timestamptz, opened_at timestamptz, clicked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_camp_members_camp ON public.crm_campaign_members(campaign_id);
CREATE INDEX IF NOT EXISTS idx_camp_members_ws ON public.crm_campaign_members(workspace_id);
ALTER TABLE public.crm_campaign_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view campaign members" ON public.crm_campaign_members FOR SELECT USING (public.is_crm_member(auth.uid(), workspace_id));
CREATE POLICY "Members create campaign members" ON public.crm_campaign_members FOR INSERT WITH CHECK (public.is_crm_member(auth.uid(), workspace_id));
CREATE POLICY "Members update campaign members" ON public.crm_campaign_members FOR UPDATE USING (public.is_crm_member(auth.uid(), workspace_id)) WITH CHECK (public.is_crm_member(auth.uid(), workspace_id));
CREATE POLICY "CRM admins delete campaign members" ON public.crm_campaign_members FOR DELETE USING (public.is_super_admin(auth.uid()) OR public.has_crm_role(auth.uid(), workspace_id, 'crm_admin'));

-- LEAD SOURCE columns
ALTER TABLE public.crm_leads
  ADD COLUMN IF NOT EXISTS lead_source text,
  ADD COLUMN IF NOT EXISTS campaign_id uuid REFERENCES public.crm_campaigns(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS web_form_id uuid REFERENCES public.crm_web_forms(id) ON DELETE SET NULL;

-- Seed permissions for new modules using the CORRECT enum values
INSERT INTO public.crm_role_permissions (workspace_id, role, module, can_view, can_create, can_edit, can_delete, can_approve)
SELECT
  w.id,
  r.role::app_role,
  m.module,
  CASE WHEN r.role IN ('crm_field_staff') AND m.module IN ('purchase_orders','vendors') THEN false ELSE true END,
  CASE WHEN r.role IN ('crm_field_staff','crm_viewer') THEN false ELSE true END,
  CASE WHEN r.role IN ('crm_field_staff','crm_viewer') THEN false ELSE true END,
  CASE WHEN r.role IN ('crm_admin','crm_ceo','crm_ops_mgr') THEN true ELSE false END,
  CASE WHEN r.role IN ('crm_admin','crm_ceo','crm_ops_mgr','crm_accountant') THEN true ELSE false END
FROM public.crm_workspaces w
CROSS JOIN (VALUES
  ('crm_admin'),('crm_ceo'),('crm_sales_mgr'),('crm_sales_rep'),
  ('crm_support_mgr'),('crm_support'),
  ('crm_marketing_mgr'),('crm_marketing'),
  ('crm_ops_mgr'),('crm_accountant'),
  ('crm_technician'),('crm_field_staff'),('crm_viewer')
) AS r(role)
CROSS JOIN (VALUES
  ('products'),('vendors'),('sales_orders'),('purchase_orders'),
  ('campaigns'),('web_forms'),('email_templates')
) AS m(module)
ON CONFLICT DO NOTHING;

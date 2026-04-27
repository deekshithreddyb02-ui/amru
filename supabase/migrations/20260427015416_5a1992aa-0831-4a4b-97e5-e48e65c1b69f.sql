
-- Drop existing policies that may conflict
DROP POLICY IF EXISTS "Members view tickets" ON public.crm_support_tickets;
DROP POLICY IF EXISTS "Members create tickets" ON public.crm_support_tickets;
DROP POLICY IF EXISTS "Members update tickets" ON public.crm_support_tickets;
DROP POLICY IF EXISTS "CRM admins delete tickets" ON public.crm_support_tickets;

-- Add columns to existing crm_support_tickets if missing
ALTER TABLE public.crm_support_tickets ADD COLUMN IF NOT EXISTS sla_policy_id uuid;
ALTER TABLE public.crm_support_tickets ADD COLUMN IF NOT EXISTS first_response_due_at timestamptz;
ALTER TABLE public.crm_support_tickets ADD COLUMN IF NOT EXISTS resolution_due_at timestamptz;
ALTER TABLE public.crm_support_tickets ADD COLUMN IF NOT EXISTS first_responded_at timestamptz;
ALTER TABLE public.crm_support_tickets ADD COLUMN IF NOT EXISTS resolved_at timestamptz;
ALTER TABLE public.crm_support_tickets ADD COLUMN IF NOT EXISTS closed_at timestamptz;
ALTER TABLE public.crm_support_tickets ADD COLUMN IF NOT EXISTS is_escalated boolean NOT NULL DEFAULT false;
ALTER TABLE public.crm_support_tickets ADD COLUMN IF NOT EXISTS escalated_at timestamptz;
ALTER TABLE public.crm_support_tickets ADD COLUMN IF NOT EXISTS customer_satisfaction integer;

-- Re-create RLS policies for tickets
ALTER TABLE public.crm_support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view tickets" ON public.crm_support_tickets FOR SELECT USING (is_crm_member(auth.uid(), workspace_id));
CREATE POLICY "Members create tickets" ON public.crm_support_tickets FOR INSERT WITH CHECK (is_crm_member(auth.uid(), workspace_id));
CREATE POLICY "Members update tickets" ON public.crm_support_tickets FOR UPDATE USING (is_crm_member(auth.uid(), workspace_id)) WITH CHECK (is_crm_member(auth.uid(), workspace_id));
CREATE POLICY "CRM admins delete tickets" ON public.crm_support_tickets FOR DELETE USING (is_super_admin(auth.uid()) OR has_crm_role(auth.uid(), workspace_id, 'crm_admin'::app_role));

-- ============= SLA POLICIES =============
CREATE TABLE IF NOT EXISTS public.crm_sla_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.crm_workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  priority text NOT NULL,
  first_response_minutes integer NOT NULL DEFAULT 60,
  resolution_minutes integer NOT NULL DEFAULT 1440,
  business_hours_only boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sla_workspace ON public.crm_sla_policies(workspace_id);

ALTER TABLE public.crm_sla_policies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members view sla" ON public.crm_sla_policies;
DROP POLICY IF EXISTS "CRM admins manage sla" ON public.crm_sla_policies;
CREATE POLICY "Members view sla" ON public.crm_sla_policies FOR SELECT USING (is_crm_member(auth.uid(), workspace_id));
CREATE POLICY "CRM admins manage sla" ON public.crm_sla_policies FOR ALL
  USING (is_super_admin(auth.uid()) OR has_crm_role(auth.uid(), workspace_id, 'crm_admin'::app_role))
  WITH CHECK (is_super_admin(auth.uid()) OR has_crm_role(auth.uid(), workspace_id, 'crm_admin'::app_role));

-- ============= WORKFLOW RULES =============
CREATE TABLE IF NOT EXISTS public.crm_workflow_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.crm_workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  entity_type text NOT NULL,
  trigger_event text NOT NULL,
  trigger_field text,
  trigger_value text,
  conditions jsonb NOT NULL DEFAULT '[]'::jsonb,
  actions jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  run_count integer NOT NULL DEFAULT 0,
  last_run_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_workflows_workspace ON public.crm_workflow_rules(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workflows_entity ON public.crm_workflow_rules(entity_type, trigger_event) WHERE is_active = true;

ALTER TABLE public.crm_workflow_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members view workflows" ON public.crm_workflow_rules;
DROP POLICY IF EXISTS "CRM admins manage workflows" ON public.crm_workflow_rules;
CREATE POLICY "Members view workflows" ON public.crm_workflow_rules FOR SELECT USING (is_crm_member(auth.uid(), workspace_id));
CREATE POLICY "CRM admins manage workflows" ON public.crm_workflow_rules FOR ALL
  USING (is_super_admin(auth.uid()) OR has_crm_role(auth.uid(), workspace_id, 'crm_admin'::app_role))
  WITH CHECK (is_super_admin(auth.uid()) OR has_crm_role(auth.uid(), workspace_id, 'crm_admin'::app_role));

-- ============= WORKFLOW EXECUTIONS =============
CREATE TABLE IF NOT EXISTS public.crm_workflow_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.crm_workspaces(id) ON DELETE CASCADE,
  workflow_id uuid NOT NULL REFERENCES public.crm_workflow_rules(id) ON DELETE CASCADE,
  entity_type text NOT NULL,
  entity_id uuid,
  trigger_event text NOT NULL,
  status text NOT NULL DEFAULT 'success',
  actions_executed jsonb NOT NULL DEFAULT '[]'::jsonb,
  error_message text,
  executed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_executions_workflow ON public.crm_workflow_executions(workflow_id, executed_at DESC);

ALTER TABLE public.crm_workflow_executions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members view executions" ON public.crm_workflow_executions;
DROP POLICY IF EXISTS "Members insert executions" ON public.crm_workflow_executions;
CREATE POLICY "Members view executions" ON public.crm_workflow_executions FOR SELECT USING (is_crm_member(auth.uid(), workspace_id));
CREATE POLICY "Members insert executions" ON public.crm_workflow_executions FOR INSERT WITH CHECK (is_crm_member(auth.uid(), workspace_id));

-- ============= APPROVAL REQUESTS =============
CREATE TABLE IF NOT EXISTS public.crm_approval_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.crm_workspaces(id) ON DELETE CASCADE,
  request_type text NOT NULL,
  entity_type text,
  entity_id uuid,
  title text NOT NULL,
  description text,
  amount numeric,
  currency text DEFAULT 'INR',
  metadata jsonb DEFAULT '{}'::jsonb,
  requested_by uuid NOT NULL,
  approver_user_id uuid,
  approver_role text,
  status text NOT NULL DEFAULT 'pending',
  decision_note text,
  decided_by uuid,
  decided_at timestamptz,
  due_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_approvals_workspace ON public.crm_approval_requests(workspace_id);
CREATE INDEX IF NOT EXISTS idx_approvals_status ON public.crm_approval_requests(status);
CREATE INDEX IF NOT EXISTS idx_approvals_approver ON public.crm_approval_requests(approver_user_id) WHERE status = 'pending';

ALTER TABLE public.crm_approval_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members view approvals" ON public.crm_approval_requests;
DROP POLICY IF EXISTS "Members create approvals" ON public.crm_approval_requests;
DROP POLICY IF EXISTS "Approver or admin updates" ON public.crm_approval_requests;
DROP POLICY IF EXISTS "CRM admins delete approvals" ON public.crm_approval_requests;
CREATE POLICY "Members view approvals" ON public.crm_approval_requests FOR SELECT USING (is_crm_member(auth.uid(), workspace_id));
CREATE POLICY "Members create approvals" ON public.crm_approval_requests FOR INSERT WITH CHECK (is_crm_member(auth.uid(), workspace_id) AND requested_by = auth.uid());
CREATE POLICY "Approver or admin updates" ON public.crm_approval_requests FOR UPDATE
  USING (
    is_super_admin(auth.uid())
    OR has_crm_role(auth.uid(), workspace_id, 'crm_admin'::app_role)
    OR approver_user_id = auth.uid()
    OR requested_by = auth.uid()
  )
  WITH CHECK (is_crm_member(auth.uid(), workspace_id));
CREATE POLICY "CRM admins delete approvals" ON public.crm_approval_requests FOR DELETE USING (is_super_admin(auth.uid()) OR has_crm_role(auth.uid(), workspace_id, 'crm_admin'::app_role));

-- ============= TIMESTAMP TRIGGERS =============
DROP TRIGGER IF EXISTS sla_updated_at ON public.crm_sla_policies;
CREATE TRIGGER sla_updated_at BEFORE UPDATE ON public.crm_sla_policies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS workflows_updated_at ON public.crm_workflow_rules;
CREATE TRIGGER workflows_updated_at BEFORE UPDATE ON public.crm_workflow_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS approvals_updated_at ON public.crm_approval_requests;
CREATE TRIGGER approvals_updated_at BEFORE UPDATE ON public.crm_approval_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============= SEED PERMISSIONS =============
INSERT INTO public.crm_role_permissions (workspace_id, role, module, can_view, can_create, can_edit, can_delete, can_approve)
SELECT w.id, r.role::app_role, m.module, r.v, r.c, r.e, r.d, r.a
FROM public.crm_workspaces w
CROSS JOIN (VALUES
  ('crm_admin', true, true, true, true, true),
  ('crm_ceo', true, true, true, false, true),
  ('crm_sales_mgr', true, true, true, false, true),
  ('crm_sales_rep', true, true, true, false, false),
  ('crm_support_mgr', true, true, true, true, true),
  ('crm_support', true, true, true, false, false),
  ('crm_marketing_mgr', true, true, true, false, false),
  ('crm_marketing', true, true, false, false, false),
  ('crm_ops_mgr', true, true, true, false, true),
  ('crm_accountant', true, false, false, false, false),
  ('crm_technician', true, false, false, false, false),
  ('crm_field_staff', true, false, false, false, false),
  ('crm_viewer', true, false, false, false, false)
) AS r(role, v, c, e, d, a)
CROSS JOIN (VALUES ('workflows'), ('approvals'), ('sla')) AS m(module)
ON CONFLICT (workspace_id, role, module) DO NOTHING;

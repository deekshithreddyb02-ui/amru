
-- ============ TEMPLATES ============
CREATE TABLE public.crm_ai_report_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.crm_workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  template_type text NOT NULL DEFAULT 'custom',
  description text,
  prompt_template text NOT NULL,
  output_schema jsonb,
  default_model text NOT NULL DEFAULT 'google/gemini-2.5-flash',
  is_default boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_ai_report_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view templates" ON public.crm_ai_report_templates
FOR SELECT USING (public.is_crm_member(auth.uid(), workspace_id));

CREATE POLICY "CRM admins manage templates" ON public.crm_ai_report_templates
FOR INSERT WITH CHECK (public.is_super_admin(auth.uid()) OR public.has_crm_role(auth.uid(), workspace_id, 'crm_admin'::app_role));

CREATE POLICY "CRM admins update templates" ON public.crm_ai_report_templates
FOR UPDATE USING (public.is_super_admin(auth.uid()) OR public.has_crm_role(auth.uid(), workspace_id, 'crm_admin'::app_role))
WITH CHECK (public.is_super_admin(auth.uid()) OR public.has_crm_role(auth.uid(), workspace_id, 'crm_admin'::app_role));

CREATE POLICY "CRM admins delete templates" ON public.crm_ai_report_templates
FOR DELETE USING (public.is_super_admin(auth.uid()) OR public.has_crm_role(auth.uid(), workspace_id, 'crm_admin'::app_role));

CREATE TRIGGER trg_crm_ai_report_templates_updated
BEFORE UPDATE ON public.crm_ai_report_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ REPORTS ============
CREATE TABLE public.crm_ai_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.crm_workspaces(id) ON DELETE CASCADE,
  template_id uuid REFERENCES public.crm_ai_report_templates(id) ON DELETE SET NULL,
  template_type text,
  title text NOT NULL,
  description text,
  related_to_type text,
  related_to_id uuid,
  customer_contact_id uuid REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  customer_org_id uuid REFERENCES public.crm_organizations(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'draft',
  current_version int NOT NULL DEFAULT 0,
  primary_owner_user_id uuid,
  rejection_reason text,
  sent_to_customer_at timestamptz,
  acknowledged_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_ai_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view reports" ON public.crm_ai_reports
FOR SELECT USING (public.is_crm_member(auth.uid(), workspace_id));

CREATE POLICY "Members create reports" ON public.crm_ai_reports
FOR INSERT WITH CHECK (public.is_crm_member(auth.uid(), workspace_id));

CREATE POLICY "Members update reports" ON public.crm_ai_reports
FOR UPDATE USING (public.is_crm_member(auth.uid(), workspace_id))
WITH CHECK (public.is_crm_member(auth.uid(), workspace_id));

CREATE POLICY "CRM admins delete reports" ON public.crm_ai_reports
FOR DELETE USING (public.is_super_admin(auth.uid()) OR public.has_crm_role(auth.uid(), workspace_id, 'crm_admin'::app_role));

CREATE TRIGGER trg_crm_ai_reports_updated
BEFORE UPDATE ON public.crm_ai_reports
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Validation trigger for status (avoid CHECK on text since flow may evolve)
CREATE OR REPLACE FUNCTION public.validate_ai_report_status()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status NOT IN ('draft','in_review','approved','rejected','sent_to_customer','acknowledged') THEN
    RAISE EXCEPTION 'Invalid report status: %', NEW.status;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_crm_ai_reports_validate_status
BEFORE INSERT OR UPDATE ON public.crm_ai_reports
FOR EACH ROW EXECUTE FUNCTION public.validate_ai_report_status();

-- ============ VERSIONS ============
CREATE TABLE public.crm_ai_report_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.crm_workspaces(id) ON DELETE CASCADE,
  report_id uuid NOT NULL REFERENCES public.crm_ai_reports(id) ON DELETE CASCADE,
  version_no int NOT NULL,
  ai_model text,
  ai_prompt text,
  user_inputs jsonb,
  photo_paths jsonb,
  rendered_markdown text,
  ai_response jsonb,
  edited_markdown text,
  is_current boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(report_id, version_no)
);

ALTER TABLE public.crm_ai_report_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view versions" ON public.crm_ai_report_versions
FOR SELECT USING (public.is_crm_member(auth.uid(), workspace_id));

CREATE POLICY "Members create versions" ON public.crm_ai_report_versions
FOR INSERT WITH CHECK (public.is_crm_member(auth.uid(), workspace_id));

CREATE POLICY "Members update versions" ON public.crm_ai_report_versions
FOR UPDATE USING (public.is_crm_member(auth.uid(), workspace_id))
WITH CHECK (public.is_crm_member(auth.uid(), workspace_id));

CREATE POLICY "CRM admins delete versions" ON public.crm_ai_report_versions
FOR DELETE USING (public.is_super_admin(auth.uid()) OR public.has_crm_role(auth.uid(), workspace_id, 'crm_admin'::app_role));

-- ============ ASSIGNMENTS ============
CREATE TABLE public.crm_ai_report_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.crm_workspaces(id) ON DELETE CASCADE,
  report_id uuid NOT NULL REFERENCES public.crm_ai_reports(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL,
  assigned_by uuid,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(report_id, user_id, role)
);

CREATE OR REPLACE FUNCTION public.validate_ai_report_assignment_role()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.role NOT IN ('owner','reviewer','approver','viewer') THEN
    RAISE EXCEPTION 'Invalid assignment role: %', NEW.role;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_crm_ai_report_assignments_validate
BEFORE INSERT OR UPDATE ON public.crm_ai_report_assignments
FOR EACH ROW EXECUTE FUNCTION public.validate_ai_report_assignment_role();

ALTER TABLE public.crm_ai_report_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view assignments" ON public.crm_ai_report_assignments
FOR SELECT USING (public.is_crm_member(auth.uid(), workspace_id));

CREATE POLICY "Members create assignments" ON public.crm_ai_report_assignments
FOR INSERT WITH CHECK (public.is_crm_member(auth.uid(), workspace_id));

CREATE POLICY "Members delete assignments" ON public.crm_ai_report_assignments
FOR DELETE USING (public.is_crm_member(auth.uid(), workspace_id));

-- ============ STATUS LOG ============
CREATE TABLE public.crm_ai_report_status_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.crm_workspaces(id) ON DELETE CASCADE,
  report_id uuid NOT NULL REFERENCES public.crm_ai_reports(id) ON DELETE CASCADE,
  from_status text,
  to_status text NOT NULL,
  by_user_id uuid,
  note text,
  changed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_ai_report_status_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view status log" ON public.crm_ai_report_status_log
FOR SELECT USING (public.is_crm_member(auth.uid(), workspace_id));

CREATE POLICY "Members append status log" ON public.crm_ai_report_status_log
FOR INSERT WITH CHECK (public.is_crm_member(auth.uid(), workspace_id) AND (by_user_id IS NULL OR by_user_id = auth.uid()));

-- ============ INDEXES ============
CREATE INDEX idx_crm_ai_reports_workspace ON public.crm_ai_reports(workspace_id);
CREATE INDEX idx_crm_ai_reports_status ON public.crm_ai_reports(workspace_id, status);
CREATE INDEX idx_crm_ai_reports_related ON public.crm_ai_reports(related_to_type, related_to_id);
CREATE INDEX idx_crm_ai_report_versions_report ON public.crm_ai_report_versions(report_id, version_no DESC);
CREATE INDEX idx_crm_ai_report_assignments_report ON public.crm_ai_report_assignments(report_id);
CREATE INDEX idx_crm_ai_report_status_log_report ON public.crm_ai_report_status_log(report_id, changed_at DESC);

-- ============ STORAGE BUCKET FOR REPORT PHOTOS ============
INSERT INTO storage.buckets (id, name, public)
VALUES ('crm-report-photos', 'crm-report-photos', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Members read report photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'crm-report-photos'
  AND EXISTS (
    SELECT 1 FROM public.crm_workspaces w
    WHERE w.id::text = (storage.foldername(name))[1]
      AND public.is_crm_member(auth.uid(), w.id)
  )
);

CREATE POLICY "Members upload report photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'crm-report-photos'
  AND EXISTS (
    SELECT 1 FROM public.crm_workspaces w
    WHERE w.id::text = (storage.foldername(name))[1]
      AND public.is_crm_member(auth.uid(), w.id)
  )
);

CREATE POLICY "Members delete own report photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'crm-report-photos'
  AND EXISTS (
    SELECT 1 FROM public.crm_workspaces w
    WHERE w.id::text = (storage.foldername(name))[1]
      AND public.is_crm_member(auth.uid(), w.id)
  )
);

-- ============ SEED 4 DEFAULT TEMPLATES PER WORKSPACE ============
INSERT INTO public.crm_ai_report_templates (workspace_id, name, template_type, description, prompt_template, default_model, is_default)
SELECT w.id, 'Site Survey Report', 'site_survey',
  'Hydrogeological site survey methodology, findings & recommendations',
  E'You are a senior hydrogeologist preparing a site survey report for Amruta HydroGeo Services. Use the provided lead/enquiry data, free-text scope, and any uploaded site photos.\n\nGenerate a professional Markdown report with the following sections:\n1. **Executive Summary**\n2. **Site Details** (location, terrain, accessibility)\n3. **Survey Methodology** (resistivity / seismic / satellite scan)\n4. **Findings** (sub-surface analysis, water-bearing zones)\n5. **Recommendations** (drilling depth, location, expected yield)\n6. **Risk Notes & Caveats**\n\nUse SI units, mention coordinates if available, keep tone factual.',
  'google/gemini-2.5-flash', true
FROM public.crm_workspaces w
WHERE NOT EXISTS (SELECT 1 FROM public.crm_ai_report_templates t WHERE t.workspace_id = w.id AND t.template_type = 'site_survey');

INSERT INTO public.crm_ai_report_templates (workspace_id, name, template_type, description, prompt_template, default_model, is_default)
SELECT w.id, 'Project Status Report', 'project_status',
  'Progress update with risks, blockers & next steps',
  E'You are a project manager at Amruta HydroGeo Services preparing a status report.\n\nSections (Markdown):\n1. **Project Overview**\n2. **Progress to Date** (% complete, milestones hit)\n3. **Activities This Period** (visits, surveys, drilling, lab tests)\n4. **Risks & Blockers**\n5. **Next Steps & Timeline**\n6. **Budget vs Actual** (only if data given)\n\nUse the linked entity data, recent activities, and free-text notes provided.',
  'google/gemini-2.5-flash', true
FROM public.crm_workspaces w
WHERE NOT EXISTS (SELECT 1 FROM public.crm_ai_report_templates t WHERE t.workspace_id = w.id AND t.template_type = 'project_status');

INSERT INTO public.crm_ai_report_templates (workspace_id, name, template_type, description, prompt_template, default_model, is_default)
SELECT w.id, 'Proposal & Costing', 'proposal',
  'Sales proposal with technical scope and line-item costing',
  E'You are a senior sales engineer preparing a customer proposal for Amruta HydroGeo Services. Currency is INR.\n\nSections (Markdown):\n1. **Executive Summary**\n2. **Customer Requirement**\n3. **Technical Scope of Work**\n4. **Methodology & Approach**\n5. **Line-Item Costing** (markdown table: Description | Qty | Rate (INR) | Amount (INR))\n6. **Total** (with GST note 18%)\n7. **Timeline & Deliverables**\n8. **Terms & Conditions**\n\nUse the lead data, free-text scope, and any reference photos. Be specific, professional, and persuasive.',
  'openai/gpt-5-mini', true
FROM public.crm_workspaces w
WHERE NOT EXISTS (SELECT 1 FROM public.crm_ai_report_templates t WHERE t.workspace_id = w.id AND t.template_type = 'proposal');

INSERT INTO public.crm_ai_report_templates (workspace_id, name, template_type, description, prompt_template, default_model, is_default)
SELECT w.id, 'Work Completion Certificate', 'completion',
  'Certificate of work completion for handover to customer',
  E'You are issuing a Work Completion Certificate on behalf of Amruta HydroGeo Services.\n\nGenerate a formal Markdown certificate with:\n1. **Certificate header** (Project name, customer, date)\n2. **Scope Completed** (bullet list of work delivered)\n3. **Final Readings / Outcomes** (depth achieved, water yield, lab results if any)\n4. **Quality Confirmation**\n5. **Handover Statement**\n6. **Signature block** (placeholder for engineer + customer)\n\nUse the project data, free-text findings, and any completion photos provided.',
  'google/gemini-2.5-flash', true
FROM public.crm_workspaces w
WHERE NOT EXISTS (SELECT 1 FROM public.crm_ai_report_templates t WHERE t.workspace_id = w.id AND t.template_type = 'completion');

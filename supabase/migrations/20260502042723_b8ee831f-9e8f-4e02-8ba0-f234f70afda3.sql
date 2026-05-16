-- Tasks table
CREATE TABLE public.crm_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.crm_workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo',
  priority TEXT NOT NULL DEFAULT 'medium',
  due_date DATE,
  due_time TIME,
  reminder_at TIMESTAMPTZ,
  estimated_hours NUMERIC(8,2),
  actual_hours NUMERIC(8,2) DEFAULT 0,
  progress INTEGER DEFAULT 0,
  tags TEXT[],
  assigned_to UUID,
  created_by UUID,
  related_lead_id UUID REFERENCES public.crm_leads(id) ON DELETE SET NULL,
  related_deal_id UUID REFERENCES public.crm_deals(id) ON DELETE SET NULL,
  related_contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  related_ticket_id UUID REFERENCES public.crm_support_tickets(id) ON DELETE SET NULL,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern TEXT,
  parent_task_id UUID REFERENCES public.crm_tasks(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ,
  completed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_crm_tasks_workspace ON public.crm_tasks(workspace_id);
CREATE INDEX idx_crm_tasks_assignee ON public.crm_tasks(assigned_to);
CREATE INDEX idx_crm_tasks_status ON public.crm_tasks(status);
CREATE INDEX idx_crm_tasks_due ON public.crm_tasks(due_date);

ALTER TABLE public.crm_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view workspace tasks"
ON public.crm_tasks AS PERMISSIVE FOR SELECT
TO authenticated
USING (public.is_crm_member(auth.uid(), workspace_id));

CREATE POLICY "Members create tasks"
ON public.crm_tasks AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (public.is_crm_member(auth.uid(), workspace_id));

CREATE POLICY "Owners and admins update tasks"
ON public.crm_tasks AS PERMISSIVE FOR UPDATE
TO authenticated
USING (
  public.has_crm_role(auth.uid(), workspace_id, 'crm_admin')
  OR assigned_to = auth.uid()
  OR created_by = auth.uid()
);

CREATE POLICY "Admins delete tasks"
ON public.crm_tasks AS PERMISSIVE FOR DELETE
TO authenticated
USING (public.has_crm_role(auth.uid(), workspace_id, 'crm_admin'));

CREATE TRIGGER trg_crm_tasks_updated_at
BEFORE UPDATE ON public.crm_tasks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.crm_task_set_completed()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status = 'done' AND (OLD.status IS NULL OR OLD.status <> 'done') THEN
    NEW.completed_at := now();
    NEW.completed_by := auth.uid();
    NEW.progress := 100;
  ELSIF NEW.status <> 'done' AND OLD.status = 'done' THEN
    NEW.completed_at := NULL;
    NEW.completed_by := NULL;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_crm_tasks_completion
BEFORE UPDATE ON public.crm_tasks
FOR EACH ROW EXECUTE FUNCTION public.crm_task_set_completed();

-- Time logs table
CREATE TABLE public.crm_task_time_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.crm_workspaces(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.crm_tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_crm_task_time_logs_task ON public.crm_task_time_logs(task_id);
CREATE INDEX idx_crm_task_time_logs_user ON public.crm_task_time_logs(user_id);

ALTER TABLE public.crm_task_time_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view workspace time logs"
ON public.crm_task_time_logs AS PERMISSIVE FOR SELECT
TO authenticated
USING (public.is_crm_member(auth.uid(), workspace_id));

CREATE POLICY "Users log own time"
ON public.crm_task_time_logs AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (
  public.is_crm_member(auth.uid(), workspace_id)
  AND user_id = auth.uid()
);

CREATE POLICY "Users update own time logs"
ON public.crm_task_time_logs AS PERMISSIVE FOR UPDATE
TO authenticated
USING (user_id = auth.uid() OR public.has_crm_role(auth.uid(), workspace_id, 'crm_admin'));

CREATE POLICY "Users delete own time logs"
ON public.crm_task_time_logs AS PERMISSIVE FOR DELETE
TO authenticated
USING (user_id = auth.uid() OR public.has_crm_role(auth.uid(), workspace_id, 'crm_admin'));

CREATE OR REPLACE FUNCTION public.crm_task_time_log_finalize()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.ended_at IS NOT NULL AND NEW.started_at IS NOT NULL THEN
    NEW.duration_minutes := GREATEST(0, EXTRACT(EPOCH FROM (NEW.ended_at - NEW.started_at))::INT / 60);
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_crm_task_time_log_finalize
BEFORE INSERT OR UPDATE ON public.crm_task_time_logs
FOR EACH ROW EXECUTE FUNCTION public.crm_task_time_log_finalize();

CREATE OR REPLACE FUNCTION public.crm_task_rollup_hours()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _task_id UUID := COALESCE(NEW.task_id, OLD.task_id);
  _total NUMERIC;
BEGIN
  SELECT COALESCE(SUM(duration_minutes), 0) / 60.0 INTO _total
  FROM public.crm_task_time_logs WHERE task_id = _task_id;
  UPDATE public.crm_tasks SET actual_hours = ROUND(_total, 2), updated_at = now()
  WHERE id = _task_id;
  RETURN COALESCE(NEW, OLD);
END $$;

CREATE TRIGGER trg_crm_task_rollup_hours
AFTER INSERT OR UPDATE OR DELETE ON public.crm_task_time_logs
FOR EACH ROW EXECUTE FUNCTION public.crm_task_rollup_hours();
-- Phase 8 part 2: Scheduled/overdue trigger engine

-- Add scheduling columns to workflow rules
ALTER TABLE public.crm_workflow_rules
  ADD COLUMN IF NOT EXISTS schedule_cron text,
  ADD COLUMN IF NOT EXISTS schedule_target_module text,
  ADD COLUMN IF NOT EXISTS schedule_filter jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS last_run_at timestamptz;

-- SLA breach tracking on tickets
ALTER TABLE public.crm_support_tickets
  ADD COLUMN IF NOT EXISTS sla_breach_notified boolean NOT NULL DEFAULT false;

-- Helper: process scheduled workflow rules + SLA breaches.
-- Called from edge function with service role.
CREATE OR REPLACE FUNCTION public.crm_run_scheduled_workflows()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rule record;
  v_row record;
  v_action jsonb;
  v_count int := 0;
  v_sla_count int := 0;
  v_now timestamptz := now();
BEGIN
  -- 1) SLA breach notifications for overdue tickets
  FOR v_row IN
    SELECT t.*, s.workspace_id AS ws
    FROM public.crm_support_tickets t
    WHERE t.due_at IS NOT NULL
      AND t.due_at < v_now
      AND t.sla_breach_notified = false
      AND COALESCE(t.status, '') NOT IN ('resolved', 'closed', 'cancelled')
    LIMIT 200
  LOOP
    INSERT INTO public.crm_notifications (
      user_id, workspace_id, type, title, body, link,
      related_entity_type, related_entity_id
    )
    SELECT
      COALESCE(v_row.assigned_to, v_row.created_by),
      v_row.workspace_id,
      'sla_breach',
      'SLA breach: ' || COALESCE(v_row.subject, 'Ticket'),
      'Ticket ' || COALESCE(v_row.ticket_number, '') || ' missed its SLA at ' || to_char(v_row.due_at, 'DD Mon HH24:MI'),
      '/crm/__SLUG__/tickets',
      'ticket',
      v_row.id
    WHERE COALESCE(v_row.assigned_to, v_row.created_by) IS NOT NULL;

    UPDATE public.crm_support_tickets
       SET sla_breach_notified = true,
           escalation_level = COALESCE(escalation_level, 0) + 1
     WHERE id = v_row.id;

    v_sla_count := v_sla_count + 1;
  END LOOP;

  -- 2) Scheduled workflow rules (trigger_type = 'scheduled')
  -- Runs any active scheduled rule whose last_run_at is null or > 5 minutes ago.
  FOR v_rule IN
    SELECT *
    FROM public.crm_workflow_rules
    WHERE is_active = true
      AND trigger_type = 'scheduled'
      AND (last_run_at IS NULL OR last_run_at < v_now - interval '5 minutes')
    LIMIT 50
  LOOP
    -- Iterate matching rows from target module (only a few supported safely)
    IF v_rule.schedule_target_module = 'activities_overdue' THEN
      FOR v_row IN
        SELECT id, workspace_id, assigned_to, created_by, subject
        FROM public.crm_activities
        WHERE workspace_id = v_rule.workspace_id
          AND status IN ('planned', 'in_progress')
          AND due_at < v_now
        LIMIT 100
      LOOP
        FOR v_action IN SELECT * FROM jsonb_array_elements(COALESCE(v_rule.actions, '[]'::jsonb))
        LOOP
          BEGIN
            PERFORM public.crm_run_action(
              v_action,
              'activity',
              v_row.id,
              v_row.workspace_id,
              to_jsonb(v_row)
            );
            INSERT INTO public.crm_workflow_executions(rule_id, workspace_id, entity_type, entity_id, status, action, payload)
            VALUES (v_rule.id, v_row.workspace_id, 'activity', v_row.id, 'success', v_action, to_jsonb(v_row));
          EXCEPTION WHEN OTHERS THEN
            INSERT INTO public.crm_workflow_executions(rule_id, workspace_id, entity_type, entity_id, status, action, payload, error)
            VALUES (v_rule.id, v_row.workspace_id, 'activity', v_row.id, 'error', v_action, to_jsonb(v_row), SQLERRM);
          END;
          v_count := v_count + 1;
        END LOOP;
      END LOOP;

    ELSIF v_rule.schedule_target_module = 'invoices_overdue' THEN
      FOR v_row IN
        SELECT id, workspace_id, created_by, invoice_number, customer_name
        FROM public.crm_invoices
        WHERE workspace_id = v_rule.workspace_id
          AND due_date IS NOT NULL
          AND due_date < CURRENT_DATE
          AND status IN ('unpaid', 'partial', 'overdue')
        LIMIT 100
      LOOP
        FOR v_action IN SELECT * FROM jsonb_array_elements(COALESCE(v_rule.actions, '[]'::jsonb))
        LOOP
          BEGIN
            PERFORM public.crm_run_action(
              v_action,
              'invoice',
              v_row.id,
              v_row.workspace_id,
              to_jsonb(v_row)
            );
            INSERT INTO public.crm_workflow_executions(rule_id, workspace_id, entity_type, entity_id, status, action, payload)
            VALUES (v_rule.id, v_row.workspace_id, 'invoice', v_row.id, 'success', v_action, to_jsonb(v_row));
          EXCEPTION WHEN OTHERS THEN
            INSERT INTO public.crm_workflow_executions(rule_id, workspace_id, entity_type, entity_id, status, action, payload, error)
            VALUES (v_rule.id, v_row.workspace_id, 'invoice', v_row.id, 'error', v_action, to_jsonb(v_row), SQLERRM);
          END;
          v_count := v_count + 1;
        END LOOP;
      END LOOP;

    ELSIF v_rule.schedule_target_module = 'leads_stale' THEN
      FOR v_row IN
        SELECT id, workspace_id, assigned_to, created_by, full_name
        FROM public.crm_leads
        WHERE workspace_id = v_rule.workspace_id
          AND status = 'open'
          AND updated_at < v_now - interval '7 days'
        LIMIT 100
      LOOP
        FOR v_action IN SELECT * FROM jsonb_array_elements(COALESCE(v_rule.actions, '[]'::jsonb))
        LOOP
          BEGIN
            PERFORM public.crm_run_action(
              v_action,
              'lead',
              v_row.id,
              v_row.workspace_id,
              to_jsonb(v_row)
            );
          EXCEPTION WHEN OTHERS THEN
            INSERT INTO public.crm_workflow_executions(rule_id, workspace_id, entity_type, entity_id, status, action, payload, error)
            VALUES (v_rule.id, v_row.workspace_id, 'lead', v_row.id, 'error', v_action, to_jsonb(v_row), SQLERRM);
          END;
          v_count := v_count + 1;
        END LOOP;
      END LOOP;
    END IF;

    UPDATE public.crm_workflow_rules SET last_run_at = v_now WHERE id = v_rule.id;
  END LOOP;

  RETURN jsonb_build_object(
    'ok', true,
    'sla_breaches', v_sla_count,
    'workflow_actions', v_count,
    'at', v_now
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.crm_run_scheduled_workflows() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.crm_run_scheduled_workflows() TO service_role;

-- ============= WORKFLOW EXECUTION ENGINE =============
-- Single dispatcher that evaluates active rules for the affected entity,
-- runs supported actions, and logs results. Failures never block the write.

CREATE OR REPLACE FUNCTION public.crm_eval_condition(_cond jsonb, _row jsonb, _old jsonb)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  _field text := _cond->>'field';
  _op text := COALESCE(_cond->>'op', 'eq');
  _value text := _cond->>'value';
  _actual text;
BEGIN
  IF _field IS NULL THEN RETURN true; END IF;
  _actual := _row->>_field;

  RETURN CASE _op
    WHEN 'eq' THEN COALESCE(_actual,'') = COALESCE(_value,'')
    WHEN 'neq' THEN COALESCE(_actual,'') <> COALESCE(_value,'')
    WHEN 'contains' THEN COALESCE(_actual,'') ILIKE '%' || COALESCE(_value,'') || '%'
    WHEN 'gt' THEN COALESCE(NULLIF(_actual,'')::numeric, 0) > COALESCE(NULLIF(_value,'')::numeric, 0)
    WHEN 'gte' THEN COALESCE(NULLIF(_actual,'')::numeric, 0) >= COALESCE(NULLIF(_value,'')::numeric, 0)
    WHEN 'lt' THEN COALESCE(NULLIF(_actual,'')::numeric, 0) < COALESCE(NULLIF(_value,'')::numeric, 0)
    WHEN 'lte' THEN COALESCE(NULLIF(_actual,'')::numeric, 0) <= COALESCE(NULLIF(_value,'')::numeric, 0)
    WHEN 'changed' THEN COALESCE(_old->>_field,'') IS DISTINCT FROM COALESCE(_actual,'')
    WHEN 'is_empty' THEN COALESCE(_actual,'') = ''
    WHEN 'is_not_empty' THEN COALESCE(_actual,'') <> ''
    ELSE true
  END;
EXCEPTION WHEN OTHERS THEN
  RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION public.crm_run_action(
  _action jsonb,
  _entity_type text,
  _entity_id uuid,
  _workspace_id uuid,
  _row jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _type text := _action->>'type';
  _result jsonb := jsonb_build_object('type', _type, 'ok', true);
  _sql text;
  _user uuid;
BEGIN
  IF _type = 'assign_user' THEN
    _user := NULLIF(_action->>'user_id','')::uuid;
    IF _user IS NULL THEN
      RETURN jsonb_build_object('type', _type, 'ok', false, 'error', 'missing user_id');
    END IF;
    _sql := format('UPDATE public.%I SET assigned_to = $1 WHERE id = $2', _entity_type);
    BEGIN
      EXECUTE _sql USING _user, _entity_id;
    EXCEPTION WHEN OTHERS THEN
      -- Some tables use owner_id instead of assigned_to
      EXECUTE format('UPDATE public.%I SET owner_id = $1 WHERE id = $2', _entity_type) USING _user, _entity_id;
    END;

  ELSIF _type = 'update_field' THEN
    EXECUTE format('UPDATE public.%I SET %I = $1 WHERE id = $2',
      _entity_type, _action->>'field')
      USING _action->>'value', _entity_id;

  ELSIF _type = 'create_notification' THEN
    _user := COALESCE(
      NULLIF(_action->>'user_id','')::uuid,
      NULLIF(_row->>'assigned_to','')::uuid,
      NULLIF(_row->>'owner_id','')::uuid
    );
    IF _user IS NOT NULL THEN
      INSERT INTO public.crm_notifications (workspace_id, user_id, type, title, body, related_entity_type, related_entity_id)
      VALUES (
        _workspace_id, _user,
        COALESCE(_action->>'notification_type', 'workflow'),
        COALESCE(_action->>'title', 'Workflow notification'),
        _action->>'body',
        _entity_type, _entity_id
      );
    END IF;

  ELSIF _type = 'create_activity' THEN
    INSERT INTO public.crm_activities (
      workspace_id, activity_type, subject, description,
      assigned_to, lead_id, deal_id, contact_id, organization_id,
      due_at, priority, status
    ) VALUES (
      _workspace_id,
      COALESCE(_action->>'activity_type', 'task'),
      COALESCE(_action->>'subject', 'Workflow task'),
      _action->>'description',
      COALESCE(NULLIF(_action->>'assignee','')::uuid, NULLIF(_row->>'assigned_to','')::uuid),
      CASE WHEN _entity_type = 'crm_leads' THEN _entity_id ELSE NULL END,
      CASE WHEN _entity_type = 'crm_deals' THEN _entity_id ELSE NULL END,
      CASE WHEN _entity_type = 'crm_contacts' THEN _entity_id ELSE NULL END,
      CASE WHEN _entity_type = 'crm_organizations' THEN _entity_id ELSE NULL END,
      CASE WHEN _action->>'due_in_hours' IS NOT NULL
        THEN now() + ((_action->>'due_in_hours')::int || ' hours')::interval
        ELSE NULL END,
      COALESCE(_action->>'priority', 'medium'),
      'pending'
    );

  ELSIF _type = 'create_approval_request' THEN
    INSERT INTO public.crm_approval_requests (
      workspace_id, request_type, entity_type, entity_id,
      title, description, amount, requested_by, approver_user_id, status
    ) VALUES (
      _workspace_id,
      COALESCE(_action->>'request_type', 'other'),
      _entity_type, _entity_id,
      COALESCE(_action->>'title', 'Approval needed'),
      _action->>'description',
      NULLIF(_action->>'amount','')::numeric,
      COALESCE(NULLIF(_row->>'created_by','')::uuid, NULLIF(_row->>'assigned_to','')::uuid, auth.uid()),
      NULLIF(_action->>'approver_user_id','')::uuid,
      'pending'
    );
  ELSE
    _result := jsonb_build_object('type', _type, 'ok', false, 'error', 'unknown action');
  END IF;

  RETURN _result;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('type', _type, 'ok', false, 'error', SQLERRM);
END;
$$;

CREATE OR REPLACE FUNCTION public.crm_workflow_dispatch()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _row jsonb := to_jsonb(NEW);
  _old jsonb := CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE '{}'::jsonb END;
  _entity_type text := TG_TABLE_NAME;
  _entity_id uuid := (to_jsonb(NEW)->>'id')::uuid;
  _workspace_id uuid := NULLIF(to_jsonb(NEW)->>'workspace_id','')::uuid;
  _trigger_event text;
  _rule record;
  _cond jsonb;
  _all_pass boolean;
  _action jsonb;
  _results jsonb;
BEGIN
  IF _workspace_id IS NULL THEN RETURN NEW; END IF;

  IF TG_OP = 'INSERT' THEN
    _trigger_event := 'on_create';
  ELSE
    _trigger_event := 'on_update';
  END IF;

  FOR _rule IN
    SELECT * FROM public.crm_workflow_rules
    WHERE workspace_id = _workspace_id
      AND is_active = true
      AND entity_type = _entity_type
      AND (
        trigger_event = _trigger_event
        OR (TG_OP = 'UPDATE'
            AND trigger_event = 'on_status_change'
            AND trigger_field IS NOT NULL
            AND COALESCE(_old->>trigger_field,'') IS DISTINCT FROM COALESCE(_row->>trigger_field,'')
            AND (trigger_value IS NULL OR _row->>trigger_field = trigger_value))
      )
  LOOP
    -- Evaluate all conditions (AND)
    _all_pass := true;
    IF jsonb_typeof(_rule.conditions) = 'array' THEN
      FOR _cond IN SELECT * FROM jsonb_array_elements(_rule.conditions) LOOP
        IF NOT public.crm_eval_condition(_cond, _row, _old) THEN
          _all_pass := false;
          EXIT;
        END IF;
      END LOOP;
    END IF;

    IF NOT _all_pass THEN CONTINUE; END IF;

    -- Run actions
    _results := '[]'::jsonb;
    IF jsonb_typeof(_rule.actions) = 'array' THEN
      FOR _action IN SELECT * FROM jsonb_array_elements(_rule.actions) LOOP
        _results := _results || jsonb_build_array(
          public.crm_run_action(_action, _entity_type, _entity_id, _workspace_id, _row)
        );
      END LOOP;
    END IF;

    -- Log execution & bump rule counters
    INSERT INTO public.crm_workflow_executions
      (workspace_id, workflow_id, entity_type, entity_id, trigger_event, status, actions_executed)
    VALUES (_workspace_id, _rule.id, _entity_type, _entity_id, _trigger_event, 'success', _results);

    UPDATE public.crm_workflow_rules
      SET run_count = run_count + 1, last_run_at = now()
      WHERE id = _rule.id;
  END LOOP;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block the underlying write
  BEGIN
    INSERT INTO public.crm_workflow_executions
      (workspace_id, workflow_id, entity_type, entity_id, trigger_event, status, error_message, actions_executed)
    VALUES (_workspace_id,
            COALESCE(_rule.id, '00000000-0000-0000-0000-000000000000'::uuid),
            _entity_type, _entity_id, _trigger_event, 'error', SQLERRM, '[]'::jsonb);
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  RETURN NEW;
END;
$$;

-- Attach dispatcher to the main entities
DROP TRIGGER IF EXISTS crm_workflow_dispatch_leads ON public.crm_leads;
CREATE TRIGGER crm_workflow_dispatch_leads
  AFTER INSERT OR UPDATE ON public.crm_leads
  FOR EACH ROW EXECUTE FUNCTION public.crm_workflow_dispatch();

DROP TRIGGER IF EXISTS crm_workflow_dispatch_deals ON public.crm_deals;
CREATE TRIGGER crm_workflow_dispatch_deals
  AFTER INSERT OR UPDATE ON public.crm_deals
  FOR EACH ROW EXECUTE FUNCTION public.crm_workflow_dispatch();

DROP TRIGGER IF EXISTS crm_workflow_dispatch_tickets ON public.crm_support_tickets;
CREATE TRIGGER crm_workflow_dispatch_tickets
  AFTER INSERT OR UPDATE ON public.crm_support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.crm_workflow_dispatch();

DROP TRIGGER IF EXISTS crm_workflow_dispatch_invoices ON public.crm_invoices;
CREATE TRIGGER crm_workflow_dispatch_invoices
  AFTER INSERT OR UPDATE ON public.crm_invoices
  FOR EACH ROW EXECUTE FUNCTION public.crm_workflow_dispatch();

DROP TRIGGER IF EXISTS crm_workflow_dispatch_activities ON public.crm_activities;
CREATE TRIGGER crm_workflow_dispatch_activities
  AFTER INSERT OR UPDATE ON public.crm_activities
  FOR EACH ROW EXECUTE FUNCTION public.crm_workflow_dispatch();

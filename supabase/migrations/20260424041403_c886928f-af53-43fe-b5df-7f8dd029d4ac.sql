
-- Generic audit trigger function for CRM tables
CREATE OR REPLACE FUNCTION public.crm_audit_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _action text;
  _entity_id uuid;
  _workspace_id uuid;
  _label text;
  _changes jsonb;
  _actor uuid;
  _actor_email text;
BEGIN
  _actor := auth.uid();
  -- Best-effort actor email
  BEGIN
    SELECT email::text INTO _actor_email FROM auth.users WHERE id = _actor;
  EXCEPTION WHEN OTHERS THEN
    _actor_email := NULL;
  END;

  IF (TG_OP = 'INSERT') THEN
    _action := 'created';
    _entity_id := (to_jsonb(NEW)->>'id')::uuid;
    _workspace_id := NULLIF(to_jsonb(NEW)->>'workspace_id','')::uuid;
    _changes := to_jsonb(NEW);
  ELSIF (TG_OP = 'UPDATE') THEN
    _action := 'updated';
    _entity_id := (to_jsonb(NEW)->>'id')::uuid;
    _workspace_id := NULLIF(to_jsonb(NEW)->>'workspace_id','')::uuid;
    -- Only diff fields
    SELECT jsonb_object_agg(key, jsonb_build_object('old', old_val, 'new', new_val))
      INTO _changes
    FROM (
      SELECT key,
             to_jsonb(OLD)->key AS old_val,
             to_jsonb(NEW)->key AS new_val
      FROM jsonb_object_keys(to_jsonb(NEW)) AS key
      WHERE to_jsonb(OLD)->key IS DISTINCT FROM to_jsonb(NEW)->key
        AND key NOT IN ('updated_at')
    ) t;
    IF _changes IS NULL OR _changes = '{}'::jsonb THEN
      RETURN NEW; -- nothing meaningful changed
    END IF;
  ELSIF (TG_OP = 'DELETE') THEN
    _action := 'deleted';
    _entity_id := (to_jsonb(OLD)->>'id')::uuid;
    _workspace_id := NULLIF(to_jsonb(OLD)->>'workspace_id','')::uuid;
    _changes := to_jsonb(OLD);
  END IF;

  -- Pick a human label per table
  IF TG_TABLE_NAME = 'crm_leads' THEN
    _label := COALESCE((to_jsonb(COALESCE(NEW, OLD))->>'full_name'), 'Lead');
  ELSIF TG_TABLE_NAME = 'crm_deals' THEN
    _label := COALESCE((to_jsonb(COALESCE(NEW, OLD))->>'title'), 'Deal');
  ELSIF TG_TABLE_NAME = 'crm_quotations' THEN
    _label := COALESCE((to_jsonb(COALESCE(NEW, OLD))->>'quotation_number'), 'Quotation');
  ELSIF TG_TABLE_NAME = 'crm_invoices' THEN
    _label := COALESCE((to_jsonb(COALESCE(NEW, OLD))->>'invoice_number'), 'Invoice');
  ELSIF TG_TABLE_NAME = 'crm_contacts' THEN
    _label := COALESCE((to_jsonb(COALESCE(NEW, OLD))->>'full_name'), 'Contact');
  ELSIF TG_TABLE_NAME = 'crm_organizations' THEN
    _label := COALESCE((to_jsonb(COALESCE(NEW, OLD))->>'name'), 'Organization');
  ELSIF TG_TABLE_NAME = 'crm_support_tickets' THEN
    _label := COALESCE((to_jsonb(COALESCE(NEW, OLD))->>'subject'), 'Ticket');
  ELSE
    _label := TG_TABLE_NAME;
  END IF;

  INSERT INTO public.crm_audit_log
    (workspace_id, actor_id, actor_email, action, entity_type, entity_id, entity_label, changes)
  VALUES
    (_workspace_id, _actor, _actor_email, _action, TG_TABLE_NAME, _entity_id, _label, _changes);

  RETURN COALESCE(NEW, OLD);
EXCEPTION WHEN OTHERS THEN
  -- Never block business writes due to audit failures
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Attach triggers (drop & recreate to be idempotent)
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'crm_leads','crm_deals','crm_quotations','crm_invoices',
    'crm_contacts','crm_organizations','crm_support_tickets'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS audit_%1$I ON public.%1$I', t);
    EXECUTE format(
      'CREATE TRIGGER audit_%1$I
         AFTER INSERT OR UPDATE OR DELETE ON public.%1$I
         FOR EACH ROW EXECUTE FUNCTION public.crm_audit_trigger()',
      t
    );
  END LOOP;
END $$;

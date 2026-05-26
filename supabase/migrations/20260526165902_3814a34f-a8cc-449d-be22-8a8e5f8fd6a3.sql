ALTER TABLE public.crm_workflow_rules ADD COLUMN IF NOT EXISTS updated_by uuid;

CREATE OR REPLACE FUNCTION public.crm_workflow_rules_set_updated_by()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_by := COALESCE(auth.uid(), NEW.updated_by);
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS workflows_updated_at ON public.crm_workflow_rules;
DROP TRIGGER IF EXISTS workflows_set_updated_by ON public.crm_workflow_rules;
CREATE TRIGGER workflows_set_updated_by
BEFORE INSERT OR UPDATE ON public.crm_workflow_rules
FOR EACH ROW EXECUTE FUNCTION public.crm_workflow_rules_set_updated_by();
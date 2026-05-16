
REVOKE EXECUTE ON FUNCTION public.crm_eval_condition(jsonb, jsonb, jsonb) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.crm_run_action(jsonb, text, uuid, uuid, jsonb) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.crm_workflow_dispatch() FROM anon, authenticated, public;

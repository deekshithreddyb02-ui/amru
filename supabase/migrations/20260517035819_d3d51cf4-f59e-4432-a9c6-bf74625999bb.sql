
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS public._mirror_config (
  id int PRIMARY KEY DEFAULT 1,
  endpoint text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  CONSTRAINT _mirror_config_singleton CHECK (id = 1)
);

ALTER TABLE public._mirror_config ENABLE ROW LEVEL SECURITY;

INSERT INTO public._mirror_config (id, endpoint)
VALUES (1, 'https://sfjxughxjvbuhocbmggp.supabase.co/functions/v1/external-mirror')
ON CONFLICT (id) DO UPDATE SET endpoint = EXCLUDED.endpoint;

CREATE OR REPLACE FUNCTION public._mirror_to_external()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  _cfg record;
  _payload jsonb;
BEGIN
  SELECT endpoint, enabled INTO _cfg FROM public._mirror_config WHERE id = 1;
  IF NOT FOUND OR NOT _cfg.enabled THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  _payload := jsonb_build_object(
    'table', TG_TABLE_NAME,
    'op', TG_OP,
    'record', CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END,
    'old_record', CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END
  );

  PERFORM extensions.net.http_post(
    url := _cfg.endpoint,
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := _payload,
    timeout_milliseconds := 5000
  );

  RETURN COALESCE(NEW, OLD);
EXCEPTION WHEN OTHERS THEN
  RETURN COALESCE(NEW, OLD);
END;
$$;

DO $$
DECLARE
  t text;
  excluded text[] := ARRAY['_mirror_config', 'crm_audit_log', 'login_attempts', 'site_visits', 'crm_ping_history'];
BEGIN
  FOR t IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename <> ALL(excluded)
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS _zz_mirror_trg ON public.%I', t);
    EXECUTE format(
      'CREATE TRIGGER _zz_mirror_trg AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public._mirror_to_external()',
      t
    );
  END LOOP;
END $$;

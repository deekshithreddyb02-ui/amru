
ALTER TABLE public._mirror_config
  ADD COLUMN IF NOT EXISTS secret text;

UPDATE public._mirror_config
  SET secret = encode(extensions.gen_random_bytes(32), 'hex')
  WHERE secret IS NULL OR secret = '';

CREATE OR REPLACE FUNCTION public._mirror_to_external()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  _cfg record;
  _payload jsonb;
BEGIN
  SELECT endpoint, enabled, secret INTO _cfg FROM public._mirror_config WHERE id = 1;
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
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-mirror-secret', COALESCE(_cfg.secret, '')
    ),
    body := _payload,
    timeout_milliseconds := 5000
  );

  RETURN COALESCE(NEW, OLD);
EXCEPTION WHEN OTHERS THEN
  RETURN COALESCE(NEW, OLD);
END;
$function$;

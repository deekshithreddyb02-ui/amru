CREATE OR REPLACE FUNCTION public.get_public_table_counts()
RETURNS TABLE(table_name text, row_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
  c bigint;
BEGIN
  -- Only super admins may call this
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  FOR r IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename NOT LIKE 'pg_%'
    ORDER BY tablename
  LOOP
    EXECUTE format('SELECT COUNT(*) FROM public.%I', r.tablename) INTO c;
    table_name := r.tablename;
    row_count := c;
    RETURN NEXT;
  END LOOP;
END;
$$;

-- Allow service-role (used by edge function) to call without auth check via a separate variant
CREATE OR REPLACE FUNCTION public.get_public_table_counts_unrestricted()
RETURNS TABLE(table_name text, row_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
  c bigint;
BEGIN
  FOR r IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename NOT LIKE 'pg_%'
    ORDER BY tablename
  LOOP
    EXECUTE format('SELECT COUNT(*) FROM public.%I', r.tablename) INTO c;
    table_name := r.tablename;
    row_count := c;
    RETURN NEXT;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.get_public_table_counts_unrestricted() FROM public, anon, authenticated;
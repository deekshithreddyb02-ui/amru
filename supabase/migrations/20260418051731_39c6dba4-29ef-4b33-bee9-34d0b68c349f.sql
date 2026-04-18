-- Extend lead_region_assignments to support region keys (not just biz_area) and multiple admins per region

-- Add region_key column (nullable to keep backward compat with biz_area)
ALTER TABLE public.lead_region_assignments
  ADD COLUMN IF NOT EXISTS region_key text,
  ADD COLUMN IF NOT EXISTS assignee_role text NOT NULL DEFAULT 'employee';

-- Make biz_area nullable so we can store region-key-only rows
ALTER TABLE public.lead_region_assignments
  ALTER COLUMN biz_area DROP NOT NULL;

-- Allow multiple admins per region: drop any unique on (employee_id, biz_area) if it exists, add composite uniqueness on (employee_id, region_key, assignee_role)
CREATE UNIQUE INDEX IF NOT EXISTS lead_region_assignments_unique_admin_region
  ON public.lead_region_assignments (employee_id, region_key, assignee_role)
  WHERE region_key IS NOT NULL;

-- Replace the auto_assign trigger function: route to region-matching admins (or fall back to country)
CREATE OR REPLACE FUNCTION public.auto_assign_lead()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _region_key text;
  _assignee uuid;
BEGIN
  IF NEW.assigned_to IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Determine region key
  IF NEW.country IS NOT NULL AND lower(NEW.country) NOT IN ('india', 'in', '') THEN
    _region_key := 'other_country';
  ELSIF NEW.mailing_state IS NOT NULL THEN
    _region_key := CASE lower(trim(NEW.mailing_state))
      WHEN 'maharashtra' THEN 'maharashtra'
      WHEN 'telangana' THEN 'telangana'
      WHEN 'andhra pradesh' THEN 'andhra_pradesh'
      WHEN 'karnataka' THEN 'karnataka'
      ELSE 'other_india'
    END;
  ELSE
    _region_key := 'all';
  END IF;

  -- Try matching admin first by specific region, then 'all'
  SELECT employee_id INTO _assignee
  FROM public.lead_region_assignments
  WHERE region_key = _region_key AND assignee_role = 'admin'
  ORDER BY created_at ASC
  LIMIT 1;

  IF _assignee IS NULL THEN
    SELECT employee_id INTO _assignee
    FROM public.lead_region_assignments
    WHERE region_key = 'all' AND assignee_role = 'admin'
    ORDER BY created_at ASC
    LIMIT 1;
  END IF;

  -- Legacy fallback to biz_area-based employee assignment
  IF _assignee IS NULL AND NEW.biz_area IS NOT NULL THEN
    SELECT employee_id INTO _assignee
    FROM public.lead_region_assignments
    WHERE biz_area = NEW.biz_area
    LIMIT 1;
  END IF;

  NEW.assigned_to := _assignee;
  RETURN NEW;
END;
$function$;

-- Ensure trigger exists on contact_messages
DROP TRIGGER IF EXISTS auto_assign_lead_trigger ON public.contact_messages;
CREATE TRIGGER auto_assign_lead_trigger
  BEFORE INSERT ON public.contact_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_lead();
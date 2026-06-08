
-- Seed enquiry_form site_content row if missing
INSERT INTO public.site_content (section_key, title, content, metadata)
SELECT 'enquiry_form',
       'Enquiry Form',
       'Public enquiry form configuration',
       jsonb_build_object(
         'intro', 'Tell us about your project and we will get back to you shortly.',
         'thank_you', 'Thank you! Our team will contact you soon.',
         'fields', jsonb_build_object(
           'firstName',     jsonb_build_object('visible', true, 'required', false),
           'phoneNumber',   jsonb_build_object('visible', true, 'required', false),
           'expectedClose', jsonb_build_object('visible', true, 'required', true),
           'distance',      jsonb_build_object('visible', true, 'required', true),
           'scans',         jsonb_build_object('visible', true, 'required', true),
           'areaType',      jsonb_build_object('visible', true, 'required', true),
           'getLocation',   jsonb_build_object('visible', true, 'required', false)
         ),
         'routing', jsonb_build_object(
           'Maharashtra',   'mh',
           'Telangana',     'hyd',
           'AndhraPradesh', 'hyd',
           'Karnataka',     'blr',
           'OtherIndia',    'mh',
           'OtherCountry',  'others'
         )
       )
WHERE NOT EXISTS (
  SELECT 1 FROM public.site_content WHERE section_key = 'enquiry_form'
);

-- Update routing function to consult the editable mapping first
CREATE OR REPLACE FUNCTION public.resolve_crm_workspace(_country text, _state text)
RETURNS uuid
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _slug text;
  _id uuid;
  _routing jsonb;
  _key text;
  _normalized text;
BEGIN
  -- Read mapping override from site_content (if present)
  SELECT (metadata->'routing') INTO _routing
    FROM public.site_content
   WHERE section_key = 'enquiry_form'
   LIMIT 1;

  IF _country IS NOT NULL AND lower(trim(_country)) NOT IN ('india','in','') THEN
    _key := 'OtherCountry';
  ELSIF _state IS NOT NULL THEN
    _normalized := lower(trim(_state));
    _key := CASE _normalized
      WHEN 'maharashtra'    THEN 'Maharashtra'
      WHEN 'telangana'      THEN 'Telangana'
      WHEN 'andhra pradesh' THEN 'AndhraPradesh'
      WHEN 'karnataka'      THEN 'Karnataka'
      ELSE 'OtherIndia'
    END;
  ELSE
    _key := 'OtherIndia';
  END IF;

  -- Prefer override mapping
  IF _routing IS NOT NULL AND _routing ? _key THEN
    _slug := _routing->>_key;
  END IF;

  -- Fallback to legacy defaults
  IF _slug IS NULL OR _slug = '' THEN
    _slug := CASE _key
      WHEN 'OtherCountry' THEN 'others'
      WHEN 'Maharashtra'  THEN 'mh'
      WHEN 'Telangana'    THEN 'hyd'
      WHEN 'AndhraPradesh' THEN 'hyd'
      WHEN 'Karnataka'    THEN 'blr'
      ELSE 'mh'
    END;
  END IF;

  SELECT id INTO _id FROM public.crm_workspaces WHERE slug = _slug LIMIT 1;
  RETURN _id;
END;
$function$;

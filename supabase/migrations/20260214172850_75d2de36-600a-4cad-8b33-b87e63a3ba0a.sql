
-- Server-side validation for contact_messages
CREATE OR REPLACE FUNCTION public.validate_contact_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Validate lengths
  IF length(NEW.name) > 100 THEN
    RAISE EXCEPTION 'Name exceeds maximum length';
  END IF;
  IF length(NEW.email) > 255 THEN
    RAISE EXCEPTION 'Email exceeds maximum length';
  END IF;
  IF length(coalesce(NEW.phone, '')) > 20 THEN
    RAISE EXCEPTION 'Phone exceeds maximum length';
  END IF;
  IF length(NEW.message) > 2000 THEN
    RAISE EXCEPTION 'Message exceeds maximum length';
  END IF;

  -- Validate email format
  IF NEW.email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_contact_before_insert
BEFORE INSERT ON public.contact_messages
FOR EACH ROW EXECUTE FUNCTION public.validate_contact_message();

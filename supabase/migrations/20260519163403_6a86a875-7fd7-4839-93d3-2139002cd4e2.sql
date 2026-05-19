
-- Add explicit verification workflow fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS verification_note text,
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS verified_by uuid;

-- Backfill from is_approved (existing users default to approved; unapproved -> pending)
UPDATE public.profiles
SET verification_status = CASE WHEN is_approved THEN 'approved' ELSE 'pending' END
WHERE verification_status = 'approved' AND is_approved = false;

-- Constrain values
DO $$ BEGIN
  ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_verification_status_check
    CHECK (verification_status IN ('pending','approved','rejected'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Lock verification fields to admins (mirror is_approved policy)
CREATE OR REPLACE FUNCTION public.lock_profile_approval_field()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.is_approved := OLD.is_approved;
    NEW.verification_status := OLD.verification_status;
    NEW.verification_note := OLD.verification_note;
    NEW.verified_at := OLD.verified_at;
    NEW.verified_by := OLD.verified_by;
  END IF;
  RETURN NEW;
END;
$function$;

-- Admin RPC to set verification status atomically
CREATE OR REPLACE FUNCTION public.admin_set_verification_status(
  _target_user_id uuid,
  _status text,
  _note text DEFAULT NULL
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  IF _status NOT IN ('pending','approved','rejected') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;

  UPDATE public.profiles
  SET verification_status = _status,
      verification_note   = _note,
      verified_at         = now(),
      verified_by         = auth.uid(),
      is_approved         = (_status = 'approved')
  WHERE user_id = _target_user_id;

  RETURN true;
END;
$$;

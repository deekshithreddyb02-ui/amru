ALTER TABLE public.contact_messages
  ADD COLUMN IF NOT EXISTS firstname text,
  ADD COLUMN IF NOT EXISTS primary_phone text,
  ADD COLUMN IF NOT EXISTS mobile_phone text,
  ADD COLUMN IF NOT EXISTS biz_cost text,
  ADD COLUMN IF NOT EXISTS mailing_state text;
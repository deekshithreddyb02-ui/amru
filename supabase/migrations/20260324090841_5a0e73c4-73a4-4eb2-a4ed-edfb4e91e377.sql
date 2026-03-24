
-- Add detailed enquiry fields to contact_messages table
ALTER TABLE public.contact_messages
  ADD COLUMN IF NOT EXISTS whatsapp text,
  ADD COLUMN IF NOT EXISTS biz_area text,
  ADD COLUMN IF NOT EXISTS distance text,
  ADD COLUMN IF NOT EXISTS service_needed text,
  ADD COLUMN IF NOT EXISTS num_scans text,
  ADD COLUMN IF NOT EXISTS area_type text,
  ADD COLUMN IF NOT EXISTS area_value text,
  ADD COLUMN IF NOT EXISTS mailing_street text,
  ADD COLUMN IF NOT EXISTS mailing_city text,
  ADD COLUMN IF NOT EXISTS mailing_pincode text,
  ADD COLUMN IF NOT EXISTS latitude text,
  ADD COLUMN IF NOT EXISTS longitude text,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS expected_close text,
  ADD COLUMN IF NOT EXISTS crm_status text DEFAULT 'pending';

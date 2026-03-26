
CREATE TABLE public.crm_ping_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  state_key text NOT NULL,
  crm_label text,
  crm_url text NOT NULL,
  status text NOT NULL DEFAULT 'unknown',
  response_time_ms integer,
  status_code integer,
  error_message text,
  pinged_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_ping_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read ping history" ON public.crm_ping_history
  FOR SELECT TO public
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete ping history" ON public.crm_ping_history
  FOR DELETE TO public
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_crm_ping_pinged_at ON public.crm_ping_history(pinged_at DESC);
CREATE INDEX idx_crm_ping_state ON public.crm_ping_history(state_key);

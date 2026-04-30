-- Customer feedback surveys and responses
CREATE TABLE public.crm_feedback_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  token TEXT NOT NULL UNIQUE DEFAULT replace(gen_random_uuid()::text, '-', ''),
  survey_type TEXT NOT NULL DEFAULT 'nps', -- nps | csat | ces
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  contact_id UUID,
  organization_id UUID,
  ticket_id UUID,
  field_visit_id UUID,
  invoice_id UUID,
  trigger_source TEXT, -- ticket_closed | visit_completed | invoice_paid | manual
  question TEXT NOT NULL DEFAULT 'How likely are you to recommend us to a friend or colleague?',
  status TEXT NOT NULL DEFAULT 'sent', -- sent | responded | expired
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '30 days'),
  score INTEGER, -- 0-10 for NPS, 1-5 for CSAT/CES
  comment TEXT,
  category TEXT, -- promoter | passive | detractor (auto-set)
  follow_up_required BOOLEAN NOT NULL DEFAULT false,
  follow_up_done BOOLEAN NOT NULL DEFAULT false,
  follow_up_notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_feedback_workspace ON public.crm_feedback_surveys(workspace_id, created_at DESC);
CREATE INDEX idx_feedback_token ON public.crm_feedback_surveys(token);
CREATE INDEX idx_feedback_status ON public.crm_feedback_surveys(workspace_id, status);

ALTER TABLE public.crm_feedback_surveys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view feedback"
ON public.crm_feedback_surveys FOR SELECT
USING (is_crm_member(auth.uid(), workspace_id));

CREATE POLICY "Members create feedback"
ON public.crm_feedback_surveys FOR INSERT
WITH CHECK (is_crm_member(auth.uid(), workspace_id));

CREATE POLICY "Members update feedback"
ON public.crm_feedback_surveys FOR UPDATE
USING (is_crm_member(auth.uid(), workspace_id))
WITH CHECK (is_crm_member(auth.uid(), workspace_id));

CREATE POLICY "Admins delete feedback"
ON public.crm_feedback_surveys FOR DELETE
USING (is_super_admin(auth.uid()) OR has_crm_role(auth.uid(), workspace_id, 'crm_admin'::app_role));

-- Public can submit response by token (anonymous)
CREATE POLICY "Public can read survey by token"
ON public.crm_feedback_surveys FOR SELECT
TO anon, authenticated
USING (status = 'sent' AND (expires_at IS NULL OR expires_at > now()));

CREATE POLICY "Public can submit response by token"
ON public.crm_feedback_surveys FOR UPDATE
TO anon, authenticated
USING (status = 'sent' AND (expires_at IS NULL OR expires_at > now()))
WITH CHECK (status IN ('sent','responded'));

-- Auto-categorize NPS and set responded
CREATE OR REPLACE FUNCTION public.crm_feedback_categorize()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.score IS DISTINCT FROM OLD.score AND NEW.score IS NOT NULL THEN
    IF NEW.survey_type = 'nps' THEN
      NEW.category := CASE
        WHEN NEW.score >= 9 THEN 'promoter'
        WHEN NEW.score >= 7 THEN 'passive'
        ELSE 'detractor'
      END;
      NEW.follow_up_required := (NEW.score <= 6);
    ELSIF NEW.survey_type IN ('csat','ces') THEN
      NEW.category := CASE
        WHEN NEW.score >= 4 THEN 'satisfied'
        WHEN NEW.score = 3 THEN 'neutral'
        ELSE 'dissatisfied'
      END;
      NEW.follow_up_required := (NEW.score <= 2);
    END IF;
    IF NEW.responded_at IS NULL THEN
      NEW.responded_at := now();
    END IF;
    NEW.status := 'responded';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_feedback_categorize
BEFORE UPDATE ON public.crm_feedback_surveys
FOR EACH ROW EXECUTE FUNCTION public.crm_feedback_categorize();

-- Auto-create NPS survey when ticket is resolved/closed
CREATE OR REPLACE FUNCTION public.crm_auto_nps_on_ticket_close()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.status IN ('resolved','closed')
     AND OLD.status IS DISTINCT FROM NEW.status
     AND NEW.customer_email IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM public.crm_feedback_surveys
       WHERE ticket_id = NEW.id
     )
  THEN
    INSERT INTO public.crm_feedback_surveys(
      workspace_id, survey_type, customer_name, customer_email, customer_phone,
      ticket_id, trigger_source, question
    ) VALUES (
      NEW.workspace_id, 'nps', NEW.customer_name, NEW.customer_email, NEW.customer_phone,
      NEW.id, 'ticket_closed',
      'How likely are you to recommend us based on your recent support experience?'
    );
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_nps_ticket
AFTER UPDATE ON public.crm_support_tickets
FOR EACH ROW EXECUTE FUNCTION public.crm_auto_nps_on_ticket_close();
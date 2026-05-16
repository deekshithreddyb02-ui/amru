-- Phase 18: WhatsApp / SMS Hub

CREATE TABLE public.crm_message_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.crm_workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  channel text NOT NULL DEFAULT 'whatsapp', -- whatsapp, sms, both
  category text DEFAULT 'general', -- general, greeting, follow_up, payment, support, marketing
  language text DEFAULT 'en',
  body text NOT NULL,
  variables text[] DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_crm_msg_templates_ws ON public.crm_message_templates(workspace_id);

CREATE TABLE public.crm_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.crm_workspaces(id) ON DELETE CASCADE,
  channel text NOT NULL DEFAULT 'whatsapp', -- whatsapp, sms
  direction text NOT NULL DEFAULT 'outbound', -- outbound, inbound
  recipient_name text,
  recipient_phone text NOT NULL,
  template_id uuid REFERENCES public.crm_message_templates(id) ON DELETE SET NULL,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'queued', -- queued, sent, delivered, failed, clicked, read
  provider text DEFAULT 'click_to_chat', -- click_to_chat, twilio, manual
  provider_message_id text,
  error_message text,
  related_entity_type text, -- lead, contact, deal, ticket, invoice
  related_entity_id uuid,
  lead_id uuid REFERENCES public.crm_leads(id) ON DELETE SET NULL,
  contact_id uuid REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  deal_id uuid REFERENCES public.crm_deals(id) ON DELETE SET NULL,
  ticket_id uuid REFERENCES public.crm_support_tickets(id) ON DELETE SET NULL,
  sent_by uuid,
  sent_at timestamptz,
  delivered_at timestamptz,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_crm_messages_ws ON public.crm_messages(workspace_id);
CREATE INDEX idx_crm_messages_phone ON public.crm_messages(workspace_id, recipient_phone);
CREATE INDEX idx_crm_messages_lead ON public.crm_messages(lead_id);
CREATE INDEX idx_crm_messages_contact ON public.crm_messages(contact_id);

CREATE TRIGGER trg_crm_message_templates_updated
BEFORE UPDATE ON public.crm_message_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.crm_message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view templates" ON public.crm_message_templates
AS PERMISSIVE FOR SELECT TO authenticated
USING (public.is_crm_member(auth.uid(), workspace_id));

CREATE POLICY "Members create templates" ON public.crm_message_templates
AS PERMISSIVE FOR INSERT TO authenticated
WITH CHECK (public.is_crm_member(auth.uid(), workspace_id));

CREATE POLICY "Members update templates" ON public.crm_message_templates
AS PERMISSIVE FOR UPDATE TO authenticated
USING (public.is_crm_member(auth.uid(), workspace_id));

CREATE POLICY "Admins delete templates" ON public.crm_message_templates
AS PERMISSIVE FOR DELETE TO authenticated
USING (public.has_crm_role(auth.uid(), workspace_id, 'crm_admin'));

CREATE POLICY "Members view messages" ON public.crm_messages
AS PERMISSIVE FOR SELECT TO authenticated
USING (public.is_crm_member(auth.uid(), workspace_id));

CREATE POLICY "Members create messages" ON public.crm_messages
AS PERMISSIVE FOR INSERT TO authenticated
WITH CHECK (public.is_crm_member(auth.uid(), workspace_id));

CREATE POLICY "Members update messages" ON public.crm_messages
AS PERMISSIVE FOR UPDATE TO authenticated
USING (public.is_crm_member(auth.uid(), workspace_id));

CREATE POLICY "Admins delete messages" ON public.crm_messages
AS PERMISSIVE FOR DELETE TO authenticated
USING (public.has_crm_role(auth.uid(), workspace_id, 'crm_admin'));
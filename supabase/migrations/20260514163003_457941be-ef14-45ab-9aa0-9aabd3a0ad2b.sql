DROP TRIGGER IF EXISTS contact_messages_mirror_to_crm ON public.contact_messages;
CREATE TRIGGER contact_messages_mirror_to_crm
AFTER INSERT ON public.contact_messages
FOR EACH ROW
EXECUTE FUNCTION public.mirror_enquiry_to_crm();
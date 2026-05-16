
-- Saved custom dashboards
CREATE TABLE public.crm_saved_dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.crm_workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  layout JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_shared BOOLEAN NOT NULL DEFAULT false,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.crm_saved_dashboards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dash view" ON public.crm_saved_dashboards AS PERMISSIVE FOR SELECT TO authenticated
  USING (public.is_crm_member(auth.uid(), workspace_id) AND (user_id = auth.uid() OR is_shared));
CREATE POLICY "dash insert" ON public.crm_saved_dashboards AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (public.is_crm_member(auth.uid(), workspace_id) AND user_id = auth.uid());
CREATE POLICY "dash update" ON public.crm_saved_dashboards AS PERMISSIVE FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.has_crm_role(auth.uid(), workspace_id, 'crm_admin'));
CREATE POLICY "dash delete" ON public.crm_saved_dashboards AS PERMISSIVE FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.has_crm_role(auth.uid(), workspace_id, 'crm_admin'));
CREATE TRIGGER trg_crm_saved_dashboards_updated_at
  BEFORE UPDATE ON public.crm_saved_dashboards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Copilot conversation history (per user, per workspace)
CREATE TABLE public.crm_copilot_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.crm_workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.crm_copilot_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "copilot self" ON public.crm_copilot_conversations AS PERMISSIVE FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid() AND public.is_crm_member(auth.uid(), workspace_id));
CREATE TRIGGER trg_crm_copilot_conv_updated_at
  BEFORE UPDATE ON public.crm_copilot_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Offline field-visit draft sync (idempotent inserts via client_uuid)
ALTER TABLE public.crm_field_visits
  ADD COLUMN IF NOT EXISTS client_uuid UUID UNIQUE,
  ADD COLUMN IF NOT EXISTS synced_offline BOOLEAN NOT NULL DEFAULT false;

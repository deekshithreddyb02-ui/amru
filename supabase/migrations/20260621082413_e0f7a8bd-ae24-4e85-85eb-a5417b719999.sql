
-- 1. Stage config master table
CREATE TABLE IF NOT EXISTS public.crm_stage_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.crm_workspaces(id) ON DELETE CASCADE,
  key text NOT NULL,
  label text NOT NULL,
  color text NOT NULL DEFAULT 'gray',
  probability integer NOT NULL DEFAULT 10,
  position integer NOT NULL DEFAULT 0,
  is_won boolean NOT NULL DEFAULT false,
  is_lost boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_stage_configs TO authenticated;
GRANT ALL ON public.crm_stage_configs TO service_role;

ALTER TABLE public.crm_stage_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view stage configs" ON public.crm_stage_configs
  FOR SELECT TO authenticated
  USING (public.is_crm_member(auth.uid(), workspace_id));

CREATE POLICY "Admins manage stage configs" ON public.crm_stage_configs
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.has_crm_role(auth.uid(), workspace_id, 'crm_admin'::app_role))
  WITH CHECK (public.is_super_admin(auth.uid()) OR public.has_crm_role(auth.uid(), workspace_id, 'crm_admin'::app_role));

CREATE TRIGGER trg_crm_stage_configs_updated
  BEFORE UPDATE ON public.crm_stage_configs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Seed defaults for each existing workspace
INSERT INTO public.crm_stage_configs (workspace_id, key, label, color, probability, position, is_won, is_lost)
SELECT w.id, s.key, s.label, s.color, s.probability, s.position, s.is_won, s.is_lost
FROM public.crm_workspaces w
CROSS JOIN (VALUES
  ('prospecting',      'Prospecting',        'amber',   10,  1, false, false),
  ('qualification',    'Qualification',      'blue',    20,  2, false, false),
  ('site_visit',       'Site Visit',         'purple',  30,  3, false, false),
  ('technical_review', 'Technical Review',   'indigo',  40,  4, false, false),
  ('design_prep',      'Design Preparation', 'sky',     50,  5, false, false),
  ('proposal_sent',    'Proposal Sent',      'cyan',    60,  6, false, false),
  ('negotiation',      'Negotiation',        'orange',  70,  7, false, false),
  ('approved',         'Approved',           'lime',    80,  8, false, false),
  ('work_order',       'Work Order',         'teal',    85,  9, false, false),
  ('execution',        'Execution',          'emerald', 90, 10, false, false),
  ('completed',        'Completed',          'green',  100, 11, true,  false),
  ('lost',             'Lost',               'red',      0, 12, false, true )
) AS s(key, label, color, probability, position, is_won, is_lost)
ON CONFLICT (workspace_id, key) DO NOTHING;

-- 3. Normalize existing crm_deals.stage values
UPDATE public.crm_deals SET stage = 'prospecting'   WHERE lower(stage) IN ('new','prospecting');
UPDATE public.crm_deals SET stage = 'qualification' WHERE lower(stage) IN ('qualified','qualification','qual');
UPDATE public.crm_deals SET stage = 'proposal_sent' WHERE lower(stage) IN ('proposal','proposal_sent');
UPDATE public.crm_deals SET stage = 'negotiation'   WHERE lower(stage) = 'negotiation';
UPDATE public.crm_deals SET stage = 'completed'     WHERE lower(stage) IN ('won','completed');
UPDATE public.crm_deals SET stage = 'lost'          WHERE lower(stage) = 'lost';

ALTER TABLE public.crm_deals ALTER COLUMN stage SET DEFAULT 'prospecting';

-- 4. Stage history table
CREATE TABLE IF NOT EXISTS public.crm_deal_stage_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.crm_workspaces(id) ON DELETE CASCADE,
  deal_id uuid NOT NULL REFERENCES public.crm_deals(id) ON DELETE CASCADE,
  previous_stage text,
  new_stage text NOT NULL,
  changed_by uuid,
  changed_at timestamptz NOT NULL DEFAULT now(),
  remarks text
);

CREATE INDEX IF NOT EXISTS idx_crm_deal_stage_history_deal ON public.crm_deal_stage_history(deal_id, changed_at DESC);

GRANT SELECT ON public.crm_deal_stage_history TO authenticated;
GRANT ALL ON public.crm_deal_stage_history TO service_role;

ALTER TABLE public.crm_deal_stage_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view stage history" ON public.crm_deal_stage_history
  FOR SELECT TO authenticated
  USING (public.is_crm_member(auth.uid(), workspace_id));

-- Restrictive insert block (only SECURITY DEFINER trigger writes)
CREATE POLICY "Block direct inserts to stage history" ON public.crm_deal_stage_history
  AS RESTRICTIVE FOR INSERT TO anon, authenticated
  WITH CHECK (false);

-- 5. Trigger function: log stage change + notify owner
CREATE OR REPLACE FUNCTION public.crm_deal_log_stage_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _actor uuid := auth.uid();
  _new_label text;
  _old_label text;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.stage IS DISTINCT FROM OLD.stage THEN
    INSERT INTO public.crm_deal_stage_history
      (workspace_id, deal_id, previous_stage, new_stage, changed_by)
    VALUES
      (NEW.workspace_id, NEW.id, OLD.stage, NEW.stage, _actor);

    SELECT label INTO _new_label FROM public.crm_stage_configs
      WHERE workspace_id = NEW.workspace_id AND key = NEW.stage LIMIT 1;
    SELECT label INTO _old_label FROM public.crm_stage_configs
      WHERE workspace_id = NEW.workspace_id AND key = OLD.stage LIMIT 1;

    IF NEW.owner_id IS NOT NULL THEN
      INSERT INTO public.crm_notifications
        (workspace_id, user_id, type, title, body, related_entity_type, related_entity_id)
      VALUES
        (NEW.workspace_id, NEW.owner_id, 'stage_change',
         'Opportunity stage changed',
         COALESCE(NEW.title, 'Opportunity') || ': ' ||
           COALESCE(_old_label, OLD.stage, '—') || ' → ' ||
           COALESCE(_new_label, NEW.stage, '—'),
         'crm_deals', NEW.id);
    END IF;
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_crm_deal_stage_change ON public.crm_deals;
CREATE TRIGGER trg_crm_deal_stage_change
  AFTER UPDATE OF stage ON public.crm_deals
  FOR EACH ROW EXECUTE FUNCTION public.crm_deal_log_stage_change();

-- 6. Realtime
ALTER TABLE public.crm_deals REPLICA IDENTITY FULL;
ALTER TABLE public.crm_stage_configs REPLICA IDENTITY FULL;
ALTER TABLE public.crm_deal_stage_history REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_deals; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_stage_configs; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_deal_stage_history; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;


CREATE TABLE IF NOT EXISTS public.crm_notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  workspace_id uuid REFERENCES public.crm_workspaces(id) ON DELETE CASCADE,
  email_enabled boolean NOT NULL DEFAULT true,
  in_app_enabled boolean NOT NULL DEFAULT true,
  digest_frequency text NOT NULL DEFAULT 'daily',
  muted_types text[] NOT NULL DEFAULT '{}',
  quiet_hours_start time,
  quiet_hours_end time,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own prefs" ON public.crm_notification_preferences
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own prefs" ON public.crm_notification_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own prefs" ON public.crm_notification_preferences
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_crm_notification_preferences_updated_at
  BEFORE UPDATE ON public.crm_notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Helpful index for notifications page filters
CREATE INDEX IF NOT EXISTS idx_notifications_user_workspace_created
  ON public.crm_notifications(user_id, workspace_id, created_at DESC);

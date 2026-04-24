-- Restrict Supabase Realtime channel subscriptions so authenticated users
-- can only subscribe to their own private channel topics. Without this,
-- any logged-in user could subscribe to "crm_notifications_user" and
-- receive INSERT payloads broadcast for other users' notifications.

-- Enable RLS on realtime.messages (Supabase manages the table; enabling RLS
-- here causes the broadcast/presence/postgres_changes pipelines to enforce
-- per-topic policies).
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

-- Drop any prior versions of our policies (idempotent re-runs).
DROP POLICY IF EXISTS "Authenticated can read own topic" ON realtime.messages;
DROP POLICY IF EXISTS "Authenticated can write own topic" ON realtime.messages;

-- Allow authenticated users to receive Realtime messages only on topics
-- that include their auth.uid() in the topic name. This matches our
-- per-user notification channel naming convention "crm_notifications_user_<uid>"
-- (see CrmNotificationBell). Generic channels (no uid) are not delivered
-- via Realtime to other users.
CREATE POLICY "Authenticated can read own topic"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  -- Topic must contain the caller's uid (string match).
  realtime.topic() LIKE '%' || auth.uid()::text || '%'
);

-- Same restriction for any client-initiated broadcast/presence writes.
CREATE POLICY "Authenticated can write own topic"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  realtime.topic() LIKE '%' || auth.uid()::text || '%'
);
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "ahgs_session_id";
const LAST_VISIT_KEY = "ahgs_last_visit";
const DEDUP_MS = 10000; // 10 seconds dedup window

function getSessionId(): string {
  let sid = localStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
}

export const useVisitTracker = () => {
  useEffect(() => {
    const trackVisit = async () => {
      // Dedup rapid refreshes
      const lastVisit = localStorage.getItem(LAST_VISIT_KEY);
      const now = Date.now();
      if (lastVisit && now - parseInt(lastVisit, 10) < DEDUP_MS) {
        return;
      }
      localStorage.setItem(LAST_VISIT_KEY, String(now));

      const sessionId = getSessionId();
      const { data: { session } } = await supabase.auth.getSession();

      await supabase.from("site_visits" as any).insert({
        session_id: sessionId,
        user_id: session?.user?.id || null,
        user_agent: navigator.userAgent,
        page_path: window.location.pathname,
      });
    };

    trackVisit();
  }, []);
};

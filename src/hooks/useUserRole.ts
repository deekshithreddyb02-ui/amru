import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "super_admin" | "admin" | "employee" | "user";

export const useUserRole = () => {
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (cancelled) return;
        if (!session?.user) {
          setRole(null);
          setUserId(null);
          setLoading(false);
          return;
        }

        setUserId(session.user.id);

        // Parallelize roles + profile fetch
        const [{ data: rolesData }, { data: profile }] = await Promise.all([
          supabase.from("user_roles").select("role").eq("user_id", session.user.id),
          supabase.from("profiles").select("must_change_password").eq("user_id", session.user.id).maybeSingle(),
        ]);
        if (cancelled) return;

        const roles = (rolesData || []).map((r) => r.role as AppRole);
        let resolved: AppRole = "user";
        if (roles.includes("super_admin")) resolved = "super_admin";
        else if (roles.includes("admin")) resolved = "admin";
        else if (roles.includes("employee")) resolved = "employee";
        setRole(resolved);
        setMustChangePassword(profile?.must_change_password === true);
      } catch (error) {
        if (!cancelled) {
          console.error("Error checking role:", error);
          setRole(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    check();

    // Only re-check on real sign-in/out, not on every token refresh.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        check();
      }
    });

    return () => { cancelled = true; subscription.unsubscribe(); };
  }, []);

  return {
    role,
    loading,
    userId,
    mustChangePassword,
    isSuperAdmin: role === "super_admin",
    // isAdmin is true for both admin and super_admin (legacy convenience)
    isAdmin: role === "admin" || role === "super_admin",
    isEmployee: role === "employee",
  };
};

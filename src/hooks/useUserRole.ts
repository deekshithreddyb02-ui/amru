import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "super_admin" | "admin" | "employee" | "user";

type UserRoleSnapshot = {
  role: AppRole | null;
  userId: string | null;
  mustChangePassword: boolean;
};

let userRoleCache: UserRoleSnapshot | null = null;
let userRolePromise: Promise<UserRoleSnapshot> | null = null;

export const useUserRole = () => {
  const [role, setRole] = useState<AppRole | null>(() => userRoleCache?.role ?? null);
  const [loading, setLoading] = useState(() => !userRoleCache);
  const [userId, setUserId] = useState<string | null>(() => userRoleCache?.userId ?? null);
  const [mustChangePassword, setMustChangePassword] = useState(() => userRoleCache?.mustChangePassword ?? false);

  useEffect(() => {
    let cancelled = false;
    const applySnapshot = (snapshot: UserRoleSnapshot) => {
      setRole(snapshot.role);
      setUserId(snapshot.userId);
      setMustChangePassword(snapshot.mustChangePassword);
    };

    const check = async () => {
      try {
        if (userRoleCache) {
          applySnapshot(userRoleCache);
          setLoading(false);
          return;
        }

        if (!userRolePromise) {
          userRolePromise = (async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) {
              return { role: null, userId: null, mustChangePassword: false };
            }

            const [{ data: rolesData }, { data: profile }] = await Promise.all([
              supabase.from("user_roles").select("role").eq("user_id", session.user.id),
              supabase.from("profiles").select("must_change_password").eq("user_id", session.user.id).maybeSingle(),
            ]);

            const roles = (rolesData || []).map((r) => r.role as AppRole);
            let resolved: AppRole = "user";
            if (roles.includes("super_admin")) resolved = "super_admin";
            else if (roles.includes("admin")) resolved = "admin";
            else if (roles.includes("employee")) resolved = "employee";

            return {
              role: resolved,
              userId: session.user.id,
              mustChangePassword: profile?.must_change_password === true,
            };
          })();
        }

        const snapshot = await userRolePromise;
        userRoleCache = snapshot;
        userRolePromise = null;
        if (cancelled) return;
        applySnapshot(snapshot);
      } catch (error) {
        userRolePromise = null;
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
        userRoleCache = null;
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

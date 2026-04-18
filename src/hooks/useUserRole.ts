import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "super_admin" | "admin" | "employee" | "user";

export const useUserRole = () => {
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  useEffect(() => {
    const check = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          setRole(null);
          setUserId(null);
          setLoading(false);
          return;
        }

        setUserId(session.user.id);

        // Get role
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .maybeSingle();

        setRole((roleData?.role as AppRole) || "user");

        // Check must_change_password
        const { data: profile } = await supabase
          .from("profiles")
          .select("must_change_password")
          .eq("user_id", session.user.id)
          .maybeSingle();

        setMustChangePassword(profile?.must_change_password === true);
      } catch (error) {
        console.error("Error checking role:", error);
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    check();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      check();
    });

    return () => subscription.unsubscribe();
  }, []);

  return {
    role,
    loading,
    userId,
    mustChangePassword,
    isSuperAdmin: role === "super_admin",
    isAdmin: role === "admin" || role === "super_admin",
    isEmployee: role === "employee",
  };
};

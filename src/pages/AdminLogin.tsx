import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { sanitizeError } from "@/lib/errors";
import { motion } from "framer-motion";
import { Shield, User, Lock, Loader2 } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";

const AdminLogin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { role, loading: roleLoading, mustChangePassword, isAdmin, isSuperAdmin, isEmployee } = useUserRole();

  useEffect(() => {
    if (!roleLoading) {
      if (mustChangePassword) {
        navigate("/change-password");
      } else if (isAdmin) {
        navigate("/crm");
      } else if (isEmployee) {
        navigate("/employee");
      }
    }
  }, [role, roleLoading, mustChangePassword, navigate, isAdmin, isSuperAdmin, isEmployee]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim() || !password) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Server-side sign-in: username never leaves the server resolved to an email.
      const res = await supabase.functions.invoke("admin-signin", {
        body: { username: username.trim().toLowerCase(), password },
      });

      if (res.error) throw res.error;
      const data = res.data as any;

      if (!data?.ok || !data?.session) {
        toast({
          title: data?.blocked ? "Account Temporarily Blocked" : "Error",
          description: data?.error || "Invalid username or password",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Apply the returned session locally.
      const { error: setErr } = await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });
      if (setErr) throw setErr;

      const userId = data.user_id as string;

      // Check user role
      const { data: rolesData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      const roles = (rolesData || []).map(r => r.role);
      const isSuperAdminRole = roles.includes('super_admin');
      const isAdminRole = roles.includes('admin') || isSuperAdminRole;
      const isEmployeeRole = roles.includes('employee');

      if (roleError || (!isAdminRole && !isEmployeeRole)) {
        await supabase.auth.signOut();
        toast({
          title: "Access Denied",
          description: "You don't have admin or employee privileges",
          variant: "destructive"
        });
        return;
      }

      // Check if must change password
      const { data: profile } = await supabase
        .from('profiles')
        .select('must_change_password')
        .eq('user_id', userId)
        .maybeSingle();

      if (profile?.must_change_password) {
        toast({ title: "Password Change Required", description: "Please set a new password." });
        navigate("/change-password");
        return;
      }

      if (isAdminRole) {
        toast({ title: isSuperAdminRole ? "Welcome Super Admin!" : "Welcome Admin!", description: "Redirecting to CRM..." });
        navigate("/crm");
      } else {
        toast({ title: "Welcome!", description: "Redirecting to employee dashboard..." });
        navigate("/employee");
      }
    } catch (error: any) {
      toast({ title: "Error", description: sanitizeError(error), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-accent/20 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-xl border-primary/20">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
                <Shield className="w-8 h-8 text-primary-foreground" />
              </div>
            </div>
            <CardTitle className="text-2xl font-serif text-primary">Admin Login</CardTitle>
            <CardDescription>Enter your username and password to access the dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10"
                  disabled={loading}
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  disabled={loading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
            <div className="mt-4 text-center">
              <a href="/" className="text-sm text-muted-foreground hover:text-primary">
                ← Back to Home
              </a>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default AdminLogin;

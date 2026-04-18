import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { Loader2, Mail, Settings } from "lucide-react";

import { useUserRole } from "@/hooks/useUserRole";
import LeadsManager from "@/components/admin/LeadsManager";
import SettingsModule from "@/components/admin/SettingsModule";
import AdminHeader from "@/components/admin/AdminHeader";

const Admin = () => {
  const navigate = useNavigate();
  const { isAdmin, isSuperAdmin, loading } = useUserRole();

  useEffect(() => {
    if (loading) return;
    if (!isAdmin) {
      navigate("/admin-login");
      return;
    }
    // Super Admins go to the full dashboard
    if (isSuperAdmin) {
      navigate("/super-admin", { replace: true });
    }
  }, [isAdmin, isSuperAdmin, loading, navigate]);

  if (loading || isSuperAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Tabs defaultValue="leads">
        <AdminHeader />
        <main className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-8">
              <TabsList className="w-full h-auto p-1.5 bg-primary/5 border border-primary/10 rounded-xl flex justify-center gap-1 max-w-md mx-auto">
                <TabsTrigger
                  value="leads"
                  className="flex-1 gap-2 py-2.5 md:py-3 px-4 rounded-lg text-sm font-medium text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all"
                >
                  <Mail className="w-4 h-4 shrink-0" />
                  <span className="truncate">Leads</span>
                </TabsTrigger>
                <TabsTrigger
                  value="content"
                  className="flex-1 gap-2 py-2.5 md:py-3 px-4 rounded-lg text-sm font-medium text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all"
                >
                  <Settings className="w-4 h-4 shrink-0" />
                  <span className="truncate">Website Content</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="leads">
              <LeadsManager />
            </TabsContent>

            <TabsContent value="content">
              <SettingsModule />
            </TabsContent>
          </motion.div>
        </main>
      </Tabs>
    </div>
  );
};

export default Admin;

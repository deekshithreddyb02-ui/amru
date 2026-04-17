import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Loader2, LogOut, MapPin } from "lucide-react";
import defaultLogo from "@/assets/logo-small.webp";

interface AssignedLead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  service: string | null;
  message: string;
  created_at: string;
  biz_area: string | null;
  country: string | null;
  mailing_city: string | null;
  crm_status: string | null;
  whatsapp: string | null;
}

const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const { role, loading: roleLoading, mustChangePassword } = useUserRole();
  const { toast } = useToast();
  const [assignedLeads, setAssignedLeads] = useState<AssignedLead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roleLoading) {
      if (mustChangePassword) {
        navigate("/change-password");
        return;
      }
      if (role !== "employee" && role !== "admin") {
        navigate("/");
      }
    }
  }, [role, roleLoading, mustChangePassword, navigate]);

  useEffect(() => {
    if (role === "employee" || role === "admin") {
      fetchAssignedLeads();
    }
  }, [role]);

  const fetchAssignedLeads = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("contact_messages")
        .select("id, name, email, phone, service, message, created_at, biz_area, country, mailing_city, crm_status, whatsapp")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setAssignedLeads((data || []) as AssignedLead[]);
    } catch (error: any) {
      console.error("Error fetching leads:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (roleLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={defaultLogo} alt="Logo" className="w-10 h-10 object-contain rounded-full bg-white/10 p-0.5" />
            <div className="flex flex-col">
              <span className="text-sm font-semibold leading-tight">Admin Dashboard</span>
              <span className="text-xs text-primary-foreground/70">Assigned Leads</span>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10">
            <LogOut className="w-4 h-4 mr-1.5" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="mb-6 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Assigned Leads ({assignedLeads.length})</h2>
          </div>

          {assignedLeads.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <MapPin className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>No leads assigned to you yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {assignedLeads.map((lead) => (
                <Card key={lead.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm">{lead.name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{lead.email}</p>
                      </div>
                      <Badge variant="secondary" className="text-xs shrink-0">
                        {lead.biz_area || lead.country || "Unknown"}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                      <div>
                        <span className="text-muted-foreground">Phone: </span>
                        <span className="font-medium">{lead.phone || "-"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">WhatsApp: </span>
                        <span className="font-medium">{lead.whatsapp || "-"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Service: </span>
                        <span className="font-medium">{lead.service || "-"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">City: </span>
                        <span className="font-medium">{lead.mailing_city || "-"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">CRM: </span>
                        <Badge variant={lead.crm_status === "success" ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">
                          {lead.crm_status || "pending"}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Date: </span>
                        <span className="font-medium">{new Date(lead.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {lead.message && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-muted-foreground">Message:</p>
                        <p className="text-xs mt-1 whitespace-pre-wrap">{lead.message}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default EmployeeDashboard;

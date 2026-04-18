import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { sanitizeError } from "@/lib/errors";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, MapPin, Trash2, UserPlus, Globe, Map as MapIcon } from "lucide-react";

type RegionKey =
  | "all"
  | "india"
  | "maharashtra"
  | "telangana"
  | "andhra_pradesh"
  | "karnataka"
  | "other_india"
  | "other_country";

const REGIONS: { key: RegionKey; label: string; group: "Global" | "India" | "International"; icon?: any }[] = [
  { key: "all", label: "All Regions", group: "Global", icon: Globe },
  { key: "maharashtra", label: "Maharashtra", group: "India", icon: MapIcon },
  { key: "telangana", label: "Telangana", group: "India", icon: MapIcon },
  { key: "andhra_pradesh", label: "Andhra Pradesh", group: "India", icon: MapIcon },
  { key: "karnataka", label: "Karnataka", group: "India", icon: MapIcon },
  { key: "other_india", label: "Other India States", group: "India", icon: MapIcon },
  { key: "other_country", label: "Other Country", group: "International", icon: Globe },
];

interface AdminUser {
  user_id: string;
  email: string;
  full_name: string;
}

interface Assignment {
  id: string;
  employee_id: string;
  region_key: string;
  assignee_role: string;
}

const RegionAssignmentManager = () => {
  const { toast } = useToast();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAdmin, setSelectedAdmin] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rolesRes, profilesRes, emailsRes, assignRes] = await Promise.all([
        supabase.from("user_roles").select("user_id, role").in("role", ["admin", "super_admin"]),
        supabase.from("profiles").select("user_id, full_name"),
        supabase.rpc("get_users_with_emails"),
        supabase.from("lead_region_assignments").select("*").eq("assignee_role", "admin"),
      ]);

      if (rolesRes.error) throw rolesRes.error;
      const adminIds = Array.from(new Set((rolesRes.data || []).map((r: any) => r.user_id)));

      const profileMap = new Map<string, string>();
      (profilesRes.data || []).forEach((p: any) => profileMap.set(p.user_id, p.full_name || ""));
      const emailMap = new Map<string, string>();
      ((emailsRes.data as any[]) || []).forEach((u: any) => emailMap.set(u.user_id, u.email));

      const adminList: AdminUser[] = adminIds.map((id) => ({
        user_id: id,
        email: emailMap.get(id) || id,
        full_name: profileMap.get(id) || "",
      }));
      setAdmins(adminList);
      setAssignments(((assignRes.data as any[]) || []) as Assignment[]);
    } catch (e: any) {
      toast({ title: "Error", description: sanitizeError(e), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const adminAssignments = useMemo(() => {
    const map = new Map<string, Set<string>>();
    assignments.forEach((a) => {
      if (!map.has(a.employee_id)) map.set(a.employee_id, new Set());
      map.get(a.employee_id)!.add(a.region_key);
    });
    return map;
  }, [assignments]);

  const toggleRegion = async (adminId: string, regionKey: RegionKey, on: boolean) => {
    setSaving(true);
    try {
      if (on) {
        const { error } = await supabase
          .from("lead_region_assignments")
          .insert({ employee_id: adminId, region_key: regionKey, assignee_role: "admin", biz_area: regionKey });
        if (error && !String(error.message).includes("duplicate")) throw error;
      } else {
        const { error } = await supabase
          .from("lead_region_assignments")
          .delete()
          .eq("employee_id", adminId)
          .eq("region_key", regionKey)
          .eq("assignee_role", "admin");
        if (error) throw error;
      }
      await fetchData();
    } catch (e: any) {
      toast({ title: "Error", description: sanitizeError(e), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const groups: Array<{ name: string; items: typeof REGIONS }> = [
    { name: "Global", items: REGIONS.filter((r) => r.group === "Global") },
    { name: "India", items: REGIONS.filter((r) => r.group === "India") },
    { name: "International", items: REGIONS.filter((r) => r.group === "International") },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Lead Region Assignments
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Assign regions to admins. Incoming leads matching a region are auto-routed to its admins.
            Multiple admins can share a region.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[220px]">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Select admin to manage</label>
              <Select value={selectedAdmin} onValueChange={setSelectedAdmin}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an admin..." />
                </SelectTrigger>
                <SelectContent>
                  {admins.length === 0 && (
                    <div className="px-3 py-2 text-sm text-muted-foreground">No admins found</div>
                  )}
                  {admins.map((a) => (
                    <SelectItem key={a.user_id} value={a.user_id}>
                      {a.full_name || a.email} <span className="text-muted-foreground">({a.email})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedAdmin && (
            <div className="space-y-4 pt-2 border-t">
              {groups.map((g) => (
                <div key={g.name}>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                    {g.name}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {g.items.map((r) => {
                      const checked = adminAssignments.get(selectedAdmin)?.has(r.key) || false;
                      const Icon = r.icon || MapIcon;
                      return (
                        <label
                          key={r.key}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            checked
                              ? "bg-primary/10 border-primary/40"
                              : "bg-card hover:bg-muted/50 border-border"
                          }`}
                        >
                          <Checkbox
                            checked={checked}
                            disabled={saving}
                            onCheckedChange={(v) => toggleRegion(selectedAdmin, r.key, !!v)}
                          />
                          <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                          <span className="text-sm font-medium">{r.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Current Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          {admins.length === 0 ? (
            <p className="text-sm text-muted-foreground">No admins yet.</p>
          ) : (
            <div className="space-y-3">
              {admins.map((a) => {
                const regions = Array.from(adminAssignments.get(a.user_id) || []);
                return (
                  <div key={a.user_id} className="flex flex-wrap items-center gap-2 p-3 rounded-lg border bg-card">
                    <div className="min-w-[180px]">
                      <p className="text-sm font-medium">{a.full_name || a.email}</p>
                      <p className="text-xs text-muted-foreground">{a.email}</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5 flex-1">
                      {regions.length === 0 ? (
                        <span className="text-xs text-muted-foreground italic">No regions assigned</span>
                      ) : (
                        regions.map((rk) => {
                          const r = REGIONS.find((x) => x.key === rk);
                          return (
                            <Badge key={rk} variant="secondary" className="gap-1">
                              {r?.label || rk}
                              <button
                                aria-label="Remove"
                                onClick={() => toggleRegion(a.user_id, rk as RegionKey, false)}
                                className="ml-1 hover:text-destructive"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </Badge>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RegionAssignmentManager;

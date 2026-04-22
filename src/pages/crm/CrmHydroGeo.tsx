import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, RefreshCw, Search, Droplet } from "lucide-react";
import { toast } from "sonner";
import type { CrmWorkspace } from "@/hooks/useCrmWorkspaces";

type Ctx = { workspace: CrmWorkspace; myRole: string };

type HG = {
  id: string;
  site_name: string | null;
  site_city: string | null;
  site_state: string | null;
  area_size: string | null;
  terrain_type: string | null;
  soil_type: string | null;
  expected_depth_ft: number | null;
  num_scans: number | null;
  estimated_cost: number | null;
  preferred_visit_date: string | null;
  survey_status: string;
  notes: string | null;
  created_at: string;
};

const STATUS_TABS = ["all", "pending", "scheduled", "in_progress", "completed", "cancelled"];

const statusBadge: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  scheduled: "bg-primary/10 text-primary",
  in_progress: "bg-purple-100 text-purple-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-destructive/10 text-destructive",
};

const blank = {
  site_name: "",
  site_city: "",
  site_state: "",
  area_size: "",
  terrain_type: "plain",
  soil_type: "unknown",
  expected_depth_ft: "",
  num_scans: "",
  estimated_cost: "",
  preferred_visit_date: "",
  notes: "",
};

const inr = (n: number | null) =>
  n == null ? "—" : new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

const CrmHydroGeo = () => {
  const { workspace } = useOutletContext<Ctx>();
  const [items, setItems] = useState<HG[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("all");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(blank);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("crm_hydrogeo_enquiries")
      .select("id,site_name,site_city,site_state,area_size,terrain_type,soil_type,expected_depth_ft,num_scans,estimated_cost,preferred_visit_date,survey_status,notes,created_at")
      .eq("workspace_id", workspace.id)
      .order("created_at", { ascending: false })
      .limit(300);
    if (error) console.error(error);
    setItems((data as HG[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace.id]);

  const filtered = items.filter((it) => {
    if (tab !== "all" && it.survey_status !== tab) return false;
    if (!q) return true;
    const s = q.toLowerCase();
    return (
      it.site_name?.toLowerCase().includes(s) ||
      it.site_city?.toLowerCase().includes(s) ||
      it.site_state?.toLowerCase().includes(s)
    );
  });

  const handleCreate = async () => {
    if (!form.site_name.trim()) {
      toast.error("Site name is required");
      return;
    }
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await supabase.from("crm_hydrogeo_enquiries").insert({
      workspace_id: workspace.id,
      created_by: session?.user.id ?? null,
      site_name: form.site_name.trim(),
      site_city: form.site_city.trim() || null,
      site_state: form.site_state.trim() || null,
      area_size: form.area_size.trim() || null,
      terrain_type: form.terrain_type,
      soil_type: form.soil_type,
      expected_depth_ft: form.expected_depth_ft ? Number(form.expected_depth_ft) : null,
      num_scans: form.num_scans ? Number(form.num_scans) : null,
      estimated_cost: form.estimated_cost ? Number(form.estimated_cost) : null,
      preferred_visit_date: form.preferred_visit_date || null,
      notes: form.notes.trim() || null,
      survey_status: "pending",
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("HydroGeo enquiry created");
    setForm(blank);
    setOpen(false);
    load();
  };

  const updateStatus = async (id: string, survey_status: string) => {
    const { error } = await supabase.from("crm_hydrogeo_enquiries").update({ survey_status }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, survey_status } : it)));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-serif flex items-center gap-2">
            <Droplet className="h-7 w-7 text-primary" /> HydroGeo Enquiries
          </h1>
          <p className="text-muted-foreground text-sm">Borewell site surveys · {workspace.name}</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search site…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-8 w-56" />
          </div>
          <Button variant="outline" size="icon" onClick={load} aria-label="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> New enquiry</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create HydroGeo enquiry</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Site name *</Label>
                  <Input value={form.site_name} onChange={(e) => setForm({ ...form, site_name: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>City</Label>
                    <Input value={form.site_city} onChange={(e) => setForm({ ...form, site_city: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>State</Label>
                    <Input value={form.site_state} onChange={(e) => setForm({ ...form, site_state: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Area size</Label>
                    <Input placeholder="5 acres" value={form.area_size} onChange={(e) => setForm({ ...form, area_size: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Preferred visit</Label>
                    <Input type="date" value={form.preferred_visit_date} onChange={(e) => setForm({ ...form, preferred_visit_date: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Terrain</Label>
                    <Select value={form.terrain_type} onValueChange={(v) => setForm({ ...form, terrain_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="plain">Plain</SelectItem>
                        <SelectItem value="rocky">Rocky</SelectItem>
                        <SelectItem value="hilly">Hilly</SelectItem>
                        <SelectItem value="coastal">Coastal</SelectItem>
                        <SelectItem value="urban">Urban</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Soil</Label>
                    <Select value={form.soil_type} onValueChange={(v) => setForm({ ...form, soil_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sandy">Sandy</SelectItem>
                        <SelectItem value="clay">Clay</SelectItem>
                        <SelectItem value="loam">Loam</SelectItem>
                        <SelectItem value="rocky">Rocky</SelectItem>
                        <SelectItem value="mixed">Mixed</SelectItem>
                        <SelectItem value="unknown">Unknown</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label>Depth (ft)</Label>
                    <Input type="number" value={form.expected_depth_ft} onChange={(e) => setForm({ ...form, expected_depth_ft: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label># scans</Label>
                    <Input type="number" value={form.num_scans} onChange={(e) => setForm({ ...form, num_scans: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Cost (INR)</Label>
                    <Input type="number" value={form.estimated_cost} onChange={(e) => setForm({ ...form, estimated_cost: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Notes</Label>
                  <Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap">
          {STATUS_TABS.map((s) => (
            <TabsTrigger key={s} value={s} className="capitalize">{s.replace("_", " ")}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm">
            No HydroGeo enquiries yet for {workspace.name}.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-left">
                  <th className="px-4 py-3 font-medium">Site</th>
                  <th className="px-4 py-3 font-medium">Location</th>
                  <th className="px-4 py-3 font-medium">Terrain / Soil</th>
                  <th className="px-4 py-3 font-medium">Depth</th>
                  <th className="px-4 py-3 font-medium">Scans</th>
                  <th className="px-4 py-3 font-medium">Est. cost</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((it) => (
                  <tr key={it.id} className="border-t hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{it.site_name || "—"}</td>
                    <td className="px-4 py-3 text-xs">
                      {[it.site_city, it.site_state].filter(Boolean).join(", ") || "—"}
                    </td>
                    <td className="px-4 py-3 text-xs capitalize">
                      {it.terrain_type || "—"} / {it.soil_type || "—"}
                    </td>
                    <td className="px-4 py-3 text-xs">{it.expected_depth_ft ? `${it.expected_depth_ft} ft` : "—"}</td>
                    <td className="px-4 py-3 text-xs">{it.num_scans ?? "—"}</td>
                    <td className="px-4 py-3 text-xs">{inr(it.estimated_cost)}</td>
                    <td className="px-4 py-3">
                      <Select value={it.survey_status} onValueChange={(v) => updateStatus(it.id, v)}>
                        <SelectTrigger className={`h-7 text-xs w-36 ${statusBadge[it.survey_status] || ""}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="scheduled">Scheduled</SelectItem>
                          <SelectItem value="in_progress">In progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default CrmHydroGeo;

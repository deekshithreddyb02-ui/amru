import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Plus, Search, Megaphone } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { CrmWorkspace } from "@/hooks/useCrmWorkspaces";

type Ctx = { workspace: CrmWorkspace; myRole: string };

type Camp = {
  id: string; name: string; channel: string; status: string;
  budget: number; cost: number; actual_revenue: number;
  total_recipients: number; total_sent: number; total_opens: number;
  total_clicks: number; total_leads_generated: number;
  scheduled_at: string | null;
};

const STATUS_VARIANTS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  scheduled: "bg-amber-500/15 text-amber-700",
  running: "bg-primary/15 text-primary",
  paused: "bg-orange-500/15 text-orange-700",
  completed: "bg-emerald-500/15 text-emerald-700",
  cancelled: "bg-destructive/15 text-destructive",
};

const empty = {
  name: "", channel: "email", description: "",
  budget: "0", expected_revenue: "0", scheduled_at: "",
};

const CrmCampaigns = () => {
  const { workspace } = useOutletContext<Ctx>();
  const [rows, setRows] = useState<Camp[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("crm_campaigns")
      .select("id,name,channel,status,budget,cost,actual_revenue,total_recipients,total_sent,total_opens,total_clicks,total_leads_generated,scheduled_at")
      .eq("workspace_id", workspace.id)
      .order("created_at", { ascending: false });
    setRows((data as Camp[]) || []);
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [workspace.id]);

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await supabase.from("crm_campaigns").insert({
      workspace_id: workspace.id,
      name: form.name.trim(),
      channel: form.channel,
      description: form.description || null,
      budget: Number(form.budget) || 0,
      expected_revenue: Number(form.expected_revenue) || 0,
      scheduled_at: form.scheduled_at || null,
      created_by: session?.user.id,
    });
    setSaving(false);
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Campaign created" });
    setOpen(false); setForm(empty); load();
  };

  const updateStatus = async (id: string, status: string) => {
    const patch: any = { status };
    if (status === "running") patch.started_at = new Date().toISOString();
    if (status === "completed") patch.completed_at = new Date().toISOString();
    const { error } = await supabase.from("crm_campaigns").update(patch).eq("id", id);
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    load();
  };

  const filtered = rows.filter((r) =>
    !q.trim() || [r.name, r.channel, r.status].join(" ").toLowerCase().includes(q.toLowerCase())
  );

  const roi = (c: Camp) => c.cost > 0 ? `${(((c.actual_revenue - c.cost) / c.cost) * 100).toFixed(0)}%` : "—";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-serif">Marketing Campaigns</h1>
          <p className="text-sm text-muted-foreground">Track outreach across channels with KPIs and ROI.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setForm(empty)}><Plus className="h-4 w-4 mr-2" />New campaign</Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl bg-card max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Create campaign</DialogTitle></DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2"><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Channel</Label>
                <Select value={form.channel} onValueChange={(v) => setForm({ ...form, channel: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Scheduled at</Label><Input type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} /></div>
              <div><Label>Budget (₹)</Label><Input type="number" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} /></div>
              <div><Label>Expected revenue (₹)</Label><Input type="number" value={form.expected_revenue} onChange={(e) => setForm({ ...form, expected_revenue: e.target.value })} /></div>
              <div className="md:col-span-2"><Label>Description</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={save} disabled={saving || !form.name.trim()}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="p-3">
        <div className="relative max-w-sm">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search campaigns…" className="pl-8" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </Card>

      <Card className="p-0 overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin inline mr-2" />Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">
            <Megaphone className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>No campaigns yet.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Channel</th>
                <th className="p-3 text-right">Sent</th>
                <th className="p-3 text-right">Opens</th>
                <th className="p-3 text-right">Clicks</th>
                <th className="p-3 text-right">Leads</th>
                <th className="p-3 text-right">ROI</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-t hover:bg-muted/30">
                  <td className="p-3 font-medium">{c.name}</td>
                  <td className="p-3"><Badge variant="outline">{c.channel}</Badge></td>
                  <td className="p-3 text-right">{c.total_sent}</td>
                  <td className="p-3 text-right">{c.total_opens}</td>
                  <td className="p-3 text-right">{c.total_clicks}</td>
                  <td className="p-3 text-right">{c.total_leads_generated}</td>
                  <td className="p-3 text-right">{roi(c)}</td>
                  <td className="p-3">
                    <Select value={c.status} onValueChange={(v) => updateStatus(c.id, v)}>
                      <SelectTrigger className="h-8 w-32">
                        <Badge className={STATUS_VARIANTS[c.status] || ""} variant="outline">{c.status}</Badge>
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        <SelectItem value="draft">draft</SelectItem>
                        <SelectItem value="scheduled">scheduled</SelectItem>
                        <SelectItem value="running">running</SelectItem>
                        <SelectItem value="paused">paused</SelectItem>
                        <SelectItem value="completed">completed</SelectItem>
                        <SelectItem value="cancelled">cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
};

export default CrmCampaigns;

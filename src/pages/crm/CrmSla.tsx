import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Plus, Timer, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { CrmWorkspace } from "@/hooks/useCrmWorkspaces";

type Ctx = { workspace: CrmWorkspace; myRole: string };

type Sla = {
  id: string;
  name: string;
  description: string | null;
  priority: string;
  first_response_minutes: number;
  resolution_minutes: number;
  business_hours_only: boolean;
  is_active: boolean;
  is_default: boolean;
};

const PRIORITIES = ["low", "medium", "high", "urgent"];

const empty = {
  name: "",
  description: "",
  priority: "medium",
  first_response_minutes: "60",
  resolution_minutes: "1440",
  business_hours_only: false,
  is_active: true,
  is_default: false,
};

const fmtMinutes = (m: number) => {
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d ${h % 24}h`;
};

const CrmSla = () => {
  const { workspace } = useOutletContext<Ctx>();
  const [rows, setRows] = useState<Sla[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("crm_sla_policies")
      .select("*")
      .eq("workspace_id", workspace.id)
      .order("priority", { ascending: true });
    setRows((data as Sla[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    if (workspace?.id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace?.id]);

  const save = async () => {
    if (!form.name.trim()) {
      toast({ title: "Name required", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("crm_sla_policies").insert({
      workspace_id: workspace.id,
      name: form.name,
      description: form.description || null,
      priority: form.priority,
      first_response_minutes: Number(form.first_response_minutes) || 60,
      resolution_minutes: Number(form.resolution_minutes) || 1440,
      business_hours_only: form.business_hours_only,
      is_active: form.is_active,
      is_default: form.is_default,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Could not save", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "SLA policy created" });
    setForm(empty);
    setOpen(false);
    load();
  };

  const toggle = async (id: string, active: boolean) => {
    await supabase.from("crm_sla_policies").update({ is_active: active }).eq("id", id);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this SLA policy?")) return;
    await supabase.from("crm_sla_policies").delete().eq("id", id);
    toast({ title: "Deleted" });
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Timer className="h-6 w-6 text-primary" /> SLA Policies
          </h1>
          <p className="text-sm text-muted-foreground">
            Define response and resolution targets for support tickets by priority.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> New policy</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Create SLA policy</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Standard support"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Priority</Label>
                  <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>First response (min)</Label>
                  <Input
                    type="number"
                    value={form.first_response_minutes}
                    onChange={(e) => setForm({ ...form, first_response_minutes: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Resolution (min)</Label>
                  <Input
                    type="number"
                    value={form.resolution_minutes}
                    onChange={(e) => setForm({ ...form, resolution_minutes: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="bh">Business hours only</Label>
                <Switch
                  id="bh"
                  checked={form.business_hours_only}
                  onCheckedChange={(v) => setForm({ ...form, business_hours_only: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="def">Default policy</Label>
                <Switch
                  id="def"
                  checked={form.is_default}
                  onCheckedChange={(v) => setForm({ ...form, is_default: v })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={save} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : rows.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          No SLA policies yet. Create one for each priority level.
        </Card>
      ) : (
        <div className="grid gap-3">
          {rows.map((s) => (
            <Card key={s.id} className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium truncate">{s.name}</h3>
                    <Badge variant={s.is_active ? "default" : "secondary"}>
                      {s.is_active ? "Active" : "Paused"}
                    </Badge>
                    <Badge variant="outline" className="text-xs uppercase">{s.priority}</Badge>
                    {s.is_default && <Badge className="text-xs">Default</Badge>}
                    {s.business_hours_only && (
                      <Badge variant="outline" className="text-xs">Business hours</Badge>
                    )}
                  </div>
                  {s.description && (
                    <p className="text-sm text-muted-foreground mt-1">{s.description}</p>
                  )}
                  <div className="text-sm mt-2 flex flex-wrap gap-x-4 gap-y-1">
                    <span>
                      <span className="text-muted-foreground">First response:</span>{" "}
                      <strong>{fmtMinutes(s.first_response_minutes)}</strong>
                    </span>
                    <span>
                      <span className="text-muted-foreground">Resolution:</span>{" "}
                      <strong>{fmtMinutes(s.resolution_minutes)}</strong>
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={s.is_active}
                    onCheckedChange={(v) => toggle(s.id, v)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(s.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CrmSla;

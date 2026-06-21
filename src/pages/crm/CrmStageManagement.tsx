import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useStageConfig, STAGE_COLOR_CLASSES, type StageConfig } from "@/hooks/useStageConfig";
import { useCrmPermissions } from "@/hooks/useCrmPermissions";
import type { CrmWorkspace } from "@/hooks/useCrmWorkspaces";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import {
  ArrowUp, ArrowDown, Pencil, Plus, Trash2, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Ctx = { workspace: CrmWorkspace; myRole: string };

const COLORS = [
  "amber","yellow","orange","red","rose","pink","purple","indigo",
  "blue","sky","cyan","teal","emerald","green","lime","gray","slate",
];

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

export default function CrmStageManagement() {
  const { workspace } = useOutletContext<Ctx>();
  const { isSuperAdmin, myRole } = useCrmPermissions(workspace.id);
  const canEdit = isSuperAdmin || myRole === "crm_admin";
  const { stages, reload } = useStageConfig(workspace.id);

  const [editing, setEditing] = useState<Partial<StageConfig> | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const openNew = () => setEditing({
    label: "", color: "gray", probability: 50,
    position: (stages.at(-1)?.position ?? 0) + 1,
    is_won: false, is_lost: false, is_active: true,
  });

  const openEdit = (s: StageConfig) => setEditing({ ...s });

  const save = async () => {
    if (!editing?.label?.trim()) return;
    setSaving(true);
    const key = editing.key || slugify(editing.label);
    const payload = {
      workspace_id: workspace.id,
      key,
      label: editing.label.trim(),
      color: editing.color || "gray",
      probability: Number(editing.probability ?? 0),
      position: Number(editing.position ?? 0),
      is_won: !!editing.is_won,
      is_lost: !!editing.is_lost,
      is_active: editing.is_active ?? true,
    };
    const { error } = editing.id && !String(editing.id).startsWith("fallback-")
      ? await supabase.from("crm_stage_configs").update(payload).eq("id", editing.id)
      : await supabase.from("crm_stage_configs").insert(payload);
    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return;
    }
    setEditing(null);
    reload();
  };

  const move = async (s: StageConfig, dir: -1 | 1) => {
    const sorted = [...stages].sort((a, b) => a.position - b.position);
    const idx = sorted.findIndex((x) => x.id === s.id);
    const swap = sorted[idx + dir];
    if (!swap) return;
    setBusyId(s.id);
    await Promise.all([
      supabase.from("crm_stage_configs").update({ position: swap.position }).eq("id", s.id),
      supabase.from("crm_stage_configs").update({ position: s.position }).eq("id", swap.id),
    ]);
    setBusyId(null);
    reload();
  };

  const remove = async (s: StageConfig) => {
    if (!confirm(`Delete stage "${s.label}"? Opportunities currently in this stage will keep the value until reassigned.`)) return;
    setBusyId(s.id);
    const { error } = await supabase.from("crm_stage_configs").delete().eq("id", s.id);
    setBusyId(null);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
      return;
    }
    reload();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-serif">Opportunity Stage Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Master list of sales stages used in List, Detail, Kanban, Dashboard and Reports for {workspace.name}.
          </p>
        </div>
        {canEdit && (
          <Button onClick={openNew} size="sm" className="gap-1">
            <Plus className="h-4 w-4" /> Add Stage
          </Button>
        )}
      </div>

      <div className="border rounded-md bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-[11px] uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="text-left px-3 py-2 w-16">Order</th>
              <th className="text-left px-3 py-2">Stage</th>
              <th className="text-left px-3 py-2 w-32">Probability</th>
              <th className="text-left px-3 py-2 w-32">Outcome</th>
              <th className="text-left px-3 py-2 w-24">Active</th>
              {canEdit && <th className="text-right px-3 py-2 w-40">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y">
            {stages.map((s) => {
              const tone = STAGE_COLOR_CLASSES[s.color] || STAGE_COLOR_CLASSES.gray;
              return (
                <tr key={s.id} className={cn(busyId === s.id && "opacity-60")}>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{s.position}</td>
                  <td className="px-3 py-2">
                    <Badge variant="secondary" className={cn(tone, "border")}>{s.label}</Badge>
                    <div className="text-[10px] text-muted-foreground mt-1">{s.key}</div>
                  </td>
                  <td className="px-3 py-2 tabular-nums">{s.probability}%</td>
                  <td className="px-3 py-2 text-xs">
                    {s.is_won ? <span className="text-green-700">Won</span>
                      : s.is_lost ? <span className="text-red-600">Lost</span>
                      : <span className="text-muted-foreground">Open</span>}
                  </td>
                  <td className="px-3 py-2">
                    {s.is_active ? <span className="text-xs text-green-700">Yes</span> : <span className="text-xs text-muted-foreground">No</span>}
                  </td>
                  {canEdit && (
                    <td className="px-3 py-2 text-right">
                      <div className="inline-flex items-center gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => move(s, -1)} aria-label="Move up">
                          <ArrowUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => move(s, 1)} aria-label="Move down">
                          <ArrowDown className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(s)} aria-label="Edit">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => remove(s)} aria-label="Delete">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit Stage" : "Add Stage"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div>
              <Label className="text-xs">Label</Label>
              <Input value={editing?.label || ""} onChange={(e) => setEditing((p) => ({ ...p!, label: e.target.value }))} placeholder="Site Visit" />
            </div>
            {!editing?.id || String(editing.id).startsWith("fallback-") ? (
              <div>
                <Label className="text-xs">Key (auto-generated)</Label>
                <Input value={editing?.key || slugify(editing?.label || "")} onChange={(e) => setEditing((p) => ({ ...p!, key: slugify(e.target.value) }))} placeholder="site_visit" />
              </div>
            ) : null}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Color</Label>
                <Select value={editing?.color || "gray"} onValueChange={(v) => setEditing((p) => ({ ...p!, color: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-72">
                    {COLORS.map((c) => (
                      <SelectItem key={c} value={c}>
                        <span className="inline-flex items-center gap-2">
                          <span className={cn("inline-block h-3 w-3 rounded-full border", STAGE_COLOR_CLASSES[c])} />
                          {c}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Probability (%)</Label>
                <Input type="number" min={0} max={100} value={editing?.probability ?? 0} onChange={(e) => setEditing((p) => ({ ...p!, probability: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="flex items-center gap-6 pt-1">
              <label className="inline-flex items-center gap-2 text-sm">
                <Switch checked={!!editing?.is_won} onCheckedChange={(v) => setEditing((p) => ({ ...p!, is_won: v, is_lost: v ? false : p?.is_lost }))} />
                Marks as Won
              </label>
              <label className="inline-flex items-center gap-2 text-sm">
                <Switch checked={!!editing?.is_lost} onCheckedChange={(v) => setEditing((p) => ({ ...p!, is_lost: v, is_won: v ? false : p?.is_won }))} />
                Marks as Lost
              </label>
              <label className="inline-flex items-center gap-2 text-sm">
                <Switch checked={editing?.is_active ?? true} onCheckedChange={(v) => setEditing((p) => ({ ...p!, is_active: v }))} />
                Active
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

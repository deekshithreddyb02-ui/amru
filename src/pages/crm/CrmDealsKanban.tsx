import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent,
  PointerSensor, useSensor, useSensors,
  useDroppable, useDraggable,
} from "@dnd-kit/core";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, IndianRupee } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { CrmWorkspace } from "@/hooks/useCrmWorkspaces";

type Ctx = { workspace: CrmWorkspace; myRole: string };

type Deal = {
  id: string;
  title: string;
  amount: number;
  stage: string;
  probability: number;
  expected_close: string | null;
  organization_id: string | null;
  contact_id: string | null;
  position: number;
  organization?: { name: string } | null;
  contact?: { full_name: string } | null;
};

type Ref = { id: string; name: string };

const STAGES: { key: string; label: string; tint: string }[] = [
  { key: "new",         label: "New",         tint: "border-t-primary" },
  { key: "qualified",   label: "Qualified",   tint: "border-t-[hsl(var(--teal))]" },
  { key: "proposal",    label: "Proposal",    tint: "border-t-secondary" },
  { key: "negotiation", label: "Negotiation", tint: "border-t-[hsl(var(--gold))]" },
  { key: "won",         label: "Won",         tint: "border-t-green-500" },
  { key: "lost",        label: "Lost",        tint: "border-t-destructive" },
];

const fmtINR = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);

const emptyForm = {
  title: "", amount: "", stage: "new", probability: "10",
  expected_close: "", organization_id: "", contact_id: "", description: "",
};

// --- Card ---
const DealCard = ({ deal, dragging }: { deal: Deal; dragging?: boolean }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: deal.id,
    data: { stage: deal.stage },
  });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-card border rounded-md p-3 shadow-sm cursor-grab active:cursor-grabbing select-none ${
        isDragging || dragging ? "opacity-50" : ""
      }`}
    >
      <div className="font-medium text-sm leading-tight">{deal.title}</div>
      <div className="flex items-center gap-1 mt-1 text-sm font-semibold text-primary">
        <IndianRupee className="h-3.5 w-3.5" /> {fmtINR(Number(deal.amount)).replace("₹", "").trim()}
      </div>
      {(deal.organization?.name || deal.contact?.full_name) && (
        <div className="text-xs text-muted-foreground mt-1 truncate">
          {deal.organization?.name || deal.contact?.full_name}
        </div>
      )}
      <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground">
        <span>{deal.probability}%</span>
        {deal.expected_close && <span>{new Date(deal.expected_close).toLocaleDateString("en-IN")}</span>}
      </div>
    </div>
  );
};

// --- Column ---
const Column = ({
  stage, label, tint, deals,
}: {
  stage: string; label: string; tint: string; deals: Deal[];
}) => {
  const { setNodeRef, isOver } = useDroppable({ id: `col:${stage}`, data: { stage } });
  const total = deals.reduce((sum, d) => sum + Number(d.amount || 0), 0);
  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col w-72 shrink-0 bg-muted/30 rounded-lg border-t-4 ${tint} ${
        isOver ? "ring-2 ring-primary" : ""
      }`}
    >
      <div className="p-3 border-b bg-card/60">
        <div className="flex items-center justify-between">
          <div className="font-medium text-sm">{label}</div>
          <span className="text-xs text-muted-foreground">{deals.length}</span>
        </div>
        <div className="text-xs text-muted-foreground mt-1">{fmtINR(total)}</div>
      </div>
      <div className="p-2 space-y-2 min-h-32 flex-1">
        {deals.map((d) => <DealCard key={d.id} deal={d} />)}
      </div>
    </div>
  );
};

const CrmDeals = () => {
  const { workspace } = useOutletContext<Ctx>();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [orgs, setOrgs] = useState<Ref[]>([]);
  const [contacts, setContacts] = useState<Ref[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const load = async () => {
    setLoading(true);
    const [d, o, c] = await Promise.all([
      supabase
        .from("crm_deals")
        .select("id,title,amount,stage,probability,expected_close,organization_id,contact_id,position,organization:crm_organizations(name),contact:crm_contacts(full_name)")
        .eq("workspace_id", workspace.id)
        .order("position"),
      supabase.from("crm_organizations").select("id,name").eq("workspace_id", workspace.id).order("name"),
      supabase
        .from("crm_contacts")
        .select("id,full_name")
        .eq("workspace_id", workspace.id)
        .order("full_name"),
    ]);
    setDeals((d.data as unknown as Deal[]) || []);
    setOrgs((o.data as Ref[]) || []);
    setContacts(((c.data || []) as { id: string; full_name: string }[]).map((r) => ({ id: r.id, name: r.full_name })));
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace.id]);

  const dealsByStage = useMemo(() => {
    const m: Record<string, Deal[]> = {};
    STAGES.forEach((s) => (m[s.key] = []));
    deals.forEach((d) => { (m[d.stage] ||= []).push(d); });
    return m;
  }, [deals]);

  const onDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));

  const onDragEnd = async (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const dealId = String(active.id);
    const overId = String(over.id);
    const newStage = overId.startsWith("col:") ? overId.slice(4) : (over.data.current?.stage as string);
    if (!newStage) return;
    const deal = deals.find((d) => d.id === dealId);
    if (!deal || deal.stage === newStage) return;

    // optimistic
    setDeals((prev) => prev.map((d) => (d.id === dealId ? { ...d, stage: newStage } : d)));
    const { error } = await supabase.from("crm_deals").update({ stage: newStage }).eq("id", dealId);
    if (error) {
      toast({ title: "Move failed", description: error.message, variant: "destructive" });
      load();
    }
  };

  const save = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await supabase.from("crm_deals").insert({
      workspace_id: workspace.id,
      title: form.title.trim(),
      amount: Number(form.amount) || 0,
      stage: form.stage,
      probability: Number(form.probability) || 10,
      expected_close: form.expected_close || null,
      organization_id: form.organization_id || null,
      contact_id: form.contact_id || null,
      description: form.description || null,
      owner_id: session?.user.id,
      created_by: session?.user.id,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Deal created" });
      setForm(emptyForm);
      setOpen(false);
      load();
    }
  };

  const activeDeal = deals.find((d) => d.id === activeId) || null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-serif">Deals</h1>
          <p className="text-muted-foreground text-sm">{workspace.name} · drag cards between stages</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> New deal</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New deal</DialogTitle></DialogHeader>
            <div className="space-y-3 py-2">
              <div>
                <Label>Title *</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Amount (INR)</Label>
                  <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                </div>
                <div>
                  <Label>Stage</Label>
                  <Select value={form.stage} onValueChange={(v) => setForm({ ...form, stage: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STAGES.map((s) => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Probability %</Label>
                  <Input type="number" min={0} max={100} value={form.probability} onChange={(e) => setForm({ ...form, probability: e.target.value })} />
                </div>
                <div>
                  <Label>Expected close</Label>
                  <Input type="date" value={form.expected_close} onChange={(e) => setForm({ ...form, expected_close: e.target.value })} />
                </div>
                <div>
                  <Label>Organization</Label>
                  <Select
                    value={form.organization_id || "none"}
                    onValueChange={(v) => setForm({ ...form, organization_id: v === "none" ? "" : v })}
                  >
                    <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {orgs.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Contact</Label>
                  <Select
                    value={form.contact_id || "none"}
                    onValueChange={(v) => setForm({ ...form, contact_id: v === "none" ? "" : v })}
                  >
                    <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {contacts.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={save} disabled={saving || !form.title.trim()}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <Card className="p-12 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></Card>
      ) : (
        <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-3 min-w-max">
              {STAGES.map((s) => (
                <Column
                  key={s.key}
                  stage={s.key}
                  label={s.label}
                  tint={s.tint}
                  deals={dealsByStage[s.key] || []}
                />
              ))}
            </div>
          </div>
          <DragOverlay>{activeDeal ? <DealCard deal={activeDeal} dragging /> : null}</DragOverlay>
        </DndContext>
      )}
    </div>
  );
};

export default CrmDeals;

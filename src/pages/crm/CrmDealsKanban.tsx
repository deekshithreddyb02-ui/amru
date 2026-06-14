import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
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
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, IndianRupee, Download, LayoutGrid, List as ListIcon } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { CrmWorkspace } from "@/hooks/useCrmWorkspaces";
import CrmListView, { type Column, type SavedView } from "@/components/crm/vtiger/CrmListView";
import { exportCsv } from "@/lib/csv";
import DealSidePanel from "@/components/crm/DealSidePanel";
import { useCrmLabels } from "@/hooks/useCrmLabels";
import EditableLabel, { COLOR_TONE_MAP } from "@/components/crm/EditableLabel";


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
  owner_id: string | null;
  position: number;
  organization?: { name: string } | null;
  contact?: { full_name: string } | null;
  owner_name?: string;
};

type Ref = { id: string; name: string };

const STAGES: { key: string; label: string; tint: string; tone: string }[] = [
  { key: "new",         label: "Prospecting", tint: "border-t-primary",                  tone: "bg-amber-100 text-amber-800" },
  { key: "qualified",   label: "Qualified",   tint: "border-t-[hsl(var(--teal))]",        tone: "bg-blue-100 text-blue-800" },
  { key: "proposal",    label: "Proposal",    tint: "border-t-secondary",                 tone: "bg-indigo-100 text-indigo-800" },
  { key: "negotiation", label: "Negotiation", tint: "border-t-[hsl(var(--gold))]",        tone: "bg-yellow-100 text-yellow-800" },
  { key: "won",         label: "Won",         tint: "border-t-green-500",                 tone: "bg-green-100 text-green-800" },
  { key: "lost",        label: "Lost",        tint: "border-t-destructive",               tone: "bg-red-100 text-red-700" },
];

const stageMeta = (k: string) => STAGES.find((s) => s.key === k) ?? { label: k, tone: "bg-muted text-foreground" };

const fmtINR = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);

const emptyForm = {
  title: "", amount: "", stage: "new", probability: "10",
  expected_close: "", organization_id: "", contact_id: "", description: "",
};

// --- Card ---
const DealCard = ({ deal, dragging, onOpen }: { deal: Deal; dragging?: boolean; onOpen?: (id: string) => void }) => {
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
      onClick={() => { if (!isDragging) onOpen?.(deal.id); }}
      className={`bg-card border rounded-md p-3 shadow-sm cursor-pointer active:cursor-grabbing select-none touch-none ${
        isDragging || dragging ? "opacity-50" : ""
      }`}
    >
      <div className="font-medium text-sm leading-tight break-words">{deal.title}</div>
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
  stage, label, tint, deals, onOpen, headerNode,
}: {
  stage: string; label: string; tint: string; deals: Deal[]; onOpen?: (id: string) => void; headerNode?: ReactNode;
}) => {

  const { setNodeRef, isOver } = useDroppable({ id: `col:${stage}`, data: { stage } });
  const total = deals.reduce((sum, d) => sum + Number(d.amount || 0), 0);
  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col w-64 sm:w-72 shrink-0 bg-muted/30 rounded-lg border-t-4 ${tint} ${
        isOver ? "ring-2 ring-primary" : ""
      }`}
    >
      <div className="p-3 border-b bg-card/60">
        <div className="flex items-center justify-between">
          <div className="font-medium text-sm">{headerNode ?? label}</div>

          <span className="text-xs text-muted-foreground">{deals.length}</span>
        </div>
        <div className="text-xs text-muted-foreground mt-1">{fmtINR(total)}</div>
        <div className="text-[10px] text-muted-foreground/70 mt-0.5">
          Weighted: {fmtINR(deals.reduce((s, d) => s + (Number(d.amount || 0) * Number(d.probability || 0)) / 100, 0))}
        </div>
      </div>
      <div className="p-2 space-y-2 min-h-32 flex-1">
        {deals.map((d) => <DealCard key={d.id} deal={d} onOpen={onOpen} />)}
      </div>
    </div>
  );
};

const CrmDeals = () => {
  const { workspace } = useOutletContext<Ctx>();
  const navigate = useNavigate();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [orgs, setOrgs] = useState<Ref[]>([]);
  const [contacts, setContacts] = useState<Ref[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [view, setView] = useState<"list" | "kanban">("list");
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);

  const colLabels = useCrmLabels(workspace.id, "deals_columns");
  const sumLabels = useCrmLabels(workspace.id, "deals_summary");
  const stageLabels = useCrmLabels(workspace.id, "deals_stages");

  const stageInfo = (k: string) => {
    const base = STAGES.find((s) => s.key === k);
    const ov = stageLabels.labels[k];
    const colorKey = ov?.extra?.color as string | undefined;
    return {
      label: ov?.label || base?.label || k,
      tone: colorKey && COLOR_TONE_MAP[colorKey] ? COLOR_TONE_MAP[colorKey] : (base?.tone || "bg-muted text-foreground"),
      tint: base?.tint || "border-t-primary",
    };
  };

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));


  const load = async () => {
    setLoading(true);
    const [d, o, c] = await Promise.all([
      supabase
        .from("crm_deals")
        .select("id,title,amount,stage,probability,expected_close,organization_id,contact_id,owner_id,position,organization:crm_organizations(name),contact:crm_contacts(full_name)")
        .eq("workspace_id", workspace.id)
        .order("position"),
      supabase.from("crm_organizations").select("id,name").eq("workspace_id", workspace.id).order("name"),
      supabase
        .from("crm_contacts")
        .select("id,full_name")
        .eq("workspace_id", workspace.id)
        .order("full_name"),
    ]);
    const list = (d.data as unknown as Deal[]) || [];
    // Resolve owner names
    const ownerIds = Array.from(new Set(list.map((x) => x.owner_id).filter(Boolean) as string[]));
    let nameMap: Record<string, string> = {};
    if (ownerIds.length) {
      const { data: profs } = await supabase
        .from("profiles").select("user_id,full_name,username").in("user_id", ownerIds);
      (profs || []).forEach((p: any) => { nameMap[p.user_id] = p.full_name || p.username || ""; });
    }
    setDeals(list.map((x) => ({ ...x, owner_name: x.owner_id ? nameMap[x.owner_id] || "—" : "—" })));
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
      toast({ title: "Opportunity created" });
      setForm(emptyForm);
      setOpen(false);
      load();
    }
  };

  const activeDeal = deals.find((d) => d.id === activeId) || null;
  const openPipeline = deals.filter((d) => d.stage !== "won" && d.stage !== "lost");
  const totalPipeline = openPipeline.reduce((s, d) => s + Number(d.amount || 0), 0);
  const weightedForecast = openPipeline.reduce(
    (s, d) => s + (Number(d.amount || 0) * Number(d.probability || 0)) / 100, 0,
  );
  const wonTotal = deals.filter((d) => d.stage === "won").reduce((s, d) => s + Number(d.amount || 0), 0);

  const savedViews: SavedView[] = [
    { id: "all", label: "All Opportunities" },
    { id: "open", label: "Open Pipeline", filter: (d: Deal) => d.stage !== "won" && d.stage !== "lost" },
    { id: "prospecting", label: "Prospecting", filter: (d: Deal) => d.stage === "new" },
    { id: "won", label: "Won", filter: (d: Deal) => d.stage === "won" },
    { id: "lost", label: "Lost", filter: (d: Deal) => d.stage === "lost" },
  ];

  const mkCol = (key: string, fallback: string, render: (d: Deal) => ReactNode, opts: Partial<Column<Deal>> = {}): Column<Deal> => ({
    key,
    label: colLabels.get(key, fallback),
    headerNode: (
      <EditableLabel
        labelKey={key}
        value={colLabels.labels[key]?.label}
        fallback={fallback}
        canEdit={colLabels.canEdit}
        onSave={colLabels.setLabel}
        className="text-[12px] uppercase tracking-wide"
      />
    ),
    render,
    ...opts,
  });

  const columns: Column<Deal>[] = [
    mkCol("title", "Opportunity Name", (d) => (
      <button
        className="font-medium text-primary hover:underline text-left"
        onClick={(e) => { e.stopPropagation(); navigate(`/crm/${workspace.slug}/deals/${d.id}`); }}
        data-no-row-click
      >
        {d.title}
      </button>
    )),
    mkCol("organization", "Organization Name", (d) => d.organization?.name
      ? <span className="text-primary">{d.organization.name}</span>
      : <span className="text-muted-foreground">—</span>),
    mkCol("stage", "Sales Stage", (d) => {
      const m = stageInfo(d.stage);
      return (
        <EditableLabel
          labelKey={d.stage}
          value={stageLabels.labels[d.stage]?.label}
          fallback={STAGES.find((s) => s.key === d.stage)?.label || d.stage}
          canEdit={stageLabels.canEdit}
          onSave={stageLabels.setLabel}
          extra={stageLabels.labels[d.stage]?.extra}
          extraFields={["color"]}
          render={(lbl) => <Badge variant="secondary" className={m.tone}>{lbl}</Badge>}
        />
      );
    }),
    mkCol("expected_close", "Expected Close Date",
      (d) => d.expected_close ? new Date(d.expected_close).toLocaleDateString("en-IN") : "—"),
    mkCol("amount", "Amount",
      (d) => <span className="tabular-nums">{fmtINR(Number(d.amount || 0))}</span>,
      { className: "text-right" }),
    mkCol("owner_name", "Assigned To", (d) => <>{d.owner_name || "—"}</>),
    mkCol("contact", "Contact Name", (d) => d.contact?.full_name
      ? <span className="text-primary">{d.contact.full_name}</span>
      : <span className="text-muted-foreground">—</span>),
    mkCol("probability", "Probability", (d) => <>{d.probability}%</>, { defaultVisible: false }),
  ];


  const rightActions = (
    <>
      <div className="inline-flex rounded-md border bg-card overflow-hidden h-8">
        <button
          onClick={() => setView("list")}
          className={`px-2 inline-flex items-center gap-1 text-xs ${view === "list" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
          aria-label="List view"
        >
          <ListIcon className="h-3.5 w-3.5" /><span className="hidden sm:inline">List</span>
        </button>
        <button
          onClick={() => setView("kanban")}
          className={`px-2 inline-flex items-center gap-1 text-xs border-l ${view === "kanban" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
          aria-label="Kanban view"
        >
          <LayoutGrid className="h-3.5 w-3.5" /><span className="hidden sm:inline">Kanban</span>
        </button>
      </div>
      <Button
        variant="outline" size="sm" className="h-8 gap-1"
        onClick={() => exportCsv("opportunities", deals, [
          { key: "title", label: "Opportunity Name" },
          { key: "stage", label: "Sales Stage" },
          { key: "amount", label: "Amount" },
          { key: "probability", label: "Probability" },
          { key: "expected_close", label: "Expected Close" },
          { key: "owner_name", label: "Assigned To" },
        ])}
      >
        <Download className="h-3.5 w-3.5" />
        <span className="hidden sm:inline text-xs">Export</span>
      </Button>
    </>
  );

  return (
    <div className="space-y-4">
      {!loading && (() => {
        const sumCard = (key: string, fallback: string, valueNode: ReactNode, subFallback: string, subKey: string, valueClass = "") => (
          <Card className="p-3">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
              <EditableLabel
                labelKey={key}
                value={sumLabels.labels[key]?.label}
                fallback={fallback}
                canEdit={sumLabels.canEdit}
                onSave={sumLabels.setLabel}
              />
            </div>
            <div className={`text-lg font-semibold mt-1 ${valueClass}`}>{valueNode}</div>
            <div className="text-[10px] text-muted-foreground">
              <EditableLabel
                labelKey={subKey}
                value={sumLabels.labels[subKey]?.label}
                fallback={subFallback}
                canEdit={sumLabels.canEdit}
                onSave={sumLabels.setLabel}
              />
            </div>
          </Card>
        );
        const closed = deals.filter((d) => d.stage === "won" || d.stage === "lost").length;
        const won = deals.filter((d) => d.stage === "won").length;
        const winRate = closed === 0 ? "—" : `${Math.round((won / closed) * 100)}%`;
        return (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {sumCard("open_title", "Open Pipeline", fmtINR(totalPipeline), `${openPipeline.length} opportunities`, "open_sub")}
            {sumCard("weighted_title", "Weighted Forecast", fmtINR(weightedForecast), "amount × probability", "weighted_sub", "text-primary")}
            {sumCard("won_title", "Won", fmtINR(wonTotal), `${won} opportunities`, "won_sub", "text-green-600")}
            {sumCard("winrate_title", "Win Rate", winRate, "won / closed", "winrate_sub")}
          </div>
        );
      })()}


      {view === "list" ? (
        <CrmListView<Deal>
          title="Opportunities"
          subtitle={workspace.name}
          rows={deals}
          loading={loading}
          columns={columns}
          savedViews={savedViews}
          defaultViewId="all"
          searchKeys={["title"]}
          onRefresh={load}
          onCreate={() => setOpen(true)}
          onRowClick={(d) => setSelectedDealId(d.id)}
          rightActions={rightActions}
        />
      ) : (
        <>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
            <div>
              <h1 className="font-serif text-xl sm:text-2xl">Opportunities</h1>
              <p className="text-muted-foreground text-xs">{workspace.name} · drag cards between stages</p>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">{rightActions}
              <Button size="sm" className="h-8 gap-1" onClick={() => setOpen(true)}>
                <Plus className="h-3.5 w-3.5" /><span className="text-xs">New</span>
              </Button>
            </div>
          </div>
          {loading ? (
            <Card className="p-12 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></Card>
          ) : (
            <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
              <div className="overflow-x-auto pb-4">
                <div className="flex gap-3 min-w-max">
                  {STAGES.map((s) => (
                    <Column key={s.key} stage={s.key} label={s.label} tint={s.tint} deals={dealsByStage[s.key] || []} onOpen={setSelectedDealId} />
                  ))}
                </div>
              </div>
              <DragOverlay>{activeDeal ? <DealCard deal={activeDeal} dragging /> : null}</DragOverlay>
            </DndContext>
          )}
        </>
      )}

      {selectedDealId && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setSelectedDealId(null)}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative h-full" onClick={(e) => e.stopPropagation()}>
            <DealSidePanel
              dealId={selectedDealId}
              workspaceSlug={workspace.slug}
              onClose={() => setSelectedDealId(null)}
              onPrev={() => {
                const i = deals.findIndex((d) => d.id === selectedDealId);
                if (i > 0) setSelectedDealId(deals[i - 1].id);
              }}
              onNext={() => {
                const i = deals.findIndex((d) => d.id === selectedDealId);
                if (i >= 0 && i < deals.length - 1) setSelectedDealId(deals[i + 1].id);
              }}
              hasPrev={deals.findIndex((d) => d.id === selectedDealId) > 0}
              hasNext={(() => { const i = deals.findIndex((d) => d.id === selectedDealId); return i >= 0 && i < deals.length - 1; })()}
            />
          </div>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New opportunity</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Opportunity Name *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Amount (INR)</Label>
                <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </div>
              <div>
                <Label>Sales Stage</Label>
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
                <Label>Expected Close Date</Label>
                <Input type="date" value={form.expected_close} onChange={(e) => setForm({ ...form, expected_close: e.target.value })} />
              </div>
              <div>
                <Label>Organization</Label>
                <Select value={form.organization_id || "none"} onValueChange={(v) => setForm({ ...form, organization_id: v === "none" ? "" : v })}>
                  <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {orgs.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Contact</Label>
                <Select value={form.contact_id || "none"} onValueChange={(v) => setForm({ ...form, contact_id: v === "none" ? "" : v })}>
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
  );
};

export default CrmDeals;

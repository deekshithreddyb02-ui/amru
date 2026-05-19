import { useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Edit2,
  Trash2,
  MessageSquare,
  Plus,
  Search,
  Eye,
  Star,
  MoreVertical,
  Loader2,
  ArrowRightLeft,
  ArrowUpDown,
} from "lucide-react";
import type { CrmWorkspace } from "@/hooks/useCrmWorkspaces";
import ConvertLeadDialog from "@/components/crm/ConvertLeadDialog";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LayoutGrid, List as ListIcon, X } from "lucide-react";
import CrmKanban from "@/components/crm/vtiger/CrmKanban";
import { useSavedViews } from "@/hooks/useSavedViews";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { exportCsv } from "@/lib/csv";

type Ctx = { workspace: CrmWorkspace; myRole: string };

type Lead = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  service_needed: string | null;
  stage: string;
  status: string;
  created_at: string;
  organization?: { name: string } | null;
  assigned_user?: { full_name: string | null } | null;
};

type ListDef = { id: string; label: string; filter?: (l: Lead) => boolean };

const SHARED_LISTS: ListDef[] = [
  { id: "all", label: "All" },
  { id: "hot", label: "Hot Leads", filter: (l) => l.stage === "qualified" },
  {
    id: "month",
    label: "This Month Leads",
    filter: (l) => Date.now() - new Date(l.created_at).getTime() < 30 * 86400000,
  },
];

const splitName = (n: string) => {
  const parts = (n || "").trim().split(/\s+/);
  return { first: parts[0] || "", last: parts.slice(1).join(" ") };
};

const PAGE_SIZE = 20;

const CrmLeads = () => {
  const { workspace } = useOutletContext<Ctx>();
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [convertLead, setConvertLead] = useState<Lead | null>(null);
  const [activeList, setActiveList] = useState("all");
  const [collapsed, setCollapsed] = useState(false);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [listSearch, setListSearch] = useState("");
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saveShared, setSaveShared] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newLead, setNewLead] = useState({ full_name: "", email: "", phone: "", city: "", state: "", service_needed: "", notes: "" });
  const { views: savedViews, create: createView, remove: removeView } = useSavedViews(workspace.id, "leads");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("crm_leads")
      .select(
        "id,full_name,email,phone,city,state,service_needed,stage,status,created_at"
      )
      .eq("workspace_id", workspace.id)
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) console.error("Failed to load leads:", error);
    setLeads(((data || []) as any[]).map((r) => ({ ...r, organization: null })) as Lead[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace.id]);

  // Resolve active list: shared first, then DB saved view
  const sharedList = SHARED_LISTS.find((l) => l.id === activeList);
  const dbView = savedViews.find((v) => v.id === activeList);
  const list: ListDef = sharedList || (dbView
    ? { id: dbView.id, label: dbView.name, filter: undefined }
    : SHARED_LISTS[0]);

  // Apply DB view filters if active
  const dbFilters: Record<string, string> = useMemo(() => {
    if (!dbView || !Array.isArray(dbView.filters)) return {};
    const o: Record<string, string> = {};
    (dbView.filters as any[]).forEach((f) => {
      if (f && f.field) o[f.field] = String(f.value ?? "");
    });
    return o;
  }, [dbView]);

  const effectiveFilters = { ...dbFilters, ...filters };

  const filtered = useMemo(() => {
    let out = leads;
    if (list.filter) out = out.filter(list.filter);
    out = out.filter((l) => {
      const { first, last } = splitName(l.full_name);
      const fields: Record<string, string> = {
        first_name: first,
        last_name: last,
        company: l.organization?.name || "",
        primary_phone: l.phone || "",
        website: "",
        primary_email: l.email || "",
        assigned_to: "",
        service: l.service_needed || "",
        city: [l.city, l.state].filter(Boolean).join(", "),
        stage: l.stage || "",
        created: new Date(l.created_at).toLocaleDateString("en-IN"),
      };
      return Object.entries(effectiveFilters).every(([k, v]) =>
        !v ? true : (fields[k] || "").toLowerCase().includes(v.toLowerCase())
      );
    });
    out = [...out].sort((a, b) => {
      const av = (a as any)[sortBy] ?? "";
      const bv = (b as any)[sortBy] ?? "";
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return out;
  }, [leads, list, effectiveFilters, sortBy, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const startIdx = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endIdx = Math.min(page * PAGE_SIZE, filtered.length);

  const allChecked = pageRows.length > 0 && pageRows.every((r) => selected.has(r.id));
  const toggleAll = () => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (allChecked) pageRows.forEach((r) => n.delete(r.id));
      else pageRows.forEach((r) => n.add(r.id));
      return n;
    });
  };
  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const sortHeader = (key: string, label: string) => (
    <button
      className="flex items-center gap-1 font-semibold text-[13px] text-foreground hover:text-primary"
      onClick={() => {
        if (sortBy === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
        else { setSortBy(key); setSortDir("asc"); }
      }}
    >
      <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
      {label}
    </button>
  );

  const COLS = [
    { key: "first_name", label: "First Name" },
    { key: "last_name", label: "Last Name" },
    { key: "primary_phone", label: "Phone" },
    { key: "primary_email", label: "Email" },
    { key: "service", label: "Service" },
    { key: "city", label: "City" },
    { key: "stage", label: "Stage" },
    { key: "created", label: "Created" },
  ];

  return (
    <div className="-m-3 sm:-m-4 lg:-m-6 flex flex-col h-[calc(100vh-7rem)] bg-white text-[13px]">
      {/* Top breadcrumb bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-white">
        <div className="flex items-center gap-2 text-[13px]">
          <span className="uppercase font-semibold tracking-wide text-foreground">Leads</span>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">{list.label}</span>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)} className="h-8 gap-1 bg-primary hover:bg-primary/90 text-primary-foreground">
          <Plus className="h-4 w-4" /> Add Lead
        </Button>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Left lists panel */}
        {!collapsed && (
          <aside className="w-[260px] border-r bg-white flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <span className="text-[12px] font-semibold tracking-wide text-foreground">LISTS</span>
              <button
                onClick={() => { setSaveName(""); setSaveShared(false); setSaveOpen(true); }}
                title="Save current filters as a list"
                className="h-6 w-6 inline-flex items-center justify-center border rounded text-muted-foreground hover:bg-muted"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="px-3 py-2 border-b">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={listSearch}
                  onChange={(e) => setListSearch(e.target.value)}
                  placeholder="Search for List"
                  className="h-8 pl-7 text-[12px]"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto py-2">
              <div className="px-4 py-1 text-[11px] font-semibold tracking-wide text-muted-foreground">
                SHARED LIST
              </div>
              {SHARED_LISTS
                .filter((l) => l.label.toLowerCase().includes(listSearch.toLowerCase()))
                .map((l) => {
                  const active = l.id === activeList;
                  return (
                    <button
                      key={l.id}
                      onClick={() => { setActiveList(l.id); setPage(1); }}
                      className={cn(
                        "w-full flex items-center justify-between px-4 py-1.5 text-[13px] text-left hover:bg-muted/40",
                        active && "bg-primary/10 text-primary font-medium"
                      )}
                    >
                      <span>{l.label}</span>
                      {active && <ChevronDown className="h-3 w-3" />}
                    </button>
                  );
                })}
              {savedViews.length > 0 && (
                <>
                  <div className="px-4 mt-4 py-1 text-[11px] font-semibold tracking-wide text-muted-foreground">
                    MY LISTS
                  </div>
                  {savedViews
                    .filter((v) => v.name.toLowerCase().includes(listSearch.toLowerCase()))
                    .map((v) => {
                      const active = v.id === activeList;
                      return (
                        <div
                          key={v.id}
                          className={cn(
                            "group w-full flex items-center justify-between px-4 py-1.5 text-[13px] hover:bg-muted/40",
                            active && "bg-primary/10 text-primary font-medium"
                          )}
                        >
                          <button
                            onClick={() => { setActiveList(v.id); setFilters({}); setPage(1); }}
                            className="flex-1 text-left truncate"
                          >
                            {v.name}{v.is_shared ? "" : " ·"}
                          </button>
                          <button
                            onClick={async () => {
                              await removeView(v.id);
                              if (activeList === v.id) setActiveList("all");
                              toast.success("List removed");
                            }}
                            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                            title="Delete list"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      );
                    })}
                </>
              )}
              <div className="px-4 mt-4 py-1 text-[11px] font-semibold tracking-wide text-muted-foreground">
                TAGS
              </div>
            </div>
          </aside>
        )}

        {/* Collapse handle */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="w-4 border-r bg-muted/30 hover:bg-muted flex items-center justify-center text-muted-foreground"
          aria-label="Toggle lists"
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>

        {/* Main */}
        <main className="flex-1 min-w-0 flex flex-col">
          {/* Action bar */}
          <div className="flex items-center justify-between px-3 py-2 border-b bg-white">
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-8 w-8" disabled={selected.size === 0}>
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" disabled={selected.size === 0}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" disabled={selected.size === 0}>
                <MessageSquare className="h-3.5 w-3.5" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 ml-1 gap-1 text-[12px]">
                    More <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={load}>Refresh</DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      exportCsv("leads", filtered, [
                        { key: "full_name", label: "Name" },
                        { key: "email", label: "Email" },
                        { key: "phone", label: "Phone" },
                        { key: "city", label: "City" },
                        { key: "state", label: "State" },
                        { key: "service_needed", label: "Service" },
                        { key: "stage", label: "Stage" },
                        { key: "status", label: "Status" },
                        { key: "company", label: "Company", get: (r) => r.organization?.name || "" },
                        { key: "created_at", label: "Created" },
                      ])
                    }
                  >
                    Export to CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate(`/crm/${workspace.slug}/import`)}>
                    Import
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
              <div className="inline-flex items-center border rounded overflow-hidden mr-2">
                <button
                  onClick={() => setViewMode("list")}
                  title="List view"
                  className={cn(
                    "h-7 w-7 inline-flex items-center justify-center",
                    viewMode === "list" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  )}
                >
                  <ListIcon className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setViewMode("kanban")}
                  title="Kanban view"
                  className={cn(
                    "h-7 w-7 inline-flex items-center justify-center border-l",
                    viewMode === "kanban" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  )}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </button>
              </div>
              {viewMode === "list" && (
                <>
                  <span>
                    {startIdx} to {endIdx} of {filtered.length}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-7 w-7">
                    <MoreVertical className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
              {viewMode === "kanban" && (
                <span>{filtered.length} records</span>
              )}
            </div>
          </div>

          {/* Body: list or kanban */}
          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : viewMode === "kanban" ? (
              <div className="p-3">
                <CrmKanban
                  columns={[
                    { id: "new",        label: "New",        tone: "bg-slate-400" },
                    { id: "contacted",  label: "Contacted",  tone: "bg-blue-400" },
                    { id: "qualified",  label: "Qualified",  tone: "bg-emerald-500" },
                    { id: "proposal",   label: "Proposal",   tone: "bg-amber-500" },
                    { id: "won",        label: "Won",        tone: "bg-green-600" },
                    { id: "lost",       label: "Lost",       tone: "bg-red-500" },
                  ]}
                  items={filtered}
                  groupBy={(l) => l.stage || "new"}
                  onCardClick={(l) => navigate(`/crm/${workspace.slug}/leads/${l.id}`)}
                  onMove={async (id, to) => {
                    setLeads((prev) => prev.map((l) => l.id === id ? { ...l, stage: to } : l));
                    const { error } = await supabase
                      .from("crm_leads")
                      .update({ stage: to })
                      .eq("id", id);
                    if (error) {
                      toast.error("Could not move lead");
                      load();
                    }
                  }}
                  renderCard={(l) => (
                    <div className="space-y-1">
                      <div className="font-medium truncate">{l.full_name || "Untitled"}</div>
                      {l.organization?.name && (
                        <div className="text-[11px] text-muted-foreground truncate">{l.organization.name}</div>
                      )}
                      {l.email && <div className="text-[11px] text-muted-foreground truncate">{l.email}</div>}
                      {l.phone && <div className="text-[11px] text-muted-foreground">{l.phone}</div>}
                      {l.service_needed && (
                        <div className="text-[10px] inline-block px-1.5 py-0.5 rounded bg-primary/10 text-primary mt-1">
                          {l.service_needed}
                        </div>
                      )}
                    </div>
                  )}
                />
              </div>
            ) : (
              <table className="w-full border-collapse">
                <thead className="bg-muted/30">
                  <tr className="border-b">
                    <th className="w-10 px-2 py-2 border-r">
                      <input
                        type="checkbox"
                        checked={allChecked}
                        onChange={toggleAll}
                        className="h-3.5 w-3.5"
                      />
                    </th>
                    {COLS.map((c) => (
                      <th key={c.key} className="px-3 py-2 text-left border-r whitespace-nowrap">
                        {sortHeader(c.key === "primary_email" ? "email" : c.key === "primary_phone" ? "phone" : c.key, c.label)}
                      </th>
                    ))}
                  </tr>
                  <tr className="border-b bg-white">
                    <th className="px-2 py-1.5 border-r">
                      <Button
                        size="sm"
                        onClick={() => { setFilters({}); setPage(1); }}
                        title="Clear all column filters"
                        className="h-7 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] w-full"
                      >
                        <X className="h-3 w-3" />
                        Clear
                      </Button>
                    </th>
                    {COLS.map((c) => (
                      <th key={c.key} className="px-2 py-1.5 border-r">
                        <div className="relative">
                          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
                          <Input
                            value={filters[c.key] || ""}
                            onChange={(e) => { setFilters({ ...filters, [c.key]: e.target.value }); setPage(1); }}
                            placeholder={`Search ${c.label.toLowerCase()}`}
                            className="h-7 pl-6 pr-6 text-[12px]"
                          />
                          {filters[c.key] && (
                            <button
                              type="button"
                              onClick={() => { const n = { ...filters }; delete n[c.key]; setFilters(n); setPage(1); }}
                              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              title="Clear"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageRows.length === 0 ? (
                    <tr>
                      <td colSpan={COLS.length + 1} className="text-center py-12 text-muted-foreground text-[13px]">
                        No records.
                      </td>
                    </tr>
                  ) : (
                    pageRows.map((l) => {
                      const { first, last } = splitName(l.full_name);
                      const sel = selected.has(l.id);
                      return (
                        <tr
                          key={l.id}
                          className={cn("border-b hover:bg-muted/20", sel && "bg-primary/5")}
                        >
                          <td className="px-2 py-2 border-r align-middle">
                            <div className="flex items-center gap-1">
                              <input
                                type="checkbox"
                                checked={sel}
                                onChange={() => toggleOne(l.id)}
                                className="h-3.5 w-3.5"
                              />
                              <button className="text-muted-foreground hover:text-primary p-0.5">
                                <Eye className="h-3.5 w-3.5" />
                              </button>
                              <button className="text-muted-foreground hover:text-yellow-500 p-0.5">
                                <Star className="h-3.5 w-3.5" />
                              </button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="text-muted-foreground hover:text-foreground p-0.5">
                                    <MoreVertical className="h-3.5 w-3.5" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start">
                                  <DropdownMenuItem
                                    onClick={() => navigate(`/crm/${workspace.slug}/leads/${l.id}`)}
                                  >
                                    Open
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    disabled={l.stage === "won" || l.stage === "lost"}
                                    onClick={() => setConvertLead(l)}
                                  >
                                    <ArrowRightLeft className="h-3.5 w-3.5 mr-2" /> Convert
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                          <td className="px-3 py-2 border-r">
                            <button
                              className="text-primary hover:underline"
                              onClick={() => navigate(`/crm/${workspace.slug}/leads/${l.id}`)}
                            >
                              {first || "—"}
                            </button>
                          </td>
                          <td className="px-3 py-2 border-r">
                            <button
                              className="text-primary hover:underline"
                              onClick={() => navigate(`/crm/${workspace.slug}/leads/${l.id}`)}
                            >
                              {last || "—"}
                            </button>
                          </td>
                          <td className="px-3 py-2 border-r">{l.phone || "—"}</td>
                          <td className="px-3 py-2 border-r">{l.email || "—"}</td>
                          <td className="px-3 py-2 border-r">{l.service_needed || "—"}</td>
                          <td className="px-3 py-2 border-r">{[l.city, l.state].filter(Boolean).join(", ") || "—"}</td>
                          <td className="px-3 py-2 border-r">
                            <span className="inline-block px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[11px] capitalize">
                              {l.stage || "new"}
                            </span>
                          </td>
                          <td className="px-3 py-2 border-r whitespace-nowrap text-muted-foreground">
                            {new Date(l.created_at).toLocaleDateString("en-IN")}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>

      <ConvertLeadDialog
        workspaceId={workspace.id}
        lead={convertLead as any}
        open={!!convertLead}
        onOpenChange={(v) => !v && setConvertLead(null)}
        onDone={() => { setConvertLead(null); load(); }}
      />

      {/* Save current filters as a list */}
      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save current filters as a list</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="lv-name">List name</Label>
              <Input
                id="lv-name"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="e.g. My Hot Telangana Leads"
                autoFocus
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="lv-shared" className="cursor-pointer">Share with workspace</Label>
              <Switch id="lv-shared" checked={saveShared} onCheckedChange={setSaveShared} />
            </div>
            <p className="text-xs text-muted-foreground">
              Captures column filters currently applied. Active list: <span className="font-medium">{list.label}</span>.
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSaveOpen(false)}>Cancel</Button>
            <Button
              disabled={!saveName.trim()}
              onClick={async () => {
                const filtersArr = Object.entries(filters)
                  .filter(([, v]) => v && v.trim())
                  .map(([field, value]) => ({ field, op: "contains", value }));
                const created = await createView({
                  name: saveName.trim(),
                  filters: filtersArr,
                  is_shared: saveShared,
                });
                if (created) {
                  toast.success("List saved");
                  setActiveList((created as any).id);
                  setSaveOpen(false);
                } else {
                  toast.error("Could not save list");
                }
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add new lead */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Lead</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Full Name *</Label>
              <Input value={newLead.full_name} onChange={(e) => setNewLead({ ...newLead, full_name: e.target.value })} autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={newLead.email} onChange={(e) => setNewLead({ ...newLead, email: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input value={newLead.phone} onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>City</Label>
              <Input value={newLead.city} onChange={(e) => setNewLead({ ...newLead, city: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>State</Label>
              <Input value={newLead.state} onChange={(e) => setNewLead({ ...newLead, state: e.target.value })} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Service Needed</Label>
              <Input value={newLead.service_needed} onChange={(e) => setNewLead({ ...newLead, service_needed: e.target.value })} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Notes</Label>
              <Input value={newLead.notes} onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddOpen(false)} disabled={adding}>Cancel</Button>
            <Button
              disabled={adding || !newLead.full_name.trim()}
              onClick={async () => {
                setAdding(true);
                const { data: { session } } = await supabase.auth.getSession();
                const { error } = await supabase.from("crm_leads").insert({
                  workspace_id: workspace.id,
                  full_name: newLead.full_name.trim(),
                  email: newLead.email.trim() || null,
                  phone: newLead.phone.trim() || null,
                  city: newLead.city.trim() || null,
                  state: newLead.state.trim() || null,
                  country: "India",
                  service_needed: newLead.service_needed.trim() || null,
                  notes: newLead.notes.trim() || null,
                  stage: "new",
                  status: "open",
                  created_by: session?.user?.id || null,
                } as any);
                setAdding(false);
                if (error) {
                  toast.error(error.message || "Could not create lead");
                  return;
                }
                toast.success("Lead created");
                setNewLead({ full_name: "", email: "", phone: "", city: "", state: "", service_needed: "", notes: "" });
                setAddOpen(false);
                load();
              }}
            >
              {adding ? "Saving…" : "Create Lead"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CrmLeads;

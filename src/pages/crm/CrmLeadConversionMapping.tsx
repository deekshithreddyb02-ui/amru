import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import {
  Loader2, Plus, Trash2, Save, X, Search, History, AlertTriangle, Info, Eye, ArrowRight,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { CrmWorkspace } from "@/hooks/useCrmWorkspaces";

type Ctx = { workspace: CrmWorkspace; myRole: string };

type FieldType =
  | "string" | "email" | "phone" | "number" | "date"
  | "text" | "picklist" | "currency" | "address";

type LeadField = { key: string; label: string; type: FieldType };

type ModuleKey =
  | "organization" | "contact" | "service_request"
  | "project" | "opportunity" | "customer" | "quotation";

type ModuleField = { key: string; label: string; type: FieldType };

type MappingRow = {
  id: string;
  leadKey: string;
  // map of moduleKey -> destination field key ("" / "none" = unmapped)
  targets: Partial<Record<ModuleKey, string>>;
};

const LEAD_FIELDS: LeadField[] = [
  { key: "company", label: "Company", type: "string" },
  { key: "first_name", label: "First Name", type: "string" },
  { key: "last_name", label: "Last Name", type: "string" },
  { key: "email", label: "Email", type: "email" },
  { key: "phone", label: "Phone", type: "phone" },
  { key: "mobile", label: "Mobile", type: "phone" },
  { key: "address", label: "Address", type: "address" },
  { key: "city", label: "City", type: "string" },
  { key: "state", label: "State", type: "string" },
  { key: "country", label: "Country", type: "string" },
  { key: "designation", label: "Designation", type: "string" },
  { key: "industry", label: "Industry", type: "string" },
  { key: "lead_source", label: "Lead Source", type: "picklist" },
  { key: "description", label: "Description", type: "text" },
  { key: "budget", label: "Project Budget", type: "currency" },
  // HydroGeo extras
  { key: "service_type", label: "Service Type", type: "picklist" },
  { key: "project_type", label: "Project Type", type: "picklist" },
  { key: "site_location", label: "Site Location", type: "string" },
  { key: "survey_type", label: "Survey Type", type: "picklist" },
  { key: "rwh_type", label: "Rainwater Harvesting Type", type: "picklist" },
  { key: "groundwater_service_type", label: "Groundwater Service Type", type: "picklist" },
  { key: "technical_requirements", label: "Technical Requirements", type: "text" },
  { key: "site_area", label: "Site Area", type: "string" },
  { key: "village", label: "Village", type: "string" },
  { key: "mandal", label: "Mandal", type: "string" },
  { key: "district", label: "District", type: "string" },
];

const MODULES: { key: ModuleKey; label: string; fields: ModuleField[] }[] = [
  {
    key: "organization", label: "Organization",
    fields: [
      { key: "name", label: "Organization Name", type: "string" },
      { key: "industry", label: "Industry", type: "string" },
      { key: "phone", label: "Phone", type: "phone" },
      { key: "email", label: "Email", type: "email" },
      { key: "address", label: "Address", type: "address" },
      { key: "city", label: "City", type: "string" },
      { key: "state", label: "State", type: "string" },
      { key: "country", label: "Country", type: "string" },
    ],
  },
  {
    key: "contact", label: "Contact",
    fields: [
      { key: "first_name", label: "First Name", type: "string" },
      { key: "last_name", label: "Last Name", type: "string" },
      { key: "email", label: "Email", type: "email" },
      { key: "phone", label: "Phone", type: "phone" },
      { key: "mobile", label: "Mobile", type: "phone" },
      { key: "designation", label: "Designation", type: "string" },
    ],
  },
  {
    key: "service_request", label: "Service Request",
    fields: [
      { key: "service_type", label: "Service Type", type: "picklist" },
      { key: "site_location", label: "Site Location", type: "string" },
      { key: "survey_type", label: "Survey Type", type: "picklist" },
      { key: "rwh_type", label: "Rainwater Harvesting Type", type: "picklist" },
      { key: "groundwater_service_type", label: "Groundwater Service Type", type: "picklist" },
      { key: "technical_requirements", label: "Technical Requirements", type: "text" },
      { key: "village", label: "Village", type: "string" },
      { key: "mandal", label: "Mandal", type: "string" },
      { key: "district", label: "District", type: "string" },
    ],
  },
  {
    key: "project", label: "Project",
    fields: [
      { key: "client_name", label: "Project Client Name", type: "string" },
      { key: "project_type", label: "Project Type", type: "picklist" },
      { key: "site_address", label: "Site Address", type: "address" },
      { key: "site_area", label: "Site Area", type: "string" },
      { key: "budget", label: "Project Budget", type: "currency" },
      { key: "description", label: "Description", type: "text" },
    ],
  },
  {
    key: "opportunity", label: "Opportunity",
    fields: [
      { key: "name", label: "Opportunity Name", type: "string" },
      { key: "amount", label: "Amount", type: "currency" },
      { key: "description", label: "Description", type: "text" },
    ],
  },
  {
    key: "customer", label: "Customer",
    fields: [
      { key: "name", label: "Customer Name", type: "string" },
      { key: "email", label: "Email", type: "email" },
      { key: "mobile", label: "Mobile", type: "phone" },
      { key: "address", label: "Address", type: "address" },
    ],
  },
  {
    key: "quotation", label: "Quotation",
    fields: [
      { key: "client_name", label: "Client Name", type: "string" },
      { key: "client_email", label: "Client Email", type: "email" },
      { key: "amount", label: "Amount", type: "currency" },
    ],
  },
];

/** Compatible types: numbers/currency interchangeable; strings accept most text-like values. */
const isCompatible = (a: FieldType, b: FieldType) => {
  if (a === b) return true;
  const groups: FieldType[][] = [
    ["string", "text", "address", "picklist"],
    ["email", "string"],
    ["phone", "string"],
    ["number", "currency"],
  ];
  return groups.some((g) => g.includes(a) && g.includes(b));
};

const defaultMappings = (): MappingRow[] => [
  { id: crypto.randomUUID(), leadKey: "company", targets: { organization: "name", project: "client_name", opportunity: "name" } },
  { id: crypto.randomUUID(), leadKey: "first_name", targets: { contact: "first_name" } },
  { id: crypto.randomUUID(), leadKey: "last_name", targets: { contact: "last_name" } },
  { id: crypto.randomUUID(), leadKey: "email", targets: { contact: "email", customer: "email", organization: "email" } },
  { id: crypto.randomUUID(), leadKey: "mobile", targets: { contact: "mobile", customer: "mobile" } },
  { id: crypto.randomUUID(), leadKey: "phone", targets: { contact: "phone", organization: "phone" } },
  { id: crypto.randomUUID(), leadKey: "address", targets: { project: "site_address", customer: "address", organization: "address" } },
  { id: crypto.randomUUID(), leadKey: "site_location", targets: { service_request: "site_location" } },
  { id: crypto.randomUUID(), leadKey: "service_type", targets: { service_request: "service_type" } },
];

/** Resolve a logical Lead field key against an actual crm_leads DB row, with aliases. */
const resolveLeadValue = (lead: any, key: string): any => {
  if (!lead) return undefined;
  if (lead[key] !== undefined && lead[key] !== null && lead[key] !== "") return lead[key];
  const fullName: string = lead.full_name || "";
  const [firstName, ...rest] = fullName.split(/\s+/);
  const lastName = rest.join(" ");
  const aliases: Record<string, any> = {
    company: lead.full_name,
    first_name: firstName,
    last_name: lastName,
    mobile: lead.whatsapp || lead.phone,
    address: lead.street,
    budget: lead.biz_cost,
    site_area: lead.biz_area,
    service_type: lead.service_needed,
    site_location: [lead.city, lead.state].filter(Boolean).join(", "),
    project_type: lead.service_needed,
    village: lead.city,
    district: lead.city,
  };
  return aliases[key];
};

export default function CrmLeadConversionMapping() {
  const { workspace, myRole } = useOutletContext<Ctx>();
  const canEdit = myRole === "crm_admin" || myRole === "super_admin";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState<MappingRow[]>([]);
  const [original, setOriginal] = useState<MappingRow[]>([]);
  const [search, setSearch] = useState("");
  const [history, setHistory] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string>("");
  const [previewOpen, setPreviewOpen] = useState(false);

  const loadLeads = async () => {
    const { data } = await supabase
      .from("crm_leads")
      .select("*")
      .eq("workspace_id", workspace.id)
      .order("created_at", { ascending: false })
      .limit(50);
    setLeads(data || []);
    if (data && data.length && !selectedLeadId) setSelectedLeadId(data[0].id);
  };

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("crm_lead_conversion_mappings")
      .select("mappings")
      .eq("workspace_id", workspace.id)
      .maybeSingle();
    const initial = (data?.mappings as MappingRow[] | null) ?? defaultMappings();
    // Normalize: ensure ids exist
    const normalized = initial.map((r) => ({ ...r, id: r.id || crypto.randomUUID(), targets: r.targets || {} }));
    setRows(normalized);
    setOriginal(JSON.parse(JSON.stringify(normalized)));
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [workspace.id]);

  const loadHistory = async () => {
    const { data } = await supabase
      .from("crm_lead_conversion_mapping_history")
      .select("id,version,changed_by,changed_at,mappings")
      .eq("workspace_id", workspace.id)
      .order("changed_at", { ascending: false })
      .limit(20);
    setHistory(data || []);
  };

  const leadFieldByKey = useMemo(() => {
    const m = new Map<string, LeadField>();
    LEAD_FIELDS.forEach((f) => m.set(f.key, f));
    return m;
  }, []);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const lf = leadFieldByKey.get(r.leadKey);
      return lf?.label.toLowerCase().includes(q) || r.leadKey.toLowerCase().includes(q);
    });
  }, [rows, search, leadFieldByKey]);

  // Warning detection: duplicate destination (same module+field used by 2+ leads)
  const warnings = useMemo(() => {
    const seen = new Map<string, string[]>();
    rows.forEach((r) => {
      MODULES.forEach((m) => {
        const t = r.targets[m.key];
        if (t && t !== "none") {
          const k = `${m.key}.${t}`;
          if (!seen.has(k)) seen.set(k, []);
          seen.get(k)!.push(r.leadKey);
        }
      });
    });
    const dups = new Set<string>();
    seen.forEach((v, k) => { if (v.length > 1) dups.add(k); });
    return dups;
  }, [rows]);

  const dirty = JSON.stringify(rows) !== JSON.stringify(original);

  const addRow = () => {
    setRows((r) => [...r, { id: crypto.randomUUID(), leadKey: LEAD_FIELDS[0].key, targets: {} }]);
  };

  const updateRow = (id: string, patch: Partial<MappingRow>) => {
    setRows((r) => r.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const updateTarget = (id: string, mod: ModuleKey, value: string) => {
    setRows((r) =>
      r.map((row) =>
        row.id === id ? { ...row, targets: { ...row.targets, [mod]: value === "none" ? "" : value } } : row,
      ),
    );
  };

  const removeRow = (id: string) => {
    setRows((r) => r.filter((row) => row.id !== id));
  };

  const save = async () => {
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    const payload = rows.map((r) => ({ id: r.id, leadKey: r.leadKey, targets: r.targets }));

    const { error } = await supabase
      .from("crm_lead_conversion_mappings")
      .upsert(
        {
          workspace_id: workspace.id,
          mappings: payload,
          updated_by: session?.user.id,
        },
        { onConflict: "workspace_id" },
      );

    if (!error) {
      await supabase.from("crm_lead_conversion_mapping_history").insert({
        workspace_id: workspace.id,
        version: Date.now(),
        mappings: payload,
        changed_by: session?.user.id,
      });
    }

    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Mapping saved" });
      setOriginal(JSON.parse(JSON.stringify(rows)));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-4 p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs text-muted-foreground">
              Settings › Marketing &amp; Sales
            </div>
            <h1 className="text-xl font-semibold tracking-tight">Lead Conversion Data Mapping</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Define how Lead fields flow into Organization, Contact, Service Request, Project, Opportunity, Customer and Quotation on conversion.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search fields…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 pl-7 w-48"
              />
            </div>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1" onClick={loadHistory}>
                  <History className="h-3.5 w-3.5" /> History
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[420px] sm:max-w-md">
                <SheetHeader><SheetTitle>Mapping history</SheetTitle></SheetHeader>
                <div className="mt-4 space-y-2 max-h-[calc(100vh-120px)] overflow-y-auto pr-1">
                  {history.length === 0 && (
                    <div className="text-xs text-muted-foreground py-6 text-center">No saved versions yet.</div>
                  )}
                  {history.map((h) => (
                    <Card key={h.id} className="p-3 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">v{h.version}</span>
                        <span className="text-muted-foreground">{new Date(h.changed_at).toLocaleString()}</span>
                      </div>
                      <div className="text-muted-foreground">
                        {(h.mappings as any[])?.length || 0} mappings · by {h.changed_by ? h.changed_by.slice(0, 8) : "system"}
                      </div>
                    </Card>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {warnings.size > 0 && (
          <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-900 dark:text-amber-100">
            <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>
              {warnings.size} destination field{warnings.size > 1 ? "s are" : " is"} mapped by more than one Lead field.
              The last conversion will overwrite earlier ones.
            </span>
          </div>
        )}

        {/* Grid */}
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[1100px]">
              <thead className="bg-muted/40 border-b">
                <tr className="text-left">
                  <th className="px-3 py-2 w-12">Actions</th>
                  <th className="px-3 py-2 min-w-[180px]">Lead Field Label</th>
                  <th className="px-3 py-2 w-28">Field Type</th>
                  {MODULES.map((m) => (
                    <th key={m.key} className="px-3 py-2 min-w-[180px]">{m.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 && (
                  <tr><td colSpan={3 + MODULES.length} className="px-3 py-8 text-center text-xs text-muted-foreground">No mappings match your search.</td></tr>
                )}
                {filteredRows.map((row) => {
                  const lf = leadFieldByKey.get(row.leadKey);
                  return (
                    <tr key={row.id} className="border-b last:border-0 align-top hover:bg-muted/20">
                      <td className="px-3 py-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive"
                          disabled={!canEdit}
                          onClick={() => removeRow(row.id)}
                          aria-label="Remove mapping"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                      <td className="px-3 py-2">
                        <Select
                          value={row.leadKey}
                          onValueChange={(v) => updateRow(row.id, { leadKey: v })}
                          disabled={!canEdit}
                        >
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {LEAD_FIELDS.map((f) => (
                              <SelectItem key={f.key} value={f.key} className="text-xs">{f.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-3 py-2">
                        <Badge variant="outline" className="text-[10px] font-normal">{lf?.type || "—"}</Badge>
                      </td>
                      {MODULES.map((m) => {
                        const current = row.targets[m.key] || "";
                        const compatibleFields = m.fields.filter((f) => !lf || isCompatible(lf.type, f.type));
                        const incompat = current && !compatibleFields.find((f) => f.key === current);
                        const dupKey = current ? `${m.key}.${current}` : "";
                        const isDup = warnings.has(dupKey);
                        return (
                          <td key={m.key} className="px-3 py-2">
                            <div className="flex items-center gap-1">
                              <Select
                                value={current || "none"}
                                onValueChange={(v) => updateTarget(row.id, m.key, v)}
                                disabled={!canEdit}
                              >
                                <SelectTrigger className={`h-8 text-xs ${incompat ? "border-destructive/60" : ""}`}>
                                  <SelectValue placeholder="None" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none" className="text-xs text-muted-foreground">None</SelectItem>
                                  {compatibleFields.map((f) => (
                                    <SelectItem key={f.key} value={f.key} className="text-xs">{f.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {(incompat || isDup) && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-xs text-xs">
                                    {incompat ? "Incompatible field type." : "Another Lead field maps to this destination."}
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="border-t bg-muted/20 px-3 py-2 flex items-center justify-between">
            <Button variant="outline" size="sm" className="h-8 gap-1" disabled={!canEdit} onClick={addRow}>
              <Plus className="h-3.5 w-3.5" /> Add Mapping
            </Button>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Info className="h-3 w-3" />
              Only compatible field types are listed in each dropdown.
            </div>
          </div>
        </Card>

        {/* Footer */}
        <div className="sticky bottom-0 -mx-4 sm:-mx-6 bg-background/95 backdrop-blur border-t px-4 sm:px-6 py-3 flex items-center justify-center gap-3">
          <Button
            onClick={save}
            disabled={!canEdit || saving || !dirty}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 min-w-[120px]"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save
          </Button>
          <Button
            variant="link"
            className="text-destructive gap-1"
            disabled={!dirty || saving}
            onClick={() => setRows(JSON.parse(JSON.stringify(original)))}
          >
            <X className="h-3.5 w-3.5" /> Cancel
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
}

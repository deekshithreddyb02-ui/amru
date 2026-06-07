import { useEffect, useState } from "react";
import { Link, useNavigate, useOutletContext, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Loader2, IdCard, MapPin, ChevronLeft, ChevronRight, ChevronDown,
  Mail, Calendar, FileText, Inbox, Megaphone, Briefcase, Box, MessageSquare,
  Pencil, Check, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import ConvertLeadDialog from "@/components/crm/ConvertLeadDialog";
import type { CrmWorkspace } from "@/hooks/useCrmWorkspaces";

type Ctx = { workspace: CrmWorkspace; myRole: string };

const fmtMoney = (n: any) =>
  n == null || n === "" ? "" : `₹ ${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (s: any) => (s ? new Date(s).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" }) : "");

type EditOpt = {
  field?: string;                 // db column to update on crm_leads
  type?: "text" | "number" | "date" | "textarea" | "select" | "boolean";
  options?: { label: string; value: string }[];
  raw?: any;                      // raw value to seed the editor (defaults to display value)
  onSave?: (next: any) => Promise<void> | void; // custom saver
};
type Row = [string, any, EditOpt?];

function EditableCell({
  label, display, opt, leadId, onUpdated,
}: {
  label: string;
  display: any;
  opt?: EditOpt;
  leadId: string;
  onUpdated: (patch: Record<string, any>) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState<any>(opt?.raw ?? (typeof display === "string" || typeof display === "number" ? display : ""));
  const [saving, setSaving] = useState(false);

  const editable = !!(opt && (opt.field || opt.onSave));
  const type = opt?.type || "text";

  const begin = () => {
    setVal(opt?.raw ?? (typeof display === "string" || typeof display === "number" ? display : ""));
    setEditing(true);
  };

  const cancel = () => setEditing(false);

  const save = async () => {
    if (!opt) return;
    setSaving(true);
    try {
      let next: any = val;
      if (type === "number") next = val === "" || val == null ? null : Number(val);
      if (type === "boolean") next = !!val;
      if (typeof next === "string" && next.trim() === "") next = null;

      if (opt.onSave) {
        await opt.onSave(next);
      } else if (opt.field) {
        const { error } = await supabase.from("crm_leads").update({ [opt.field]: next }).eq("id", leadId);
        if (error) throw error;
        onUpdated({ [opt.field]: next });
      }
      setEditing(false);
      toast({ title: "Saved", description: `${label} updated.` });
    } catch (e: any) {
      toast({ title: "Update failed", description: e?.message || String(e), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (editing && editable) {
    return (
      <div className="flex items-center gap-1.5">
        {type === "textarea" ? (
          <Textarea value={val ?? ""} onChange={(e) => setVal(e.target.value)} className="h-20 text-[12.5px]" autoFocus />
        ) : type === "select" ? (
          <Select value={String(val ?? "")} onValueChange={(v) => setVal(v)}>
            <SelectTrigger className="h-7 text-[12.5px] flex-1"><SelectValue placeholder="Select…" /></SelectTrigger>
            <SelectContent>
              {opt!.options?.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        ) : type === "boolean" ? (
          <Select value={val ? "yes" : "no"} onValueChange={(v) => setVal(v === "yes")}>
            <SelectTrigger className="h-7 text-[12.5px] flex-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="no">No</SelectItem>
              <SelectItem value="yes">Yes</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <Input
            type={type === "date" ? "date" : type === "number" ? "number" : "text"}
            value={val ?? ""}
            onChange={(e) => setVal(e.target.value)}
            className="h-7 text-[12.5px]"
            autoFocus
            onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") cancel(); }}
          />
        )}
        <button onClick={save} disabled={saving}
          className="h-6 w-6 inline-flex items-center justify-center rounded text-green-600 hover:bg-muted disabled:opacity-50">
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
        </button>
        <button onClick={cancel} disabled={saving}
          className="h-6 w-6 inline-flex items-center justify-center rounded text-muted-foreground hover:bg-muted">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="group flex items-start gap-1.5">
      <div className="text-foreground break-words whitespace-pre-wrap min-h-[1em] flex-1">
        {display == null || display === "" ? "" : (typeof display === "object" ? display : String(display))}
      </div>
      {editable && (
        <button
          onClick={begin}
          aria-label={`Edit ${label}`}
          className="opacity-0 group-hover:opacity-100 transition-opacity h-5 w-5 inline-flex items-center justify-center text-muted-foreground hover:text-primary shrink-0"
          type="button"
        >
          <Pencil className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

function FieldGrid({ rows, leadId, onUpdated }: { rows: Row[]; leadId: string; onUpdated: (patch: Record<string, any>) => void; }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2">
      {rows.map(([k, v, opt], i) => (
        <div key={i} className="grid grid-cols-[110px_minmax(0,1fr)] sm:grid-cols-[160px_minmax(0,1fr)] md:grid-cols-[180px_minmax(0,1fr)] gap-3 px-3 sm:px-4 py-2.5 text-[12.5px] border-b min-w-0">
          <div className="text-muted-foreground break-words">{k}</div>
          <div className="min-w-0 break-words">
            <EditableCell label={k} display={v} opt={opt} leadId={leadId} onUpdated={onUpdated} />
          </div>
        </div>
      ))}
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 border-y bg-muted/40">
      <ChevronDown className="h-3.5 w-3.5 text-primary" />
      <span className="text-[13px] font-semibold text-primary">{title}</span>
    </div>
  );
}

export default function CrmLeadDetail() {
  const { workspace } = useOutletContext<Ctx>();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [lead, setLead] = useState<any | null>(null);
  const [assigneeName, setAssigneeName] = useState<string>("");
  const [siblings, setSiblings] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [convertOpen, setConvertOpen] = useState(false);
  const [tab, setTab] = useState<"summary" | "details" | "updates">("details");

  const load = async () => {
    if (!id) return;
    setLoading(true);
    const { data: l } = await supabase.from("crm_leads").select("*").eq("id", id).maybeSingle();
    setLead(l);
    if (l?.assigned_to) {
      const { data: p } = await supabase
        .from("profiles").select("full_name,username").eq("user_id", l.assigned_to).maybeSingle();
      setAssigneeName(p?.full_name || p?.username || "");
    } else setAssigneeName("");

    const { data: sibs } = await supabase
      .from("crm_leads").select("id")
      .eq("workspace_id", workspace.id)
      .order("created_at", { ascending: false })
      .limit(200);
    setSiblings((sibs || []).map((s: any) => s.id));
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  const applyPatch = (patch: Record<string, any>) =>
    setLead((prev: any) => (prev ? { ...prev, ...patch } : prev));

  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;
  if (!lead) return <div className="p-12 text-center text-sm text-muted-foreground">Lead not found.</div>;

  const idx = siblings.indexOf(lead.id);
  const prevId = idx > 0 ? siblings[idx - 1] : null;
  const nextId = idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : null;
  const goto = (target: string | null) => target && navigate(`/crm/${workspace.slug}/leads/${target}`);

  const firstName = (lead.full_name || "").split(/\s+/)[0] || "";
  const lastName = (lead.full_name || "").split(/\s+/).slice(1).join(" ");

  const saveName = async (which: "first" | "last", next: string) => {
    const newFull =
      which === "first"
        ? [next, lastName].filter(Boolean).join(" ").trim()
        : [firstName, next].filter(Boolean).join(" ").trim();
    const { error } = await supabase.from("crm_leads").update({ full_name: newFull }).eq("id", lead.id);
    if (error) throw error;
    applyPatch({ full_name: newFull });
  };

  const statusOpts = ["open", "contacted", "qualified", "unqualified", "won", "lost"].map((v) => ({ label: v, value: v }));
  const ratingOpts = ["hot", "warm", "cold"].map((v) => ({ label: v, value: v }));
  const sourceOpts = ["Website", "Referral", "Campaign", "Cold Call", "Other"].map((v) => ({ label: v, value: v }));

  const leadRows: Row[] = [
    ["BIZ Area", lead.biz_area, { field: "biz_area" }],
    ["Service Needed", lead.service_needed, { field: "service_needed" }],
    ["Lead Number", lead.lead_number || lead.id?.slice(0, 8).toUpperCase(), { field: "lead_number", raw: lead.lead_number || "" }],
    ["Source", lead.lead_source, { field: "lead_source", type: "select", options: sourceOpts }],
    ["First Name", firstName, { raw: firstName, onSave: (v) => saveName("first", String(v ?? "")) }],
    ["Last Name", lastName, { raw: lastName, onSave: (v) => saveName("last", String(v ?? "")) }],
    ["WhatsApp Num", lead.whatsapp, { field: "whatsapp" }],
    ["Primary Phone", lead.phone, { field: "phone" }],
    ["Mobile Phone", lead.mobile || lead.phone, { field: "mobile", raw: lead.mobile || "" }],
    ["Primary Email",
      lead.email && <a href={`mailto:${lead.email}`} className="text-primary hover:underline">{lead.email}</a>,
      { field: "email", raw: lead.email || "" }],
    ["Area Type", lead.area_type, { field: "area_type" }],
    ["Total Area", lead.total_area, { field: "total_area" }],
    ["Expected Close Date", lead.expected_close, { field: "expected_close", type: "date" }],
    ["Distance In KM", lead.distance_km, { field: "distance_km", type: "number" }],
    ["Shape", lead.shape, { field: "shape" }],
    ["Number of Scans", lead.num_scans, { field: "num_scans", type: "number" }],
    ["Total BIZ COST", fmtMoney(lead.biz_cost), { field: "biz_cost", type: "number", raw: lead.biz_cost ?? "" }],
    ["Company", lead.company, { field: "company" }],
    ["GSTIN", lead.gstin, { field: "gstin" }],
    ["Industry", lead.industry, { field: "industry" }],
    ["Designation", lead.designation, { field: "designation" }],
    ["Annual Revenue", fmtMoney(lead.annual_revenue), { field: "annual_revenue", type: "number", raw: lead.annual_revenue ?? "" }],
    ["Lead Source",
      lead.lead_source ? (
        <span className="inline-block bg-green-600 text-white text-[11px] font-semibold px-1.5 py-0.5 rounded">{lead.lead_source}</span>
      ) : "",
      { field: "lead_source", type: "select", options: sourceOpts, raw: lead.lead_source || "" }],
    ["Number of Employees", lead.num_employees, { field: "num_employees", type: "number" }],
    ["Modified Time", fmtDate(lead.updated_at)],
    ["Secondary Email", lead.secondary_email, { field: "secondary_email" }],
    ["Fax", lead.fax, { field: "fax" }],
    ["Website",
      lead.website && <a href={lead.website} target="_blank" rel="noreferrer" className="text-primary hover:underline">{lead.website}</a>,
      { field: "website", raw: lead.website || "" }],
    ["Email Opt Out",
      lead.email_opt_out ? "Yes" : <span className="text-primary">No</span>,
      { field: "email_opt_out", type: "boolean", raw: !!lead.email_opt_out }],
    ["Lead Status", lead.status, { field: "status", type: "select", options: statusOpts }],
    ["Created Time", fmtDate(lead.created_at)],
    ["Rating", lead.rating, { field: "rating", type: "select", options: ratingOpts }],
    ["Assigned To", assigneeName ? <span className="text-primary">{assigneeName}</span> : ""],
  ];

  const addrRows: Row[] = [
    ["Street", lead.street, { field: "street" }],
    ["PO Box", lead.po_box, { field: "po_box" }],
    ["Postal Code", lead.pincode || lead.postal_code, { field: "pincode", raw: lead.pincode || lead.postal_code || "" }],
    ["City", lead.city && <span className="text-primary">{lead.city}</span>, { field: "city", raw: lead.city || "" }],
    ["Country", lead.country, { field: "country" }],
    ["State", lead.state, { field: "state" }],
    ["Maps Location",
      lead.maps_location && (
        <a href={lead.maps_location} target="_blank" rel="noreferrer" className="text-primary hover:underline">{lead.maps_location}</a>
      ),
      { field: "maps_location", raw: lead.maps_location || "" }],
  ];

  const descRows: Row[] = [
    ["Description", lead.notes || lead.description, { field: "notes", type: "textarea", raw: lead.notes || lead.description || "" }],
  ];

  const mapsLink = lead.maps_location || (lead.latitude && lead.longitude
    ? `https://www.google.com/maps?q=${lead.latitude},${lead.longitude}` : null);

  return (
    <div className="space-y-3 max-w-full overflow-x-hidden">
      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center gap-1.5 text-[12px] text-muted-foreground">
        <Link to={`/crm/${workspace.slug}/leads`} className="text-orange-600 font-semibold uppercase tracking-wide">Leads</Link>
        <ChevronRight className="h-3 w-3" />
        <Link to={`/crm/${workspace.slug}/leads`} className="hover:text-foreground">All</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground truncate max-w-[140px] sm:max-w-none">{lead.full_name}</span>
        <div className="w-full sm:w-auto sm:ml-auto flex items-center gap-1.5 flex-wrap">
          <Button size="sm" variant="outline" className="h-7 text-[12px]" onClick={() => navigate(`/crm/${workspace.slug}/leads`)}>+ Add Lead</Button>
          <Button size="sm" variant="outline" className="h-7 text-[12px]">Import</Button>
          <Button size="sm" variant="outline" className="h-7 text-[12px] hidden sm:inline-flex">⚙ Customize</Button>
        </div>
      </div>

      {/* Header card */}
      <div className="border rounded bg-card">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4 p-4">
          <div className="flex items-start gap-4 min-w-0 flex-1">
            <div className="h-14 w-14 sm:h-16 sm:w-16 rounded bg-orange-500 text-white flex items-center justify-center shrink-0">
              <IdCard className="h-7 w-7 sm:h-8 sm:w-8" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[16px] font-semibold break-words">{lead.full_name || "—"}</div>
              {lead.phone && (
                <a href={`tel:${lead.phone}`} className="text-[12px] text-primary hover:underline block break-all">{lead.phone}</a>
              )}
              {mapsLink && (
                <a href={mapsLink} target="_blank" rel="noreferrer" className="text-[12px] text-primary hover:underline inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> Show Map
                </a>
              )}
              <button className="mt-2 text-[11px] border rounded px-2 py-0.5 text-muted-foreground hover:bg-muted">+ Add Tag</button>
            </div>
          </div>
          <div className="flex flex-col items-stretch sm:items-end gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-1.5 flex-wrap sm:justify-end">
              <Button size="sm" variant="outline" className="h-7 text-[12px]">Follow</Button>
              <Button size="sm" variant="outline" className="h-7 text-[12px]">Edit</Button>
              {lead.email && (
                <Button asChild size="sm" variant="outline" className="h-7 text-[12px] gap-1">
                  <a href={`mailto:${lead.email}`}><Mail className="h-3 w-3" />Send Email</a>
                </Button>
              )}
              <Button
                size="sm" variant="outline" className="h-7 text-[12px]"
                disabled={lead.stage === "won" || lead.stage === "lost"}
                onClick={() => setConvertOpen(true)}
              >
                Convert Lead
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-[12px] gap-1">More <ChevronDown className="h-3 w-3" /></Button>
              <div className="inline-flex border rounded overflow-hidden">
                <button onClick={() => goto(prevId)} disabled={!prevId}
                  className="h-7 w-7 inline-flex items-center justify-center hover:bg-muted disabled:opacity-40">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button onClick={() => goto(nextId)} disabled={!nextId}
                  className="h-7 w-7 inline-flex items-center justify-center border-l hover:bg-muted disabled:opacity-40">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-t flex items-center gap-1 px-3 overflow-x-auto">
          {(["summary", "details", "updates"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-2 text-[12.5px] capitalize border-b-2 -mb-px shrink-0 ${
                tab === t ? "border-primary text-foreground font-medium" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
          <div className="ml-2 flex items-center gap-1 text-muted-foreground shrink-0">
            {[Calendar, Mail, FileText, Inbox, Megaphone, Briefcase, Box, MessageSquare].map((Icon, i) => (
              <button key={i} className="h-8 w-8 inline-flex items-center justify-center hover:text-foreground shrink-0" type="button">
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Body */}
      {tab === "details" && (
        <div className="border rounded bg-card overflow-hidden">
          <SectionHeader title="Lead Details" />
          <FieldGrid rows={leadRows} leadId={lead.id} onUpdated={applyPatch} />
          <SectionHeader title="Address Details" />
          <FieldGrid rows={addrRows} leadId={lead.id} onUpdated={applyPatch} />
          <SectionHeader title="Description Details" />
          <FieldGrid rows={descRows} leadId={lead.id} onUpdated={applyPatch} />
        </div>
      )}
      {tab === "summary" && (
        <div className="border rounded bg-card p-4 text-[13px] text-muted-foreground">
          Stage: <span className="text-foreground capitalize">{lead.stage}</span> · Service: <span className="text-foreground">{lead.service_needed || "—"}</span>
        </div>
      )}
      {tab === "updates" && (
        <div className="border rounded bg-card p-6 text-center text-[13px] text-muted-foreground">Activity stream coming soon.</div>
      )}

      <ConvertLeadDialog
        workspaceId={workspace.id}
        lead={lead}
        open={convertOpen}
        onOpenChange={setConvertOpen}
        onDone={() => { setConvertOpen(false); load(); }}
      />
    </div>
  );
}

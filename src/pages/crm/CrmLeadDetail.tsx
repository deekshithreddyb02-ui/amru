import { useEffect, useState } from "react";
import { Link, useNavigate, useOutletContext, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Loader2, IdCard, MapPin, ChevronLeft, ChevronRight, ChevronDown,
  Mail, Calendar, FileText, Inbox, Megaphone, Briefcase, Box, MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ConvertLeadDialog from "@/components/crm/ConvertLeadDialog";
import type { CrmWorkspace } from "@/hooks/useCrmWorkspaces";

type Ctx = { workspace: CrmWorkspace; myRole: string };

const fmtMoney = (n: any) =>
  n == null || n === "" ? "" : `₹ ${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (s: any) => (s ? new Date(s).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" }) : "");

type Row = [string, any];

function FieldGrid({ rows }: { rows: Row[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2">
      {rows.map(([k, v], i) => (
        <div key={i} className="grid grid-cols-[180px_1fr] gap-3 px-4 py-2.5 text-[12.5px] border-b">
          <div className="text-muted-foreground">{k}</div>
          <div className="text-foreground break-words whitespace-pre-wrap min-h-[1em]">
            {v == null || v === "" ? "" : (typeof v === "object" ? v : String(v))}
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

  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;
  if (!lead) return <div className="p-12 text-center text-sm text-muted-foreground">Lead not found.</div>;

  const idx = siblings.indexOf(lead.id);
  const prevId = idx > 0 ? siblings[idx - 1] : null;
  const nextId = idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : null;
  const goto = (target: string | null) => target && navigate(`/crm/${workspace.slug}/leads/${target}`);

  const firstName = (lead.full_name || "").split(/\s+/)[0] || "";
  const lastName = (lead.full_name || "").split(/\s+/).slice(1).join(" ");

  const leadRows: Row[] = [
    ["BIZ Area", lead.biz_area],
    ["Service Needed", lead.service_needed],
    ["Lead Number", lead.lead_number || lead.id?.slice(0, 8).toUpperCase()],
    ["Source", lead.lead_source],
    ["First Name", firstName],
    ["Last Name", lastName],
    ["WhatsApp Num", lead.whatsapp],
    ["Primary Phone", lead.phone],
    ["Mobile Phone", lead.mobile || lead.phone],
    ["Primary Email", lead.email && <a href={`mailto:${lead.email}`} className="text-primary hover:underline">{lead.email}</a>],
    ["Area Type", lead.area_type],
    ["Total Area", lead.total_area],
    ["Expected Close Date", lead.expected_close],
    ["Distance In KM", lead.distance_km],
    ["Shape", lead.shape],
    ["Number of Scans", lead.num_scans],
    ["Total BIZ COST", fmtMoney(lead.biz_cost)],
    ["Company", lead.company],
    ["GSTIN", lead.gstin],
    ["Industry", lead.industry],
    ["Designation", lead.designation],
    ["Annual Revenue", fmtMoney(lead.annual_revenue)],
    ["Lead Source", lead.lead_source ? (
      <span className="inline-block bg-green-600 text-white text-[11px] font-semibold px-1.5 py-0.5 rounded">{lead.lead_source}</span>
    ) : ""],
    ["Number of Employees", lead.num_employees],
    ["Modified Time", fmtDate(lead.updated_at)],
    ["Secondary Email", lead.secondary_email],
    ["Fax", lead.fax],
    ["Website", lead.website && <a href={lead.website} target="_blank" rel="noreferrer" className="text-primary hover:underline">{lead.website}</a>],
    ["Email Opt Out", lead.email_opt_out ? "Yes" : <span className="text-primary">No</span>],
    ["Lead Status", lead.status],
    ["Created Time", fmtDate(lead.created_at)],
    ["Rating", lead.rating],
    ["Assigned To", assigneeName ? <span className="text-primary">{assigneeName}</span> : ""],
  ];

  const addrRows: Row[] = [
    ["Street", lead.street],
    ["PO Box", lead.po_box],
    ["Postal Code", lead.pincode || lead.postal_code],
    ["City", lead.city && <span className="text-primary">{lead.city}</span>],
    ["Country", lead.country],
    ["State", lead.state],
    ["Maps Location", lead.maps_location && (
      <a href={lead.maps_location} target="_blank" rel="noreferrer" className="text-primary hover:underline">{lead.maps_location}</a>
    )],
  ];

  const mapsLink = lead.maps_location || (lead.latitude && lead.longitude
    ? `https://www.google.com/maps?q=${lead.latitude},${lead.longitude}` : null);

  return (
    <div className="space-y-3">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
        <Link to={`/crm/${workspace.slug}/leads`} className="text-orange-600 font-semibold uppercase tracking-wide">Leads</Link>
        <ChevronRight className="h-3 w-3" />
        <Link to={`/crm/${workspace.slug}/leads`} className="hover:text-foreground">All</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">{lead.full_name}</span>
        <div className="ml-auto flex items-center gap-1.5">
          <Button size="sm" variant="outline" className="h-7 text-[12px]" onClick={() => navigate(`/crm/${workspace.slug}/leads`)}>+ Add Lead</Button>
          <Button size="sm" variant="outline" className="h-7 text-[12px]">Import</Button>
          <Button size="sm" variant="outline" className="h-7 text-[12px]">⚙ Customize</Button>
        </div>
      </div>

      {/* Header card */}
      <div className="border rounded bg-card">
        <div className="flex items-start gap-4 p-4">
          <div className="h-16 w-16 rounded bg-orange-500 text-white flex items-center justify-center shrink-0">
            <IdCard className="h-8 w-8" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[16px] font-semibold">{lead.full_name || "—"}</div>
            {lead.phone && (
              <a href={`tel:${lead.phone}`} className="text-[12px] text-primary hover:underline block">{lead.phone}</a>
            )}
            {mapsLink && (
              <a href={mapsLink} target="_blank" rel="noreferrer" className="text-[12px] text-primary hover:underline inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" /> Show Map
              </a>
            )}
            <button className="mt-2 text-[11px] border rounded px-2 py-0.5 text-muted-foreground hover:bg-muted">+ Add Tag</button>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-1.5 flex-wrap justify-end">
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
              className={`px-3 py-2 text-[12.5px] capitalize border-b-2 -mb-px ${
                tab === t ? "border-primary text-foreground font-medium" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
          <div className="ml-2 flex items-center gap-1 text-muted-foreground">
            {[Calendar, Mail, FileText, Inbox, Megaphone, Briefcase, Box, MessageSquare].map((Icon, i) => (
              <button key={i} className="h-8 w-8 inline-flex items-center justify-center hover:text-foreground" type="button">
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
          <FieldGrid rows={leadRows} />
          <SectionHeader title="Address Details" />
          <FieldGrid rows={addrRows} />
          <SectionHeader title="Description Details" />
          <FieldGrid rows={[["Description", lead.notes || lead.description]]} />
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

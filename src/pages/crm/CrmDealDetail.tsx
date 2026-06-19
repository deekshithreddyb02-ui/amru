import { useEffect, useState, ReactNode } from "react";
import { useOutletContext, useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  ChevronLeft, ChevronRight, Loader2, Wallet, ChevronDown, Plus, Tag,
  FileText, Activity as ActivityIcon, Calendar, User, Building2,
  MessageSquare, Mail, Paperclip,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CrmWorkspace } from "@/hooks/useCrmWorkspaces";
import { useCrmLabels } from "@/hooks/useCrmLabels";
import EditableLabel from "@/components/crm/EditableLabel";
import EditableValue, { type EditableValueConfig } from "@/components/crm/EditableValue";
import { useCrmPermissions } from "@/hooks/useCrmPermissions";



type Ctx = { workspace: CrmWorkspace; myRole: string };

const STAGE_LABEL: Record<string, string> = {
  new: "Prospecting", qualified: "Qualified", proposal: "Proposal",
  negotiation: "Negotiation", won: "Won", lost: "Lost",
};
const STAGE_TONE: Record<string, string> = {
  new: "bg-amber-400 text-amber-950",
  qualified: "bg-blue-400 text-blue-950",
  proposal: "bg-indigo-400 text-indigo-950",
  negotiation: "bg-yellow-400 text-yellow-950",
  won: "bg-green-500 text-white",
  lost: "bg-red-500 text-white",
};

const fmtMoney = (n: any) =>
  n == null || n === "" ? "—" : `₹ ${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (d: any) => (d ? new Date(d).toLocaleDateString("en-IN").replace(/\//g, "-") : "");
const fmtDateTime = (d: any) =>
  d ? new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true }).replace(/\//g, "-") : "";

const TABS = [
  { id: "summary", label: "Summary", icon: FileText },
  { id: "details", label: "Details", icon: FileText },
  { id: "updates", label: "Updates", icon: ActivityIcon },
  { id: "events", label: "Events", icon: Calendar },
  { id: "contacts", label: "Contacts", icon: User },
  { id: "products", label: "Products", icon: Building2 },
  { id: "documents", label: "Documents", icon: Paperclip },
  { id: "quotes", label: "Quotes", icon: FileText },
  { id: "salesorders", label: "Sales Orders", icon: FileText },
  { id: "campaigns", label: "Campaigns", icon: Tag },
  { id: "comments", label: "Comments", icon: MessageSquare },
  { id: "invoices", label: "Invoices", icon: FileText },
  { id: "emails", label: "Emails", icon: Mail },
];


export default function CrmDealDetail() {
  const { workspace } = useOutletContext<Ctx>();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isSuperAdmin, myRole } = useCrmPermissions(workspace?.id);
  const canEditValues = isSuperAdmin || myRole === "crm_admin";
  const tabLabels = useCrmLabels(workspace?.id, "deals_detail_tabs");
  const fieldLabels = useCrmLabels(workspace?.id, "deals_detail_fields");
  const sectionLabels = useCrmLabels(workspace?.id, "deals_detail_sections");
  const [tab, setTab] = useState("details");
  const [reloadKey, setReloadKey] = useState(0);
  const reload = () => setReloadKey((k) => k + 1);

  const [deal, setDeal] = useState<any>(null);

  const [lead, setLead] = useState<any>(null);
  const [org, setOrg] = useState<any>(null);
  const [contact, setContact] = useState<any>(null);
  const [owner, setOwner] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [list, setList] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || !workspace?.id) return;
    (async () => {
      setLoading(true);
      const { data: d } = await supabase.from("crm_deals").select("*").eq("id", id).maybeSingle();
      setDeal(d);
      const [l, o, c, p, a, ids] = await Promise.all([
        d?.lead_id ? supabase.from("crm_leads").select("*").eq("id", d.lead_id).maybeSingle() : Promise.resolve({ data: null }),
        d?.organization_id ? supabase.from("crm_organizations").select("*").eq("id", d.organization_id).maybeSingle() : Promise.resolve({ data: null }),
        d?.contact_id ? supabase.from("crm_contacts").select("*").eq("id", d.contact_id).maybeSingle() : Promise.resolve({ data: null }),
        d?.owner_id ? supabase.from("profiles").select("full_name,username").eq("user_id", d.owner_id).maybeSingle() : Promise.resolve({ data: null }),
        supabase.from("crm_activities").select("id,activity_type,subject,description,status,created_at").eq("deal_id", id).order("created_at", { ascending: false }).limit(50),
        supabase.from("crm_deals").select("id,created_at").eq("workspace_id", workspace.id).order("created_at", { ascending: false }),
      ]);
      setLead((l as any).data); setOrg((o as any).data); setContact((c as any).data);
      setOwner((p as any).data); setActivities(((a as any).data) || []);
      setList((((ids as any).data) || []).map((r: any) => r.id));
      setLoading(false);
    })();
  }, [id, workspace?.id, reloadKey]);

  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;
  if (!deal) return <div className="p-12 text-center text-sm text-muted-foreground">Opportunity not found.</div>;

  const stageKey = deal.stage || "new";
  const ownerName = owner?.full_name || owner?.username || "";
  const contactName = contact?.full_name || lead?.full_name || "";
  const idx = list.indexOf(id!);
  const prevId = idx > 0 ? list[idx - 1] : null;
  const nextId = idx >= 0 && idx < list.length - 1 ? list[idx + 1] : null;
  const goto = (nid: string | null) => nid && navigate(`/crm/${workspace.slug}/deals/${nid}`);

  const oppNumber = `OPT${(deal.position || 0).toString().padStart(3, "0") || "—"}`;

  const D = (column: string, type: EditableValueConfig["type"] = "text", options?: any[]): EditableValueConfig => ({
    table: "crm_deals", id: deal.id, column, type, current: deal[column], options,
  });
  const L = (column: string, type: EditableValueConfig["type"] = "text"): EditableValueConfig | undefined =>
    lead ? { table: "crm_leads", id: lead.id, column, type, current: lead[column] } : undefined;
  const O = (column: string, type: EditableValueConfig["type"] = "text"): EditableValueConfig | undefined =>
    org ? { table: "crm_organizations", id: org.id, column, type, current: org[column] } : undefined;

  const stageOptions = Object.entries(STAGE_LABEL).map(([value, label]) => ({ value, label }));

  const oppDetails: [string, ReactNode, EditableValueConfig?][] = [
    ["Opportunity Name", deal.title, D("title")],
    ["Opportunity Number", oppNumber],
    ["Organization Name", org?.name ? <Link to={`/crm/${workspace.slug}/organizations/${org.id}`} className="text-primary hover:underline">{org.name}</Link> : "", O("name")],
    ["Contact Name", contact?.id ? <Link to={`/crm/${workspace.slug}/contacts/${contact.id}`} className="text-primary hover:underline">{contactName}</Link> : contactName],
    ["Amount", fmtMoney(deal.amount), D("amount", "number")],
    ["Type", "New Business"],
    ["Expected Close Date", fmtDate(deal.expected_close), D("expected_close", "date")],
    ["Lead Source", lead?.lead_source || "", L("lead_source")],
    ["Next Step", ""],
    ["Assigned To", ownerName ? <span className="text-primary">{ownerName}</span> : ""],
    ["Sales Stage", <span className={`inline-block px-1.5 py-0.5 text-[11px] font-semibold rounded ${STAGE_TONE[stageKey] || "bg-muted"}`}>{STAGE_LABEL[stageKey] || stageKey}</span>, D("stage", "select", stageOptions)],
    ["Campaign Source", ""],
    ["Probability", deal.probability != null ? Number(deal.probability).toFixed(2) : "", D("probability", "number")],
    ["Modified Time", fmtDateTime(deal.updated_at)],
    ["Created Time", fmtDateTime(deal.created_at)],
    ["Weighted Revenue", fmtMoney(deal.amount && deal.probability != null ? (Number(deal.amount) * Number(deal.probability)) / 100 : 0)],
    ["Is Converted From Lead", deal.lead_id ? "Yes" : "No"],
    ["Source", "CRM"],
    ["BIZ Area", lead?.biz_area || "", L("biz_area")],
    ["Service Needed", lead?.service_needed || "", L("service_needed")],
    ["Distance in KM", lead?.distance_km || "", L("distance_km", "number")],
    ["Area Type", lead?.area_type || "", L("area_type")],
    ["Total Area", lead ? `Gunta: ${lead.gunta || ""}\nAcres: ${lead.acres || ""}\nSq.Yrds: ${lead.sq_yards || ""}\nSq.Ft: ${lead.sq_ft || ""}` : ""],
    ["Shape", lead?.shape || "", L("shape")],
    ["Number of Scans", lead?.num_scans ?? "", L("num_scans", "number")],
    ["Total BIZ COST", fmtMoney(lead?.biz_cost ?? deal.amount), L("biz_cost", "number")],
    ["Maps Location", lead?.maps_location || "", L("maps_location")],
    [" ", ""],
  ];

  const address: [string, ReactNode, EditableValueConfig?][] = [
    ["Street", lead?.street || org?.street || "", L("street") || O("street")],
    ["PO Box", lead?.po_box || "", L("po_box")],
    ["Postal Code", lead?.postal_code || org?.postal_code || "", L("postal_code") || O("postal_code")],
    ["City", (lead?.city || org?.city) ? <span className="text-primary">{lead?.city || org?.city}</span> : "", L("city") || O("city")],
    ["Country", (lead?.country || org?.country) ? <span className="text-primary">{lead?.country || org?.country || "INDIA"}</span> : "INDIA", L("country") || O("country")],
    ["State", (lead?.state || org?.state) ? <span className="text-primary">{lead?.state || org?.state}</span> : "", L("state") || O("state")],
    ["Maps URL", lead?.maps_url || "", L("maps_url")],
  ];

  const description: [string, ReactNode, EditableValueConfig?][] = [
    ["Description", deal.description || lead?.notes || "", D("description", "textarea")],
  ];


  return (
    <div className="bg-muted/30 -m-4 md:-m-6 min-h-[calc(100vh-4rem)]">
      {/* Top breadcrumb */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b text-[12px]">
        <div className="flex items-center gap-1.5">
          <Link to={`/crm/${workspace.slug}/deals`} className="text-primary font-semibold uppercase tracking-wide">Opportunities</Link>
          <span className="text-muted-foreground">›</span>
          <span className="text-muted-foreground">All</span>
          <span className="text-muted-foreground">›</span>
          <span className="text-foreground truncate max-w-[260px]">{deal.title}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Button size="sm" variant="outline" className="h-7 text-[12px] gap-1"><Plus className="h-3 w-3" />Add Opportunity</Button>
          <Button size="sm" variant="outline" className="h-7 text-[12px]">Import</Button>
          <Button size="sm" variant="outline" className="h-7 text-[12px]">Customize <ChevronDown className="h-3 w-3 ml-1" /></Button>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white px-4 py-3 border-b flex items-start gap-3">
        <div className="h-14 w-14 rounded bg-green-600 text-white flex items-center justify-center shrink-0">
          <Wallet className="h-7 w-7" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-semibold">{deal.title}</div>
          <div className="text-[12px] text-muted-foreground">{org?.name || ""}</div>
          <div className="text-[12px]">{fmtMoney(deal.amount)}</div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${STAGE_TONE[stageKey] || "bg-muted"}`}>
              {STAGE_LABEL[stageKey] || stageKey}
            </span>
            <button className="text-[11px] bg-muted-foreground/80 text-white px-1.5 py-0.5 rounded inline-flex items-center gap-1">
              <Plus className="h-2.5 w-2.5" />Add Tag
            </button>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Button size="sm" variant="outline" className="h-7 text-[12px]">Follow</Button>
          <Button size="sm" variant="outline" className="h-7 text-[12px]">Edit</Button>
          <Button size="sm" variant="outline" className="h-7 text-[12px]">Send Email</Button>
          <Button size="sm" variant="outline" className="h-7 text-[12px]">Create Project</Button>
          <Button size="sm" variant="outline" className="h-7 text-[12px]">More <ChevronDown className="h-3 w-3 ml-1" /></Button>
          <div className="inline-flex border rounded overflow-hidden ml-1">
            <button onClick={() => goto(prevId)} disabled={!prevId} className="h-7 w-7 flex items-center justify-center hover:bg-muted disabled:opacity-40"><ChevronLeft className="h-3.5 w-3.5" /></button>
            <button onClick={() => goto(nextId)} disabled={!nextId} className="h-7 w-7 flex items-center justify-center border-l hover:bg-muted disabled:opacity-40"><ChevronRight className="h-3.5 w-3.5" /></button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b px-4 flex items-center gap-1 overflow-x-auto">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-3 py-2.5 text-[12.5px] inline-flex items-center gap-1.5 border-b-2 ${active ? "border-primary text-primary font-semibold" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              <Icon className="h-3.5 w-3.5" />
              <span>{tabLabels.labels[t.id]?.label || t.label}</span>

            </button>
          );
        })}
        <button className="px-3 py-2.5 text-[12.5px] inline-flex items-center gap-1 text-muted-foreground">More <ChevronDown className="h-3 w-3" /></button>
      </div>


      {/* Body */}
      <div className="p-4">
        {tab === "details" && (
          <div className="space-y-4">
            <Section sectionKey="opp_details" title="Opportunity Details" rows={oppDetails} fieldLabels={fieldLabels} sectionLabels={sectionLabels} canEditValues={canEditValues} onReload={reload} />
            <Section sectionKey="address_details" title="Address Details" rows={address} fieldLabels={fieldLabels} sectionLabels={sectionLabels} canEditValues={canEditValues} onReload={reload} />
            <Section sectionKey="description_details" title="Description Details" rows={description} fieldLabels={fieldLabels} sectionLabels={sectionLabels} canEditValues={canEditValues} onReload={reload} />
          </div>
        )}
        {tab === "summary" && (
          <SummaryView
            keyFields={[
              ["Opportunity Name", lead ? `GW: ${lead.full_name || ""}` : deal.title, D("title")],
              ["Contact Name", contact?.id ? <Link to={`/crm/${workspace.slug}/contacts/${contact.id}`} className="text-primary hover:underline">{contactName}</Link> : contactName],
              ["Expected Close Date", fmtDate(deal.expected_close), D("expected_close", "date")],
              ["Assigned To", ownerName ? <span className="text-primary">{ownerName}</span> : ""],
              ["BIZ Area", lead?.biz_area || "", L("biz_area")],
              ["Service Needed", lead?.service_needed || "", L("service_needed")],
              ["Distance in KM", lead?.distance_km || "", L("distance_km", "number")],
              ["Total Area", lead ? `Gunta: ${lead.gunta || ""}\nAcres: ${lead.acres || ""}\nSq.Yrds: ${lead.sq_yards || ""}\nSq.Ft: ${lead.sq_ft || ""}` : ""],
              ["Number of Scans", lead?.num_scans ?? "", L("num_scans", "number")],
              ["Total BIZ COST (₹)", fmtMoney(lead?.biz_cost ?? deal.amount), L("biz_cost", "number")],
              ["Maps Location", lead?.maps_location || "", L("maps_location")],
              ["Street", lead?.street || org?.street || "", L("street") || O("street")],
              ["City", (lead?.city || org?.city) ? <span className="text-primary">{lead?.city || org?.city}</span> : "", L("city") || O("city")],
              ["State", (lead?.state || org?.state) ? <span className="text-primary">{lead?.state || org?.state}</span> : "", L("state") || O("state")],
              ["Description", deal.description || lead?.notes || "", D("description", "textarea")],
            ]}
            activities={activities}
            contactName={contactName}
            canEditValues={canEditValues}
            onReload={reload}
            fieldLabels={fieldLabels}
            sectionLabels={sectionLabels}
          />
        )}

        {tab === "updates" && (
          <div className="bg-white border rounded">
            <div className="px-4 py-2 font-semibold text-[13px] border-b">Updates</div>
            {activities.length === 0 ? (
              <div className="p-6 text-center text-[12px] text-muted-foreground">No updates yet.</div>
            ) : (
              <ul className="divide-y">
                {activities.map((a) => (
                  <li key={a.id} className="px-4 py-2 text-[12.5px]">
                    <div className="font-medium">{a.subject || a.activity_type}</div>
                    <div className="text-muted-foreground text-[11.5px]">{fmtDateTime(a.created_at)} · {a.status || a.activity_type}</div>
                    {a.description && <div className="mt-1 text-muted-foreground whitespace-pre-wrap">{a.description}</div>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        {!["details", "summary", "updates"].includes(tab) && (
          <div className="bg-white border rounded p-10 text-center text-[12px] text-muted-foreground">Nothing here yet.</div>
        )}
      </div>
    </div>
  );
}

function Section({
  sectionKey, title, rows, fieldLabels, sectionLabels, canEditValues, onReload,
}: {
  sectionKey: string;
  title: string;
  rows: [string, ReactNode, EditableValueConfig?][];
  fieldLabels: ReturnType<typeof useCrmLabels>;
  sectionLabels: ReturnType<typeof useCrmLabels>;
  canEditValues: boolean;
  onReload: () => void;
}) {
  return (
    <div className="bg-white border rounded">
      <div className="flex items-center gap-1 px-3 py-2 border-b">
        <ChevronDown className="h-3.5 w-3.5 text-primary" />
        <h3 className="text-[13px] font-semibold text-primary">{title}</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2">
        {rows.map(([k, v, cfg], i) => {
          return (
            <div key={`${k}-${i}`} className="grid grid-cols-[180px_1fr] gap-3 px-4 py-2 text-[12.5px] border-b last:border-b-0 odd:md:border-r">
              <div className="text-muted-foreground">{k}</div>
              <div className="text-foreground whitespace-pre-wrap break-words">
                <EditableValue display={v} canEdit={canEditValues} config={cfg} onSaved={onReload} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SummaryView({
  keyFields, activities, contactName, canEditValues, onReload, fieldLabels, sectionLabels,
}: {
  keyFields: [string, ReactNode, EditableValueConfig?][];
  activities: any[];
  contactName: string;
  canEditValues: boolean;
  onReload: () => void;
  fieldLabels: ReturnType<typeof useCrmLabels>;
  sectionLabels: ReturnType<typeof useCrmLabels>;
}) {
  const Panel = ({ title, sectionKey, actions, children }: { title: string; sectionKey: string; actions?: ReactNode; children: ReactNode }) => (
    <div className="bg-white border rounded">
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <div className="flex items-center gap-1">
          <ChevronDown className="h-3.5 w-3.5 text-primary" />
          <h3 className="text-[13px] font-semibold text-primary">{title}</h3>
        </div>
        {actions}
      </div>
      {children}
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      <div className="lg:col-span-5 space-y-4">
        <Panel title="Key Fields" sectionKey="summary_key_fields">
          <div className="divide-y">
            {keyFields.map(([k, v, cfg], i) => {
              const fk = `summary_key_fields.${k}`;
              return (
                <div key={`${k}-${i}`} className="grid grid-cols-[140px_1fr] gap-3 px-4 py-2 text-[12.5px]">
                  <div className="text-muted-foreground">{k}</div>
                  <div className="text-foreground whitespace-pre-wrap break-words">
                    <EditableValue display={v} canEdit={canEditValues} config={cfg} onSaved={onReload} />
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
        <Panel
          title="Documents"
          sectionKey="summary_documents"
          actions={<Button size="sm" variant="outline" className="h-7 text-[12px] gap-1"><Plus className="h-3 w-3" />New Document</Button>}
        >
          <div className="p-4 text-center text-[12px] text-muted-foreground">No Related Documents</div>
        </Panel>
      </div>

      <div className="lg:col-span-4 space-y-4">
        <Panel
          title="Activities"
          sectionKey="summary_activities"
          actions={
            <div className="flex items-center gap-1">
              <Button size="sm" variant="outline" className="h-7 text-[12px] gap-1"><Plus className="h-3 w-3" />Add Task</Button>
              <Button size="sm" variant="outline" className="h-7 text-[12px] gap-1"><Plus className="h-3 w-3" />Add Event</Button>
            </div>
          }
        >
          {activities.length === 0 ? (
            <div className="p-6 text-center text-[12px] text-muted-foreground">No pending activities</div>
          ) : (
            <ul className="divide-y">
              {activities.slice(0, 5).map((a) => (
                <li key={a.id} className="px-4 py-2 text-[12.5px]">
                  <div className="font-medium">{a.subject || a.activity_type}</div>
                  <div className="text-muted-foreground text-[11.5px]">{fmtDateTime(a.created_at)}</div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <CommentsPanel dealId={deal.id} workspaceId={workspace.id} />

      </div>

      <div className="lg:col-span-3 space-y-4">
        <Panel
          title="Related Products"
          sectionKey="summary_related_products"
          actions={<Button size="sm" variant="outline" className="h-7 text-[12px] gap-1"><Plus className="h-3 w-3" />Add</Button>}
        >
          <div className="p-4 text-center text-[12px] text-muted-foreground">No Related Products</div>
        </Panel>
        <Panel
          title="Related Contacts"
          sectionKey="summary_related_contacts"
          actions={<Button size="sm" variant="outline" className="h-7 text-[12px] gap-1"><Plus className="h-3 w-3" />Add</Button>}
        >
          {contactName ? (
            <div className="px-4 py-2 text-[12.5px] text-primary">{contactName}</div>
          ) : (
            <div className="p-4 text-center text-[12px] text-muted-foreground">No Related Contacts</div>
          )}
        </Panel>
      </div>
    </div>
  );
}


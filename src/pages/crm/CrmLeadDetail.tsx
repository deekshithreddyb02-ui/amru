import { useEffect, useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Phone, ListChecks, FileText, MessageSquare, Activity, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import CrmRecordView, { type SummaryField, type RelatedTab } from "@/components/crm/vtiger/CrmRecordView";
import ConvertLeadDialog from "@/components/crm/ConvertLeadDialog";
import type { CrmWorkspace } from "@/hooks/useCrmWorkspaces";

type Ctx = { workspace: CrmWorkspace; myRole: string };

type Lead = any;

const stageTone: Record<string, "default" | "primary" | "success" | "warning" | "danger"> = {
  new: "primary",
  contacted: "default",
  qualified: "primary",
  won: "success",
  lost: "danger",
};

export default function CrmLeadDetail() {
  const { workspace } = useOutletContext<Ctx>();
  const { id } = useParams<{ id: string }>();
  const [lead, setLead] = useState<Lead | null>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [docs, setDocs] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [enquiry, setEnquiry] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [convertOpen, setConvertOpen] = useState(false);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    const { data: l } = await supabase
      .from("crm_leads")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    setLead(l);

    const act = await supabase
      .from("crm_activities")
      .select("id,subject,activity_type,status,due_at,description,created_at,created_by")
      .eq("lead_id", id)
      .order("created_at", { ascending: true })
      .limit(200);
    setActivities(act.data || []);

    if (l?.source_enquiry_id) {
      const { data: e } = await supabase
        .from("contact_messages")
        .select("id,name,email,phone,message,service,service_needed,enquiry_type,created_at")
        .eq("id", l.source_enquiry_id)
        .maybeSingle();
      setEnquiry(e);
    } else {
      setEnquiry(null);
    }

    setDocs([]);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  if (loading) {
    return <div className="p-12 flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;
  }
  if (!lead) return <div className="p-12 text-center text-sm text-muted-foreground">Lead not found.</div>;

  const summary: SummaryField[] = [
    { label: "Email", value: lead.email && <a href={`mailto:${lead.email}`} className="text-primary hover:underline">{lead.email}</a> },
    { label: "Phone", value: lead.phone && <a href={`tel:${lead.phone}`} className="text-primary hover:underline">{lead.phone}</a> },
    { label: "WhatsApp", value: lead.whatsapp },
    { label: "Service", value: lead.service_needed },
    { label: "City", value: lead.city },
    { label: "State", value: lead.state },
    { label: "Country", value: lead.country },
    { label: "Status", value: lead.status },
    { label: "Created", value: new Date(lead.created_at).toLocaleString("en-IN") },
  ];

  const tabs: RelatedTab[] = [
    {
      id: "summary",
      label: "Summary",
      icon: FileText,
      content: (
        <div className="space-y-4">
          <div>
            <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Lead Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              {[
                ["Full Name", lead.full_name],
                ["Email", lead.email],
                ["Phone", lead.phone],
                ["WhatsApp", lead.whatsapp],
                ["Stage", lead.stage],
                ["Status", lead.status],
                ["Service Needed", lead.service_needed],
                ["Business Area", lead.biz_area],
                ["Estimated Cost", lead.biz_cost],
                ["Expected Close", lead.expected_close],
              ].map(([k, v]) => (
                <div key={k as string} className="grid grid-cols-3 gap-2 border-b pb-2">
                  <div className="text-muted-foreground text-xs">{k as string}</div>
                  <div className="col-span-2 text-sm">{v || "—"}</div>
                </div>
              ))}
            </div>
          </div>
          {lead.notes && (
            <div>
              <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Notes</h3>
              <div className="text-sm whitespace-pre-wrap p-3 bg-muted/40 rounded-md">{lead.notes}</div>
            </div>
          )}
        </div>
      ),
    },
    {
      id: "activities",
      label: "Activities",
      icon: ListChecks,
      count: activities.length,
      content: activities.length === 0 ? (
        <div className="text-sm text-muted-foreground py-4 text-center">No activities yet.</div>
      ) : (
        <ul className="divide-y">
          {activities.map((a) => (
            <li key={a.id} className="py-2.5 flex items-center justify-between text-sm">
              <div>
                <div className="font-medium">{a.subject}</div>
                <div className="text-xs text-muted-foreground">{a.activity_type} · {a.status}</div>
              </div>
              {a.due_at && <span className="text-xs text-muted-foreground">{new Date(a.due_at).toLocaleString("en-IN")}</span>}
            </li>
          ))}
        </ul>
      ),
    },
    {
      id: "documents",
      label: "Documents",
      icon: FileText,
      count: docs.length,
      content: docs.length === 0 ? (
        <div className="text-sm text-muted-foreground py-4 text-center">No documents.</div>
      ) : (
        <ul className="divide-y">
          {docs.map((d) => (
            <li key={d.id} className="py-2.5 flex items-center justify-between text-sm">
              <span>{d.name}</span>
              <span className="text-xs text-muted-foreground">{new Date(d.created_at).toLocaleDateString("en-IN")}</span>
            </li>
          ))}
        </ul>
      ),
    },
    {
      id: "updates",
      label: "Updates",
      icon: Activity,
      content: <div className="text-sm text-muted-foreground py-4 text-center">Activity stream coming soon.</div>,
    },
    {
      id: "comments",
      label: "Comments",
      icon: MessageSquare,
      content: <div className="text-sm text-muted-foreground py-4 text-center">No comments yet.</div>,
    },
  ];

  return (
    <>
      <CrmRecordView
        backTo={`/crm/${workspace.slug}/leads`}
        title={lead.full_name}
        subtitle={[lead.city, lead.state].filter(Boolean).join(", ")}
        status={{ label: lead.stage, tone: stageTone[lead.stage] || "default" }}
        avatar={
          <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-serif text-lg">
            {(lead.full_name || "?").charAt(0).toUpperCase()}
          </div>
        }
        summary={summary}
        actions={
          <>
            {lead.email && (
              <Button asChild size="sm" variant="outline" className="h-8 gap-1.5">
                <a href={`mailto:${lead.email}`}><Mail className="h-3.5 w-3.5" />Email</a>
              </Button>
            )}
            {lead.phone && (
              <Button asChild size="sm" variant="outline" className="h-8 gap-1.5">
                <a href={`tel:${lead.phone}`}><Phone className="h-3.5 w-3.5" />Call</a>
              </Button>
            )}
            <Button
              size="sm"
              className="h-8 gap-1.5"
              disabled={lead.stage === "won" || lead.stage === "lost"}
              onClick={() => setConvertOpen(true)}
            >
              Convert
            </Button>
          </>
        }
        tabs={tabs}
      />
      <ConvertLeadDialog
        workspaceId={workspace.id}
        lead={lead}
        open={convertOpen}
        onOpenChange={setConvertOpen}
        onDone={() => { setConvertOpen(false); load(); }}
      />
    </>
  );
}

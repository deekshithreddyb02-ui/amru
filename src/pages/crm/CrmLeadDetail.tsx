import { useEffect, useState } from "react";
import { Link, useOutletContext, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Phone, ListChecks, FileText, MessageSquare, Activity, Loader2, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [prevLeads, setPrevLeads] = useState<any[]>([]);
  const [prevLoading, setPrevLoading] = useState(false);

  const openDetails = async () => {
    setDetailsOpen(true);
    setPrevLoading(true);
    const filters: string[] = [];
    if (lead?.phone) filters.push(`phone.eq.${lead.phone}`);
    if (lead?.whatsapp) filters.push(`whatsapp.eq.${lead.whatsapp}`);
    if (lead?.email) filters.push(`email.eq.${lead.email}`);
    if (filters.length === 0) {
      setPrevLeads([]);
      setPrevLoading(false);
      return;
    }
    const { data } = await supabase
      .from("crm_leads")
      .select("id,full_name,email,phone,whatsapp,service_needed,stage,status,city,state,created_at")
      .eq("workspace_id", workspace.id)
      .neq("id", lead.id)
      .or(filters.join(","))
      .order("created_at", { ascending: false })
      .limit(50);
    setPrevLeads(data || []);
    setPrevLoading(false);
  };

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
      id: "conversation",
      label: "Conversation",
      icon: MessageSquare,
      count: (enquiry ? 1 : 0) + activities.length,
      content: (
        <div className="space-y-3">
          {!enquiry && activities.length === 0 && (
            <div className="text-sm text-muted-foreground py-4 text-center">
              No conversation yet. Log a call, email, or note to start the thread.
            </div>
          )}
          {enquiry && (
            <div className="flex gap-2 items-start">
              <div className="h-8 w-8 rounded-full bg-muted text-foreground flex items-center justify-center text-xs font-medium shrink-0">
                {(enquiry.name || "?").charAt(0).toUpperCase()}
              </div>
              <div className="max-w-[80%] bg-muted rounded-lg rounded-tl-none px-3 py-2">
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-1">
                  <span className="font-medium text-foreground">{enquiry.name || "Customer"}</span>
                  <span>· Website enquiry</span>
                  <span>· {new Date(enquiry.created_at).toLocaleString("en-IN")}</span>
                </div>
                {(enquiry.service_needed || enquiry.service) && (
                  <div className="text-[11px] text-primary font-medium mb-1">
                    Re: {enquiry.service_needed || enquiry.service}
                  </div>
                )}
                <div className="text-sm whitespace-pre-wrap">{enquiry.message || "—"}</div>
              </div>
            </div>
          )}
          {activities.map((a) => {
            const isOutbound = ["call", "email", "whatsapp", "sms", "meeting"].includes(a.activity_type);
            return (
              <div key={a.id} className={`flex gap-2 items-start ${isOutbound ? "flex-row-reverse" : ""}`}>
                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${isOutbound ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                  {a.activity_type?.charAt(0).toUpperCase() || "•"}
                </div>
                <div className={`max-w-[80%] rounded-lg px-3 py-2 ${isOutbound ? "bg-primary/10 rounded-tr-none" : "bg-muted rounded-tl-none"}`}>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-1">
                    <span className="font-medium text-foreground capitalize">{a.activity_type}</span>
                    <span>· {a.status}</span>
                    <span>· {new Date(a.created_at).toLocaleString("en-IN")}</span>
                  </div>
                  {a.subject && <div className="text-sm font-medium">{a.subject}</div>}
                  {a.description && <div className="text-sm whitespace-pre-wrap text-muted-foreground">{a.description}</div>}
                </div>
              </div>
            );
          })}
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
            <Button size="sm" variant="default" className="h-8 gap-1.5 bg-green-600 hover:bg-green-700 text-white" onClick={openDetails}>
              <Eye className="h-3.5 w-3.5" /> View Details
            </Button>
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
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <div>
              <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                {[
                  ["Full Name", lead.full_name],
                  ["Email", lead.email],
                  ["Phone", lead.phone],
                  ["WhatsApp", lead.whatsapp],
                  ["Company", lead.company],
                  ["GSTIN", lead.gstin],
                  ["Service Needed", lead.service_needed],
                  ["Lead Source", lead.lead_source],
                  ["Street", lead.street],
                  ["City", lead.city],
                  ["State", lead.state],
                  ["Country", lead.country],
                  ["Stage", lead.stage],
                  ["Status", lead.status],
                ].map(([k, v]) => (
                  <div key={k as string} className="grid grid-cols-3 gap-2 border-b pb-1.5">
                    <div className="text-muted-foreground text-xs">{k as string}</div>
                    <div className="col-span-2 text-sm break-words">{(v as any) || "—"}</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                Previous Leads from this Customer
              </h3>
              {prevLoading ? (
                <div className="py-6 flex justify-center"><Loader2 className="h-4 w-4 animate-spin text-primary" /></div>
              ) : prevLeads.length === 0 ? (
                <div className="text-sm text-muted-foreground py-4 text-center border rounded-md">
                  No other leads found for this customer.
                </div>
              ) : (
                <div className="border rounded-md overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-xs">
                      <tr className="text-left">
                        <th className="px-3 py-2 font-medium">Date</th>
                        <th className="px-3 py-2 font-medium">Service</th>
                        <th className="px-3 py-2 font-medium">Location</th>
                        <th className="px-3 py-2 font-medium">Stage</th>
                        <th className="px-3 py-2 font-medium"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {prevLeads.map((p) => (
                        <tr key={p.id} className="border-t hover:bg-muted/30">
                          <td className="px-3 py-2 text-xs">{new Date(p.created_at).toLocaleDateString("en-IN")}</td>
                          <td className="px-3 py-2 text-xs">{p.service_needed || "—"}</td>
                          <td className="px-3 py-2 text-xs">{[p.city, p.state].filter(Boolean).join(", ") || "—"}</td>
                          <td className="px-3 py-2 text-xs">
                            <Badge variant="secondary" className="capitalize">{p.stage || "—"}</Badge>
                          </td>
                          <td className="px-3 py-2 text-right">
                            <Link
                              to={`/crm/${workspace.slug}/leads/${p.id}`}
                              className="text-primary hover:underline text-xs"
                              onClick={() => setDetailsOpen(false)}
                            >
                              Open
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
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

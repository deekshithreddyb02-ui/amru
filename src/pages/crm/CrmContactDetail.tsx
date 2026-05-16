import { useEffect, useState } from "react";
import { useOutletContext, useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Phone, ListChecks, FileText, MessageSquare, Activity, Building, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import CrmRecordView, { type SummaryField, type RelatedTab } from "@/components/crm/vtiger/CrmRecordView";
import type { CrmWorkspace } from "@/hooks/useCrmWorkspaces";

type Ctx = { workspace: CrmWorkspace; myRole: string };

export default function CrmContactDetail() {
  const { workspace } = useOutletContext<Ctx>();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [contact, setContact] = useState<any>(null);
  const [org, setOrg] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    const { data: c } = await supabase.from("crm_contacts").select("*").eq("id", id).maybeSingle();
    setContact(c);
    if (c?.organization_id) {
      const { data: o } = await supabase.from("crm_organizations").select("id,name,industry,website").eq("id", c.organization_id).maybeSingle();
      setOrg(o);
    } else setOrg(null);
    const act = await supabase.from("crm_activities").select("id,subject,activity_type,status,due_at").eq("contact_id", id).order("created_at", { ascending: false }).limit(50);
    setActivities(act.data || []);
    const d = await supabase.from("crm_deals").select("id,name,stage,amount").eq("contact_id", id).limit(50);
    setDeals(d.data || []);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;
  if (!contact) return <div className="p-12 text-center text-sm text-muted-foreground">Contact not found.</div>;

  const summary: SummaryField[] = [
    { label: "Title", value: contact.title },
    { label: "Email", value: contact.email && <a href={`mailto:${contact.email}`} className="text-primary hover:underline">{contact.email}</a> },
    { label: "Phone", value: contact.phone && <a href={`tel:${contact.phone}`} className="text-primary hover:underline">{contact.phone}</a> },
    { label: "WhatsApp", value: contact.whatsapp },
    { label: "Organization", value: org && <button className="text-primary hover:underline" onClick={() => navigate(`/crm/${workspace.slug}/organizations/${org.id}`)}>{org.name}</button> },
    { label: "City", value: contact.city },
    { label: "State", value: contact.state },
    { label: "Created", value: new Date(contact.created_at).toLocaleString("en-IN") },
  ];

  const tabs: RelatedTab[] = [
    {
      id: "summary", label: "Summary", icon: FileText,
      content: (
        <div className="space-y-4">
          <div>
            <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Contact Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              {[
                ["Full Name", contact.full_name],
                ["Title", contact.title],
                ["Email", contact.email],
                ["Phone", contact.phone],
                ["WhatsApp", contact.whatsapp],
                ["Organization", org?.name],
                ["City", contact.city],
                ["State", contact.state],
              ].map(([k, v]) => (
                <div key={k as string} className="grid grid-cols-3 gap-2 border-b pb-2">
                  <div className="text-muted-foreground text-xs">{k as string}</div>
                  <div className="col-span-2 text-sm">{v || "—"}</div>
                </div>
              ))}
            </div>
          </div>
          {contact.notes && (
            <div>
              <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Notes</h3>
              <div className="text-sm whitespace-pre-wrap p-3 bg-muted/40 rounded-md">{contact.notes}</div>
            </div>
          )}
        </div>
      ),
    },
    {
      id: "activities", label: "Activities", icon: ListChecks, count: activities.length,
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
      id: "deals", label: "Deals", icon: Building, count: deals.length,
      content: deals.length === 0 ? (
        <div className="text-sm text-muted-foreground py-4 text-center">No deals.</div>
      ) : (
        <ul className="divide-y">
          {deals.map((d) => (
            <li key={d.id} className="py-2.5 flex items-center justify-between text-sm">
              <span className="font-medium">{d.name}</span>
              <span className="text-xs text-muted-foreground">{d.stage} · ₹{d.amount || 0}</span>
            </li>
          ))}
        </ul>
      ),
    },
    { id: "updates", label: "Updates", icon: Activity, content: <div className="text-sm text-muted-foreground py-4 text-center">Activity stream coming soon.</div> },
    { id: "comments", label: "Comments", icon: MessageSquare, content: <div className="text-sm text-muted-foreground py-4 text-center">No comments yet.</div> },
  ];

  return (
    <CrmRecordView
      backTo={`/crm/${workspace.slug}/contacts`}
      title={contact.full_name}
      subtitle={contact.title || org?.name}
      avatar={
        <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-serif text-lg">
          {(contact.full_name || "?").charAt(0).toUpperCase()}
        </div>
      }
      summary={summary}
      actions={
        <>
          {contact.email && <Button asChild size="sm" variant="outline" className="h-8 gap-1.5"><a href={`mailto:${contact.email}`}><Mail className="h-3.5 w-3.5" />Email</a></Button>}
          {contact.phone && <Button asChild size="sm" variant="outline" className="h-8 gap-1.5"><a href={`tel:${contact.phone}`}><Phone className="h-3.5 w-3.5" />Call</a></Button>}
        </>
      }
      tabs={tabs}
    />
  );
}

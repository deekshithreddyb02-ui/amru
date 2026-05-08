import { useEffect, useState } from "react";
import { useOutletContext, useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Phone, Globe, FileText, UserRound, Briefcase, Activity, Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import CrmRecordView, { type SummaryField, type RelatedTab } from "@/components/crm/vtiger/CrmRecordView";
import type { CrmWorkspace } from "@/hooks/useCrmWorkspaces";

type Ctx = { workspace: CrmWorkspace; myRole: string };

export default function CrmOrganizationDetail() {
  const { workspace } = useOutletContext<Ctx>();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [org, setOrg] = useState<any>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    const { data: o } = await supabase.from("crm_organizations").select("*").eq("id", id).maybeSingle();
    setOrg(o);
    const c = await supabase.from("crm_contacts").select("id,full_name,title,email,phone").eq("organization_id", id).limit(100);
    setContacts(c.data || []);
    const d = await supabase.from("crm_deals").select("id,name,stage,amount").eq("organization_id", id).limit(100);
    setDeals(d.data || []);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;
  if (!org) return <div className="p-12 text-center text-sm text-muted-foreground">Organization not found.</div>;

  const summary: SummaryField[] = [
    { label: "Industry", value: org.industry },
    { label: "Email", value: org.email && <a href={`mailto:${org.email}`} className="text-primary hover:underline">{org.email}</a> },
    { label: "Phone", value: org.phone && <a href={`tel:${org.phone}`} className="text-primary hover:underline">{org.phone}</a> },
    { label: "Website", value: org.website && <a href={org.website.startsWith("http") ? org.website : `https://${org.website}`} target="_blank" rel="noreferrer" className="text-primary hover:underline">{org.website}</a> },
    { label: "City", value: org.city },
    { label: "State", value: org.state },
    { label: "Created", value: new Date(org.created_at).toLocaleString("en-IN") },
  ];

  const tabs: RelatedTab[] = [
    {
      id: "summary", label: "Summary", icon: FileText,
      content: (
        <div className="space-y-4">
          <div>
            <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Organization Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              {[
                ["Name", org.name], ["Industry", org.industry], ["Website", org.website],
                ["Phone", org.phone], ["Email", org.email], ["City", org.city], ["State", org.state],
              ].map(([k, v]) => (
                <div key={k as string} className="grid grid-cols-3 gap-2 border-b pb-2">
                  <div className="text-muted-foreground text-xs">{k as string}</div>
                  <div className="col-span-2 text-sm">{v || "—"}</div>
                </div>
              ))}
            </div>
          </div>
          {org.notes && (
            <div>
              <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Notes</h3>
              <div className="text-sm whitespace-pre-wrap p-3 bg-muted/40 rounded-md">{org.notes}</div>
            </div>
          )}
        </div>
      ),
    },
    {
      id: "contacts", label: "Contacts", icon: UserRound, count: contacts.length,
      content: contacts.length === 0 ? (
        <div className="text-sm text-muted-foreground py-4 text-center">No contacts.</div>
      ) : (
        <ul className="divide-y">
          {contacts.map((c) => (
            <li key={c.id} className="py-2.5 flex items-center justify-between text-sm">
              <button onClick={() => navigate(`/crm/${workspace.slug}/contacts/${c.id}`)} className="text-left">
                <div className="font-medium text-primary hover:underline">{c.full_name}</div>
                <div className="text-xs text-muted-foreground">{c.title || ""}</div>
              </button>
              <span className="text-xs text-muted-foreground">{c.email || c.phone || ""}</span>
            </li>
          ))}
        </ul>
      ),
    },
    {
      id: "deals", label: "Deals", icon: Briefcase, count: deals.length,
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
      backTo={`/crm/${workspace.slug}/organizations`}
      title={org.name}
      subtitle={[org.city, org.state].filter(Boolean).join(", ")}
      avatar={
        <div className="h-12 w-12 rounded-md bg-primary/10 text-primary flex items-center justify-center font-serif text-lg">
          {(org.name || "?").charAt(0).toUpperCase()}
        </div>
      }
      summary={summary}
      actions={
        <>
          {org.email && <Button asChild size="sm" variant="outline" className="h-8 gap-1.5"><a href={`mailto:${org.email}`}><Mail className="h-3.5 w-3.5" />Email</a></Button>}
          {org.phone && <Button asChild size="sm" variant="outline" className="h-8 gap-1.5"><a href={`tel:${org.phone}`}><Phone className="h-3.5 w-3.5" />Call</a></Button>}
          {org.website && <Button asChild size="sm" variant="outline" className="h-8 gap-1.5"><a href={org.website.startsWith("http") ? org.website : `https://${org.website}`} target="_blank" rel="noreferrer"><Globe className="h-3.5 w-3.5" />Web</a></Button>}
        </>
      }
      tabs={tabs}
    />
  );
}

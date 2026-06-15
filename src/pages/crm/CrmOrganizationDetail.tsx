import { useEffect, useState } from "react";
import { useOutletContext, useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Mail, Phone, Globe, FileText, UserRound, Briefcase, Activity, Loader2, MessageSquare,
  FolderKanban, FileSpreadsheet, Receipt, Paperclip, Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import CrmRecordView, { type SummaryField, type RelatedTab } from "@/components/crm/vtiger/CrmRecordView";
import type { CrmWorkspace } from "@/hooks/useCrmWorkspaces";

type Ctx = { workspace: CrmWorkspace; myRole: string };

const contactEmpty = { full_name: "", title: "", email: "", phone: "" };

export default function CrmOrganizationDetail() {
  const { workspace } = useOutletContext<Ctx>();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [org, setOrg] = useState<any>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [contactOpen, setContactOpen] = useState(false);
  const [contactForm, setContactForm] = useState(contactEmpty);
  const [savingContact, setSavingContact] = useState(false);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    const { data: o } = await supabase.from("crm_organizations").select("*").eq("id", id).maybeSingle();
    setOrg(o);

    const [c, d, q, inv, act, doc] = await Promise.all([
      supabase.from("crm_contacts").select("id,full_name,title,email,phone").eq("organization_id", id).limit(200),
      supabase.from("crm_deals").select("id,name,stage,amount,created_at").eq("organization_id", id).limit(200),
      supabase.from("crm_quotations").select("id,quotation_number,status,total,created_at").eq("organization_id", id).limit(200),
      supabase.from("crm_invoices").select("id,invoice_number,status,total,created_at").eq("organization_id", id).limit(200),
      supabase.from("crm_activities").select("id,subject,type,due_date,status,created_at").eq("organization_id", id).order("created_at", { ascending: false }).limit(100),
      supabase.from("crm_documents").select("id,name,file_url,created_at").eq("organization_id", id).limit(100),
    ]);
    setContacts(c.data || []);
    setDeals(d.data || []);
    setQuotations(q.data || []);
    setInvoices(inv.data || []);
    setActivities(act.data || []);
    setDocuments(doc.data || []);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  // Auto-open contact dialog when navigated with ?addContact=1
  useEffect(() => {
    if (searchParams.get("addContact") === "1") {
      setContactOpen(true);
      const next = new URLSearchParams(searchParams);
      next.delete("addContact");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const saveContact = async () => {
    if (!contactForm.full_name.trim() || !id) return;
    setSavingContact(true);
    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await supabase.from("crm_contacts").insert({
      workspace_id: workspace.id,
      organization_id: id,
      full_name: contactForm.full_name.trim(),
      title: contactForm.title || null,
      email: contactForm.email || null,
      phone: contactForm.phone || null,
      created_by: session?.user.id,
    });
    setSavingContact(false);
    if (error) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Contact added" });
      setContactForm(contactEmpty);
      setContactOpen(false);
      load();
    }
  };

  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;
  if (!org) return <div className="p-12 text-center text-sm text-muted-foreground">Organization not found.</div>;

  const summary: SummaryField[] = [
    { label: "Industry", value: org.industry },
    { label: "Email", value: org.email && <a href={`mailto:${org.email}`} className="text-primary hover:underline">{org.email}</a> },
    { label: "Phone", value: org.phone && <a href={`tel:${org.phone}`} className="text-primary hover:underline">{org.phone}</a> },
    { label: "Website", value: org.website && <a href={org.website.startsWith("http") ? org.website : `https://${org.website}`} target="_blank" rel="noreferrer" className="text-primary hover:underline">{org.website}</a> },
    { label: "City", value: org.city },
    { label: "State", value: org.state },
    { label: "Contacts", value: contacts.length },
    { label: "Projects", value: deals.length },
  ];

  const tabs: RelatedTab[] = [
    {
      id: "summary", label: "Organization Info", icon: FileText,
      content: (
        <div className="space-y-4">
          <div>
            <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Organization Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              {[
                ["Name", org.name], ["Industry", org.industry], ["Website", org.website],
                ["Phone", org.phone], ["Email", org.email],
                ["Street", org.street], ["City", org.city], ["State", org.state],
                ["Pincode", org.pincode], ["Country", org.country],
              ].map(([k, v]) => (
                <div key={k as string} className="grid grid-cols-3 gap-2 border-b pb-2">
                  <div className="text-muted-foreground text-xs">{k as string}</div>
                  <div className="col-span-2 text-sm">{(v as any) || "—"}</div>
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
      content: (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button size="sm" className="h-8 gap-1.5" onClick={() => setContactOpen(true)}>
              <Plus className="h-3.5 w-3.5" /> Add Contact
            </Button>
          </div>
          {contacts.length === 0 ? (
            <div className="text-sm text-muted-foreground py-4 text-center">No contacts yet.</div>
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
          )}
        </div>
      ),
    },
    {
      id: "projects", label: "Projects", icon: FolderKanban, count: deals.length,
      content: deals.length === 0 ? (
        <div className="text-sm text-muted-foreground py-4 text-center">No projects.</div>
      ) : (
        <ul className="divide-y">
          {deals.map((d) => (
            <li key={d.id} className="py-2.5 flex items-center justify-between text-sm">
              <button onClick={() => navigate(`/crm/${workspace.slug}/deals/${d.id}`)} className="text-left font-medium text-primary hover:underline">
                {d.name}
              </button>
              <span className="text-xs text-muted-foreground">{d.stage} · ₹{Number(d.amount || 0).toLocaleString("en-IN")}</span>
            </li>
          ))}
        </ul>
      ),
    },
    {
      id: "quotations", label: "Quotations", icon: FileSpreadsheet, count: quotations.length,
      content: quotations.length === 0 ? (
        <div className="text-sm text-muted-foreground py-4 text-center">No quotations.</div>
      ) : (
        <ul className="divide-y">
          {quotations.map((q) => (
            <li key={q.id} className="py-2.5 flex items-center justify-between text-sm">
              <span className="font-medium">{q.quotation_number || q.id.slice(0, 8)}</span>
              <span className="text-xs text-muted-foreground">{q.status} · ₹{Number(q.total || 0).toLocaleString("en-IN")}</span>
            </li>
          ))}
        </ul>
      ),
    },
    {
      id: "invoices", label: "Invoices", icon: Receipt, count: invoices.length,
      content: invoices.length === 0 ? (
        <div className="text-sm text-muted-foreground py-4 text-center">No invoices.</div>
      ) : (
        <ul className="divide-y">
          {invoices.map((i) => (
            <li key={i.id} className="py-2.5 flex items-center justify-between text-sm">
              <span className="font-medium">{i.invoice_number || i.id.slice(0, 8)}</span>
              <span className="text-xs text-muted-foreground">{i.status} · ₹{Number(i.total || 0).toLocaleString("en-IN")}</span>
            </li>
          ))}
        </ul>
      ),
    },
    {
      id: "activities", label: "Activities", icon: Activity, count: activities.length,
      content: activities.length === 0 ? (
        <div className="text-sm text-muted-foreground py-4 text-center">No activities.</div>
      ) : (
        <ul className="divide-y">
          {activities.map((a) => (
            <li key={a.id} className="py-2.5 flex items-center justify-between text-sm">
              <span className="font-medium">{a.subject}</span>
              <span className="text-xs text-muted-foreground">{a.type} · {a.status}</span>
            </li>
          ))}
        </ul>
      ),
    },
    {
      id: "documents", label: "Documents", icon: Paperclip, count: documents.length,
      content: documents.length === 0 ? (
        <div className="text-sm text-muted-foreground py-4 text-center">No documents.</div>
      ) : (
        <ul className="divide-y">
          {documents.map((d) => (
            <li key={d.id} className="py-2.5 flex items-center justify-between text-sm">
              <span className="font-medium">{d.name}</span>
              {d.file_url && (
                <a href={d.file_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">Open</a>
              )}
            </li>
          ))}
        </ul>
      ),
    },
    { id: "comments", label: "Comments", icon: MessageSquare, content: <div className="text-sm text-muted-foreground py-4 text-center">No comments yet.</div> },
  ];

  return (
    <>
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
            <Button size="sm" className="h-8 gap-1.5" onClick={() => setContactOpen(true)}>
              <Plus className="h-3.5 w-3.5" />Add Contact
            </Button>
            {org.email && <Button asChild size="sm" variant="outline" className="h-8 gap-1.5"><a href={`mailto:${org.email}`}><Mail className="h-3.5 w-3.5" />Email</a></Button>}
            {org.phone && <Button asChild size="sm" variant="outline" className="h-8 gap-1.5"><a href={`tel:${org.phone}`}><Phone className="h-3.5 w-3.5" />Call</a></Button>}
            {org.website && <Button asChild size="sm" variant="outline" className="h-8 gap-1.5"><a href={org.website.startsWith("http") ? org.website : `https://${org.website}`} target="_blank" rel="noreferrer"><Globe className="h-3.5 w-3.5" />Web</a></Button>}
          </>
        }
        tabs={tabs}
      />

      <Dialog open={contactOpen} onOpenChange={setContactOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add contact to {org.name}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label>Full name *</Label><Input value={contactForm.full_name} onChange={(e) => setContactForm({ ...contactForm, full_name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Designation</Label><Input value={contactForm.title} onChange={(e) => setContactForm({ ...contactForm, title: e.target.value })} /></div>
              <div><Label>Phone</Label><Input value={contactForm.phone} onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })} /></div>
              <div className="col-span-2"><Label>Email</Label><Input type="email" value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={saveContact} disabled={savingContact || !contactForm.full_name.trim()}>
              {savingContact ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Contact"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

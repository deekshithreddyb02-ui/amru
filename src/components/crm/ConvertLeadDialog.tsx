import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  ArrowRightLeft,
  Building2,
  User,
  Wrench,
  Target,
  Users,
  Link2,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Lead = {
  id: string;
  full_name: string;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  city?: string | null;
  state?: string | null;
  street?: string | null;
  pincode?: string | null;
  country?: string | null;
  service_needed?: string | null;
  biz_cost?: number | null;
  expected_close?: string | null;
  notes?: string | null;
};

type Props = {
  workspaceId: string;
  lead: Lead | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onDone?: () => void;
};

type ExistingOrg = {
  id: string;
  name: string;
  industry: string | null;
  city: string | null;
  state: string | null;
};

type Member = { user_id: string; full_name: string | null };

const normalize = (s: string) =>
  (s || "").toLowerCase().replace(/\s+/g, " ").trim();

const SERVICE_TYPES = [
  "Rain Water Harvesting",
  "Ground Water Survey",
  "Hydrogeology Study",
  "Recharge Pit Design",
  "Borewell Consultancy",
  "Site Inspection",
  "Water Management Design",
  "Other",
];

const STAGES = [
  { value: "qualification", label: "Qualification" },
  { value: "site_visit", label: "Site Visit" },
  { value: "technical_review", label: "Technical Review" },
  { value: "proposal", label: "Proposal Preparation" },
  { value: "quotation_sent", label: "Quotation Sent" },
  { value: "approval_pending", label: "Approval Pending" },
  { value: "work_order", label: "Work Order" },
  { value: "execution", label: "Execution" },
  { value: "completed", label: "Completed" },
  { value: "lost", label: "Lost" },
];

const GROUPS = [
  "Sales Team",
  "Marketing Team",
  "Hyderabad Team",
  "Bangalore Team",
  "Maharashtra Team",
  "Support Team",
];

const ORG_TYPES = ["Private Limited", "LLP", "Partnership", "Proprietorship", "Government", "NGO", "Individual"];
const INDUSTRIES = ["Construction", "Real Estate", "Agriculture", "Manufacturing", "Hospitality", "Government", "Education", "Other"];

const STEPS = [
  { id: "org", label: "Organization", icon: Building2 },
  { id: "contact", label: "Contact", icon: User },
  { id: "service", label: "Service Request", icon: Wrench },
  { id: "opp", label: "Opportunity", icon: Target },
  { id: "assign", label: "Assignment", icon: Users },
  { id: "review", label: "Review", icon: CheckCircle2 },
] as const;

const ConvertLeadDialog = ({ workspaceId, lead, open, onOpenChange, onDone }: Props) => {
  const [step, setStep] = useState(0);

  // Section toggles
  const [doOrg, setDoOrg] = useState(true);
  const [doContact, setDoContact] = useState(true);
  const [doService, setDoService] = useState(true);
  const [doOpp, setDoOpp] = useState(true);

  // Organization
  const [org, setOrg] = useState({
    name: "",
    industry: "",
    orgType: "",
    website: "",
    gst: "",
    street: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [orgMatches, setOrgMatches] = useState<ExistingOrg[]>([]);
  const [existingOrg, setExistingOrg] = useState<ExistingOrg | null>(null);
  const [useExistingOrgId, setUseExistingOrgId] = useState<string | null>(null);

  // Contact
  const [contact, setContact] = useState({
    firstName: "",
    lastName: "",
    designation: "",
    mobile: "",
    email: "",
  });

  // Service Request
  const [service, setService] = useState({
    type: "Ground Water Survey",
    title: "",
    location: "",
    priority: "medium",
    startDate: "",
    notes: "",
  });

  // Opportunity
  const [opp, setOpp] = useState({
    name: "",
    amount: "",
    closeDate: "",
    stage: "qualification",
  });

  // Assignment
  const [assignedTo, setAssignedTo] = useState<string>("");
  const [group, setGroup] = useState<string>("Sales Team");
  const [transferTo, setTransferTo] = useState<"organization" | "contact" | "service" | "opportunity">("contact");

  const [members, setMembers] = useState<Member[]>([]);
  const [saving, setSaving] = useState(false);

  // Bootstrap form from the lead
  useEffect(() => {
    if (!open || !lead) return;
    setStep(0);
    setUseExistingOrgId(null);
    setExistingOrg(null);

    const [first, ...rest] = (lead.full_name || "").trim().split(/\s+/);
    setContact({
      firstName: first || "",
      lastName: rest.join(" "),
      designation: "",
      mobile: lead.phone || lead.whatsapp || "",
      email: lead.email || "",
    });
    setOrg((o) => ({
      ...o,
      name: "",
      street: lead.street || "",
      city: lead.city || "",
      state: lead.state || "",
      pincode: lead.pincode || "",
    }));
    setService((s) => ({
      ...s,
      type: SERVICE_TYPES.includes(lead.service_needed || "") ? (lead.service_needed as string) : "Ground Water Survey",
      title: `${lead.service_needed || "Service"} — ${lead.full_name}`,
      location: [lead.city, lead.state].filter(Boolean).join(", "),
      notes: lead.notes || "",
    }));
    setOpp({
      name: `${lead.service_needed || "Project"} — ${lead.full_name}`,
      amount: lead.biz_cost ? String(lead.biz_cost) : "",
      closeDate: lead.expected_close || "",
      stage: "qualification",
    });
    setDoOrg(true);
    setDoContact(true);
    setDoService(true);
    setDoOpp(true);
  }, [open, lead]);

  // Load workspace members for the assignee dropdown
  useEffect(() => {
    if (!open || !workspaceId) return;
    (async () => {
      const { data } = await supabase
        .from("crm_workspace_members")
        .select("user_id, profiles:user_id(full_name)")
        .eq("workspace_id", workspaceId);
      const list: Member[] = ((data as any[]) || []).map((m) => ({
        user_id: m.user_id,
        full_name: m.profiles?.full_name || null,
      }));
      setMembers(list);
      const { data: { session } } = await supabase.auth.getSession();
      setAssignedTo((prev) => prev || session?.user.id || list[0]?.user_id || "");
    })();
  }, [open, workspaceId]);

  // Live search for existing organizations as user types
  useEffect(() => {
    if (!doOrg || !org.name.trim() || useExistingOrgId) {
      setOrgMatches([]);
      setExistingOrg(null);
      return;
    }
    const q = org.name.trim();
    const handle = setTimeout(async () => {
      const { data } = await supabase
        .from("crm_organizations")
        .select("id,name,industry,city,state")
        .eq("workspace_id", workspaceId)
        .ilike("name", `%${q}%`)
        .limit(5);
      const list = (data as ExistingOrg[]) || [];
      setOrgMatches(list);
      const exact = list.find((o) => normalize(o.name) === normalize(q));
      setExistingOrg(exact || null);
    }, 250);
    return () => clearTimeout(handle);
  }, [org.name, doOrg, workspaceId, useExistingOrgId]);

  const orgComposedNotes = useMemo(() => {
    const parts: string[] = [];
    if (org.orgType) parts.push(`Type: ${org.orgType}`);
    if (org.gst) parts.push(`GST: ${org.gst}`);
    return parts.join(" | ");
  }, [org.orgType, org.gst]);

  const canNext = useMemo(() => {
    if (step === 0 && doOrg && !useExistingOrgId && !org.name.trim()) return false;
    if (step === 1 && doContact && !contact.firstName.trim()) return false;
    if (step === 3 && doOpp && !opp.name.trim()) return false;
    if (step === 4 && !assignedTo) return false;
    return true;
  }, [step, doOrg, useExistingOrgId, org.name, doContact, contact.firstName, doOpp, opp.name, assignedTo]);

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const handleConvert = async (openRecord = false) => {
    if (!lead) return;
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user.id ?? null;

      // 1) Organization (existing or new)
      let organization_id: string | null = useExistingOrgId;
      if (doOrg && !organization_id) {
        const cleanName = org.name.replace(/\s+/g, " ").trim();
        if (!cleanName) throw new Error("Organization name is required");
        const { data: dup } = await supabase
          .from("crm_organizations")
          .select("id,name")
          .eq("workspace_id", workspaceId)
          .ilike("name", cleanName)
          .limit(5);
        const match = (dup || []).find((d: any) => normalize(d.name) === normalize(cleanName));
        if (match) {
          organization_id = match.id;
        } else {
          const { data: created, error: orgErr } = await supabase
            .from("crm_organizations")
            .insert({
              workspace_id: workspaceId,
              name: cleanName,
              industry: org.industry || null,
              website: org.website || null,
              street: org.street || null,
              city: org.city || null,
              state: org.state || null,
              pincode: org.pincode || null,
              notes: orgComposedNotes || null,
              created_by: uid,
            })
            .select("id")
            .single();
          if (orgErr) throw orgErr;
          organization_id = created.id;
        }
      }

      // 2) Contact
      let contact_id: string | null = null;
      if (doContact) {
        const fullName = `${contact.firstName} ${contact.lastName}`.trim() || lead.full_name;
        const { data: c, error: cErr } = await supabase
          .from("crm_contacts")
          .insert({
            workspace_id: workspaceId,
            organization_id,
            full_name: fullName,
            title: contact.designation || null,
            email: contact.email || null,
            phone: contact.mobile || null,
            whatsapp: lead.whatsapp || null,
            city: lead.city || null,
            state: lead.state || null,
            created_by: uid,
          })
          .select("id")
          .single();
        if (cErr) throw cErr;
        contact_id = c.id;
      }

      // 3) Service Request -> hydrogeo enquiry
      let service_id: string | null = null;
      if (doService) {
        const composedNotes = [
          `Service: ${service.type}`,
          service.title ? `Title: ${service.title}` : "",
          `Priority: ${service.priority}`,
          service.notes ? `Notes: ${service.notes}` : "",
        ]
          .filter(Boolean)
          .join("\n");
        const { data: s, error: sErr } = await supabase
          .from("crm_hydrogeo_enquiries")
          .insert({
            workspace_id: workspaceId,
            lead_id: lead.id,
            contact_id,
            site_name: service.title || lead.full_name,
            site_address: service.location || lead.street,
            site_city: lead.city,
            site_state: lead.state,
            site_pincode: lead.pincode,
            preferred_visit_date: service.startDate || null,
            notes: composedNotes,
            survey_status: "pending",
            created_by: uid,
          })
          .select("id")
          .single();
        if (sErr) throw sErr;
        service_id = s.id;
      }

      // 4) Opportunity -> deal
      let deal_id: string | null = null;
      if (doOpp) {
        const { data: d, error: dErr } = await supabase
          .from("crm_deals")
          .insert({
            workspace_id: workspaceId,
            title: opp.name.trim(),
            amount: opp.amount ? Number(opp.amount) : 0,
            stage: opp.stage,
            probability: 30,
            expected_close: opp.closeDate || null,
            contact_id,
            organization_id,
            lead_id: lead.id,
            owner_id: assignedTo || uid,
            created_by: uid,
            description: `Group: ${group}\nService: ${service.type}`,
          })
          .select("id")
          .single();
        if (dErr) throw dErr;
        deal_id = d.id;
      }

      // 5) Timeline / activity entry on the chosen related record
      try {
        await supabase.from("crm_activities").insert({
          workspace_id: workspaceId,
          activity_type: "note",
          subject: `Lead converted: ${lead.full_name}`,
          description: `Converted from lead. Transferred to: ${transferTo}. Group: ${group}.`,
          status: "done",
          assigned_to: assignedTo || uid,
          lead_id: lead.id,
          contact_id: transferTo === "contact" ? contact_id : null,
          organization_id: transferTo === "organization" ? organization_id : null,
          deal_id: transferTo === "opportunity" ? deal_id : null,
          created_by: uid,
        });
      } catch {
        // non-fatal
      }

      // 6) Mark lead converted
      await supabase
        .from("crm_leads")
        .update({ stage: "qualified", status: "converted" })
        .eq("id", lead.id);

      toast.success("Lead converted successfully");

      // Optionally open the chosen related record
      if (openRecord) {
        const slug = (window.location.pathname.match(/\/crm\/([^/]+)/) || [])[1];
        if (slug) {
          if (transferTo === "opportunity" && deal_id) window.location.href = `/crm/${slug}/deals/${deal_id}`;
          else if (transferTo === "organization" && organization_id) window.location.href = `/crm/${slug}/organizations/${organization_id}`;
          else if (transferTo === "contact" && contact_id) window.location.href = `/crm/${slug}/contacts/${contact_id}`;
        }
      }

      onOpenChange(false);
      onDone?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Conversion failed");
    } finally {
      setSaving(false);
    }
  };

  const SectionCard = ({
    icon: Icon,
    title,
    enabled,
    onToggle,
    required,
    children,
  }: {
    icon: any;
    title: string;
    enabled: boolean;
    onToggle?: (v: boolean) => void;
    required?: boolean;
    children: React.ReactNode;
  }) => (
    <div className={cn("rounded-lg border bg-card", enabled ? "border-primary/40" : "border-border opacity-90")}>
      <div className="flex items-center gap-3 border-b px-4 py-3">
        {onToggle ? (
          <Checkbox checked={enabled} onCheckedChange={(v) => onToggle(!!v)} disabled={required} />
        ) : (
          <div className="h-4 w-4" />
        )}
        <Icon className="h-4 w-4 text-primary" />
        <div className="font-medium text-sm">{title}</div>
        {required && <Badge variant="secondary" className="ml-auto text-[10px]">Required</Badge>}
      </div>
      {enabled && <div className="p-4 space-y-3">{children}</div>}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92dvh] overflow-hidden flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b bg-muted/30">
          <DialogTitle className="flex items-center gap-2 text-base">
            <ArrowRightLeft className="h-5 w-5 text-primary" />
            Convert Lead — {lead?.full_name || ""}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Create Organization, Contact, Service Request and Opportunity from this qualified lead.
          </DialogDescription>
        </DialogHeader>

        {/* Stepper */}
        <div className="px-6 py-3 border-b overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const active = i === step;
              const done = i < step;
              return (
                <div key={s.id} className="flex items-center gap-2">
                  <button
                    onClick={() => setStep(i)}
                    className={cn(
                      "flex items-center gap-2 rounded-full px-3 py-1.5 text-xs transition",
                      active ? "bg-primary text-primary-foreground" :
                      done ? "bg-primary/10 text-primary" :
                      "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{s.label}</span>
                  </button>
                  {i < STEPS.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* STEP 0 — Organization */}
          {step === 0 && (
            <SectionCard icon={Building2} title="Create Organization" enabled={doOrg} onToggle={setDoOrg}>
              {useExistingOrgId ? (
                <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm">
                  <div className="flex items-center gap-2 font-medium text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" /> Using existing organization
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {existingOrg?.name || orgMatches.find((o) => o.id === useExistingOrgId)?.name}
                  </div>
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 mt-1"
                    onClick={() => { setUseExistingOrgId(null); }}
                  >
                    Change
                  </Button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2 relative">
                      <Label>Organization Name *</Label>
                      <Input
                        value={org.name}
                        onChange={(e) => setOrg({ ...org, name: e.target.value })}
                        placeholder="e.g. Acme Constructions Pvt Ltd"
                        autoComplete="off"
                      />
                      {orgMatches.length > 0 && !existingOrg && (
                        <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-md">
                          {orgMatches.map((m) => (
                            <button
                              type="button"
                              key={m.id}
                              className="block w-full text-left px-3 py-2 text-sm hover:bg-accent"
                              onClick={() => { setUseExistingOrgId(m.id); setExistingOrg(m); setOrgMatches([]); }}
                            >
                              <div className="font-medium">{m.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {[m.industry, m.city, m.state].filter(Boolean).join(" • ") || "—"}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                      {existingOrg && (
                        <div className="mt-2 flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-2.5 text-sm">
                          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                          <div className="flex-1">
                            <div className="font-medium text-amber-700 dark:text-amber-400">Existing organization found.</div>
                            <div className="text-xs text-muted-foreground">
                              {existingOrg.name} — {[existingOrg.industry, existingOrg.city, existingOrg.state].filter(Boolean).join(", ") || "no details"}
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <Button size="sm" variant="default" onClick={() => setUseExistingOrgId(existingOrg.id)}>
                                Use Existing Organization
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => { setUseExistingOrgId(existingOrg.id); setStep(1); }}>
                                Create Contact under it
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <Label>Industry</Label>
                      <Select value={org.industry} onValueChange={(v) => setOrg({ ...org, industry: v })}>
                        <SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger>
                        <SelectContent>{INDUSTRIES.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Organization Type</Label>
                      <Select value={org.orgType} onValueChange={(v) => setOrg({ ...org, orgType: v })}>
                        <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                        <SelectContent>{ORG_TYPES.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Website</Label>
                      <Input value={org.website} onChange={(e) => setOrg({ ...org, website: e.target.value })} placeholder="https://" />
                    </div>
                    <div>
                      <Label>GST Number</Label>
                      <Input value={org.gst} onChange={(e) => setOrg({ ...org, gst: e.target.value.toUpperCase() })} placeholder="22AAAAA0000A1Z5" />
                    </div>
                    <div className="sm:col-span-2">
                      <Label>Address</Label>
                      <Input value={org.street} onChange={(e) => setOrg({ ...org, street: e.target.value })} placeholder="Street" />
                    </div>
                    <div><Label>City</Label><Input value={org.city} onChange={(e) => setOrg({ ...org, city: e.target.value })} /></div>
                    <div><Label>State</Label><Input value={org.state} onChange={(e) => setOrg({ ...org, state: e.target.value })} /></div>
                  </div>
                </>
              )}
            </SectionCard>
          )}

          {/* STEP 1 — Contact */}
          {step === 1 && (
            <SectionCard icon={User} title="Create Contact" enabled={doContact} onToggle={setDoContact}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><Label>First Name *</Label><Input value={contact.firstName} onChange={(e) => setContact({ ...contact, firstName: e.target.value })} /></div>
                <div><Label>Last Name</Label><Input value={contact.lastName} onChange={(e) => setContact({ ...contact, lastName: e.target.value })} /></div>
                <div><Label>Designation</Label><Input value={contact.designation} onChange={(e) => setContact({ ...contact, designation: e.target.value })} placeholder="e.g. Project Manager" /></div>
                <div><Label>Mobile Number</Label><Input value={contact.mobile} onChange={(e) => setContact({ ...contact, mobile: e.target.value })} /></div>
                <div className="sm:col-span-2"><Label>Email Address</Label><Input type="email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} /></div>
              </div>
              {doOrg || useExistingOrgId ? null : (
                <div className="text-xs text-amber-600 flex items-center gap-1.5">
                  <AlertTriangle className="h-3 w-3" /> A contact should belong to an organization. Enable "Create Organization" or pick an existing one.
                </div>
              )}
            </SectionCard>
          )}

          {/* STEP 2 — Service Request */}
          {step === 2 && (
            <SectionCard icon={Wrench} title="Create Service Request" enabled={doService} onToggle={setDoService}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <Label>Service Type</Label>
                  <Select value={service.type} onValueChange={(v) => setService({ ...service, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{SERVICE_TYPES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2"><Label>Project Title</Label><Input value={service.title} onChange={(e) => setService({ ...service, title: e.target.value })} /></div>
                <div className="sm:col-span-2"><Label>Site Location</Label><Input value={service.location} onChange={(e) => setService({ ...service, location: e.target.value })} /></div>
                <div>
                  <Label>Priority</Label>
                  <Select value={service.priority} onValueChange={(v) => setService({ ...service, priority: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Expected Start Date</Label><Input type="date" value={service.startDate} onChange={(e) => setService({ ...service, startDate: e.target.value })} /></div>
                <div className="sm:col-span-2"><Label>Notes</Label><Textarea rows={2} value={service.notes} onChange={(e) => setService({ ...service, notes: e.target.value })} /></div>
              </div>
            </SectionCard>
          )}

          {/* STEP 3 — Opportunity */}
          {step === 3 && (
            <SectionCard icon={Target} title="Create Opportunity" enabled={doOpp} onToggle={setDoOpp}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2"><Label>Opportunity Name *</Label><Input value={opp.name} onChange={(e) => setOpp({ ...opp, name: e.target.value })} /></div>
                <div><Label>Estimated Value (INR)</Label><Input type="number" value={opp.amount} onChange={(e) => setOpp({ ...opp, amount: e.target.value })} /></div>
                <div><Label>Expected Close Date</Label><Input type="date" value={opp.closeDate} onChange={(e) => setOpp({ ...opp, closeDate: e.target.value })} /></div>
                <div className="sm:col-span-2">
                  <Label>Stage</Label>
                  <Select value={opp.stage} onValueChange={(v) => setOpp({ ...opp, stage: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{STAGES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </SectionCard>
          )}

          {/* STEP 4 — Assignment */}
          {step === 4 && (
            <SectionCard icon={Users} title="Assignment & Related Records" enabled required>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>Assigned To *</Label>
                  <Select value={assignedTo} onValueChange={setAssignedTo}>
                    <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
                    <SelectContent>
                      {members.map((m) => (
                        <SelectItem key={m.user_id} value={m.user_id}>
                          {m.full_name || m.user_id.slice(0, 8)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Group</Label>
                  <Select value={group} onValueChange={setGroup}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{GROUPS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              <Separator className="my-2" />

              <div>
                <div className="flex items-center gap-2 mb-2 text-sm font-medium">
                  <Link2 className="h-4 w-4 text-primary" /> Transfer related record to
                </div>
                <RadioGroup value={transferTo} onValueChange={(v: any) => setTransferTo(v)} className="grid grid-cols-2 gap-2">
                  {[
                    { v: "organization", l: "Organization", disabled: !doOrg && !useExistingOrgId },
                    { v: "contact", l: "Contact", disabled: !doContact },
                    { v: "service", l: "Service Request", disabled: !doService },
                    { v: "opportunity", l: "Opportunity", disabled: !doOpp },
                  ].map((o) => (
                    <label key={o.v} className={cn("flex items-center gap-2 rounded-md border p-2.5 cursor-pointer", o.disabled && "opacity-40 cursor-not-allowed")}>
                      <RadioGroupItem value={o.v} disabled={o.disabled} />
                      <span className="text-sm">{o.l}</span>
                    </label>
                  ))}
                </RadioGroup>
              </div>
            </SectionCard>
          )}

          {/* STEP 5 — Review */}
          {step === 5 && (
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">Review the conversion summary before saving.</div>
              <div className="rounded-lg border divide-y text-sm">
                <SummaryRow label="Organization" value={useExistingOrgId ? `Existing • ${existingOrg?.name || ""}` : (doOrg ? org.name || "—" : "Skipped")} />
                <SummaryRow label="Contact" value={doContact ? `${contact.firstName} ${contact.lastName}`.trim() : "Skipped"} />
                <SummaryRow label="Service Request" value={doService ? `${service.type}${service.title ? " • " + service.title : ""}` : "Skipped"} />
                <SummaryRow label="Opportunity" value={doOpp ? `${opp.name} • ${opp.amount ? "₹" + Number(opp.amount).toLocaleString("en-IN") : "—"} • ${STAGES.find(s => s.value === opp.stage)?.label}` : "Skipped"} />
                <SummaryRow label="Assigned To" value={members.find(m => m.user_id === assignedTo)?.full_name || "—"} />
                <SummaryRow label="Group" value={group} />
                <SummaryRow label="Transfer activities to" value={transferTo} />
              </div>
              <div className="rounded-md border border-primary/30 bg-primary/5 p-3 text-xs text-muted-foreground">
                <span className="font-medium text-primary">Service workflow:</span> Lead → Organization → Contact → Site Visit → Technical Review → Proposal → Quotation → Approval → Work Order → Execution → Completion → Invoice.
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-3 border-t bg-muted/30 flex-row justify-between gap-2">
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
            {step > 0 && <Button variant="outline" onClick={prev} disabled={saving}><ChevronLeft className="h-4 w-4 mr-1" />Back</Button>}
          </div>
          <div className="flex gap-2">
            {step < STEPS.length - 1 ? (
              <Button onClick={next} disabled={!canNext}>Next<ChevronRight className="h-4 w-4 ml-1" /></Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => handleConvert(true)} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Save & Open Record
                </Button>
                <Button onClick={() => handleConvert(false)} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Convert Lead
                </Button>
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const SummaryRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between gap-3 px-3 py-2">
    <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
    <div className="text-sm font-medium text-right truncate">{value || "—"}</div>
  </div>
);

export default ConvertLeadDialog;

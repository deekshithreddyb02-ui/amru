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
import {
  Loader2,
  ArrowRightLeft,
  AlertTriangle,
  CheckCircle2,
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

const INDUSTRIES = ["Construction", "Real Estate", "Agriculture", "Manufacturing", "Hospitality", "Government", "Education", "Other"];

// Defined OUTSIDE the main component so they are stable across renders
// (defining them inside causes inputs to remount on every keystroke → lost focus).
const SectionShell = ({
  title,
  enabled,
  onToggle,
  children,
}: {
  title: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  children?: React.ReactNode;
}) => (
  <div className="rounded-md border bg-card">
    <label className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none">
      <Checkbox checked={enabled} onCheckedChange={(v) => onToggle(!!v)} />
      <span className="text-sm font-semibold text-foreground">{title}</span>
    </label>
    {enabled && children && (
      <div className="border-t px-4 py-4">{children}</div>
    )}
  </div>
);

const Row = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
  <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] items-start gap-2 sm:gap-4 py-1.5">
    <Label className="text-sm text-muted-foreground sm:text-right sm:pt-2.5">
      {label} {required && <span className="text-destructive">*</span>}
    </Label>
    <div>{children}</div>
  </div>
);



const ConvertLeadDialog = ({ workspaceId, lead, open, onOpenChange, onDone }: Props) => {
  // Section toggles (Vtiger-style: all three default ON)
  const [doOrg, setDoOrg] = useState(true);
  const [doContact, setDoContact] = useState(true);
  const [doService, setDoService] = useState(false);
  const [doOpp, setDoOpp] = useState(true);

  // Existing contact match (by email) — Vtiger-style merge prompt
  const [existingContactId, setExistingContactId] = useState<string | null>(null);
  const [existingContactName, setExistingContactName] = useState<string | null>(null);

  // Organization
  const [org, setOrg] = useState({
    name: "",
    industry: "",
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
  const [transferTo, setTransferTo] = useState<"organization" | "contact">("contact");

  const [members, setMembers] = useState<Member[]>([]);
  const [saving, setSaving] = useState(false);

  // Bootstrap form from the lead
  useEffect(() => {
    if (!open || !lead) return;
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
      industry: "",
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
    setDoService(false);
    setDoOpp(false);
    setTransferTo("contact");
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

  const canSave = useMemo(() => {
    if (doOrg && !useExistingOrgId && !org.name.trim()) return false;
    if (doContact && !contact.firstName.trim()) return false;
    if (doOpp && !opp.name.trim()) return false;
    if (!assignedTo) return false;
    return true;
  }, [doOrg, useExistingOrgId, org.name, doContact, contact.firstName, doOpp, opp.name, assignedTo]);

  const handleConvert = async () => {
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
              street: org.street || null,
              city: org.city || null,
              state: org.state || null,
              pincode: org.pincode || null,
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
      if (doService) {
        const composedNotes = [
          `Service: ${service.type}`,
          service.title ? `Title: ${service.title}` : "",
          `Priority: ${service.priority}`,
          service.notes ? `Notes: ${service.notes}` : "",
        ].filter(Boolean).join("\n");
        await supabase
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
          });
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
          })
          .select("id")
          .single();
        if (dErr) throw dErr;
        deal_id = d.id;
      }

      // 5) Activity entry on the transferred record
      try {
        await supabase.from("crm_activities").insert({
          workspace_id: workspaceId,
          activity_type: "note",
          subject: `Lead converted: ${lead.full_name}`,
          description: `Converted from lead. Transferred to: ${transferTo}.`,
          status: "done",
          assigned_to: assignedTo || uid,
          lead_id: lead.id,
          contact_id: transferTo === "contact" ? contact_id : null,
          organization_id: transferTo === "organization" ? organization_id : null,
          deal_id: null,
          created_by: uid,
        });
      } catch { /* non-fatal */ }

      // 6) Mark lead converted
      await supabase
        .from("crm_leads")
        .update({ stage: "qualified", status: "converted" })
        .eq("id", lead.id);

      toast.success("Lead converted successfully");
      onOpenChange(false);
      onDone?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Conversion failed");
    } finally {
      setSaving(false);
    }
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92dvh] overflow-hidden flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b bg-slate-600 text-white rounded-t-lg">
          <DialogTitle className="flex items-center gap-2 text-base text-white">
            <ArrowRightLeft className="h-5 w-5" />
            Convert Lead — {lead?.full_name || ""}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Convert this lead into an Organization, Contact, Service Request and/or Opportunity.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 bg-muted/20">
          {/* Create Organization */}
          <SectionShell title="Create Organization" enabled={doOrg} onToggle={setDoOrg}>
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
                  onClick={() => setUseExistingOrgId(null)}
                >
                  Change
                </Button>
              </div>
            ) : (
              <div className="space-y-1">
                <Row label="Organization Name" required>
                  <div className="relative">
                    <Input
                      value={org.name}
                      onChange={(e) => setOrg({ ...org, name: e.target.value })}
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
                  </div>
                  {existingOrg && (
                    <div className="mt-2 flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-2.5 text-xs">
                      <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <div className="font-medium text-amber-700 dark:text-amber-400">Existing organization found.</div>
                        <div className="text-muted-foreground">
                          {existingOrg.name} — {[existingOrg.industry, existingOrg.city, existingOrg.state].filter(Boolean).join(", ") || "no details"}
                        </div>
                        <Button size="sm" variant="default" className="mt-2 h-7" onClick={() => setUseExistingOrgId(existingOrg.id)}>
                          Use Existing Organization
                        </Button>
                      </div>
                    </div>
                  )}
                </Row>
                <Row label="Industry">
                  <Select value={org.industry} onValueChange={(v) => setOrg({ ...org, industry: v })}>
                    <SelectTrigger><SelectValue placeholder="Select an Option" /></SelectTrigger>
                    <SelectContent>{INDUSTRIES.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                  </Select>
                </Row>
              </div>
            )}
          </SectionShell>

          {/* Create Contact */}
          <SectionShell title="Create Contact" enabled={doContact} onToggle={setDoContact}>
            <div className="space-y-1">
              <Row label="First Name" required>
                <Input value={contact.firstName} onChange={(e) => setContact({ ...contact, firstName: e.target.value })} />
              </Row>
              <Row label="Last Name">
                <Input value={contact.lastName} onChange={(e) => setContact({ ...contact, lastName: e.target.value })} />
              </Row>
              <Row label="Designation">
                <Input value={contact.designation} onChange={(e) => setContact({ ...contact, designation: e.target.value })} />
              </Row>
              <Row label="Mobile">
                <Input value={contact.mobile} onChange={(e) => setContact({ ...contact, mobile: e.target.value })} />
              </Row>
              <Row label="Email">
                <Input type="email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} />
              </Row>
            </div>
          </SectionShell>


          {/* Create Opportunity */}
          <SectionShell title="Create Opportunity" enabled={doOpp} onToggle={setDoOpp}>
            <div className="space-y-1">
              <Row label="Opportunity Name" required>
                <Input value={opp.name} onChange={(e) => setOpp({ ...opp, name: e.target.value })} />
              </Row>
              <Row label="Amount (INR)">
                <Input type="number" value={opp.amount} onChange={(e) => setOpp({ ...opp, amount: e.target.value })} />
              </Row>
              <Row label="Close Date">
                <Input type="date" value={opp.closeDate} onChange={(e) => setOpp({ ...opp, closeDate: e.target.value })} />
              </Row>
              <Row label="Stage">
                <Select value={opp.stage} onValueChange={(v) => setOpp({ ...opp, stage: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STAGES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
              </Row>
            </div>
          </SectionShell>

          {/* Assignment + Transfer */}
          <div className="rounded-md border bg-card px-4 py-4 space-y-1">
            <Row label="Assigned To" required>
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
            </Row>
            <Row label="Transfer related record to">
              <RadioGroup
                value={transferTo}
                onValueChange={(v: any) => setTransferTo(v)}
                className="flex items-center gap-6 pt-2"
              >
                <label className={cn("flex items-center gap-2 cursor-pointer", !doOrg && !useExistingOrgId && "opacity-40 cursor-not-allowed")}>
                  <RadioGroupItem value="organization" disabled={!doOrg && !useExistingOrgId} />
                  <span className="text-sm">Organization</span>
                </label>
                <label className={cn("flex items-center gap-2 cursor-pointer", !doContact && "opacity-40 cursor-not-allowed")}>
                  <RadioGroupItem value="contact" disabled={!doContact} />
                  <span className="text-sm">Contact</span>
                </label>
              </RadioGroup>
            </Row>
          </div>
        </div>

        <DialogFooter className="px-6 py-3 border-t bg-muted/40 sm:justify-center gap-3">
          <Button
            onClick={handleConvert}
            disabled={!canSave || saving}
            className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[100px]"
          >
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Save
          </Button>
          <Button
            variant="link"
            onClick={() => onOpenChange(false)}
            disabled={saving}
            className="text-destructive"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConvertLeadDialog;

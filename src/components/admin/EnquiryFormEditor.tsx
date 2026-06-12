import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, Save, Eye, Users, ChevronDown } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import EnquiryForm from "@/components/EnquiryForm";
import {
  DEFAULT_LABELS,
  DEFAULT_PLACEHOLDERS,
  DEFAULT_LEAD_FIELDS,
  DEFAULT_ADD_LEAD_DIALOG,
  DEFAULT_ADD_LEAD_SECTIONS,
  DEFAULT_ADD_LEAD_FIELDS,
  ADD_LEAD_FIELDS_BY_SECTION,
  type EnquiryFormConfig,
  type EnquiryLabelKey,
  type LeadDialogFieldKey,
  type AddLeadDialogConfig,
  type AddLeadSectionKey,
  type AddLeadFieldKey,
} from "@/hooks/useEnquiryFormConfig";

type FieldKey =
  | "firstName"
  | "phoneNumber"
  | "expectedClose"
  | "distance"
  | "scans"
  | "areaType"
  | "getLocation";

type FieldCfg = { visible: boolean; required: boolean };

type RoutingKey =
  | "Maharashtra"
  | "Telangana"
  | "AndhraPradesh"
  | "Karnataka"
  | "OtherIndia"
  | "OtherCountry";

type EnquiryFormCfg = {
  intro: string;
  thank_you: string;
  fields: Record<FieldKey, FieldCfg>;
  labels: Record<EnquiryLabelKey, string>;
  placeholders: Partial<Record<EnquiryLabelKey, string>>;
  leadFields: Record<LeadDialogFieldKey, FieldCfg>;
  addLeadDialog: AddLeadDialogConfig;
  routing: Record<RoutingKey, string>;
  routing_assignees: Record<RoutingKey, string[]>;
};

const DEFAULT_CFG: EnquiryFormCfg = {
  intro: "Tell us about your project and we will get back to you shortly.",
  thank_you: "Thank you! Our team will contact you soon.",
  fields: {
    firstName:     { visible: true, required: false },
    phoneNumber:   { visible: true, required: false },
    expectedClose: { visible: true, required: true },
    distance:      { visible: true, required: true },
    scans:         { visible: true, required: true },
    areaType:      { visible: true, required: true },
    getLocation:   { visible: true, required: false },
  },
  labels: DEFAULT_LABELS,
  placeholders: DEFAULT_PLACEHOLDERS,
  leadFields: DEFAULT_LEAD_FIELDS,
  routing: {
    Maharashtra:   "mh",
    Telangana:     "hyd",
    AndhraPradesh: "hyd",
    Karnataka:     "blr",
    OtherIndia:    "mh",
    OtherCountry:  "others",
  },
  routing_assignees: {
    Maharashtra: [],
    Telangana: [],
    AndhraPradesh: [],
    Karnataka: [],
    OtherIndia: [],
    OtherCountry: [],
  },
};

const FIELD_LABELS: Record<FieldKey, string> = {
  firstName: "First Name",
  phoneNumber: "Secondary Phone Number",
  expectedClose: "Expected Close Date",
  distance: "Distance",
  scans: "Number of Scans",
  areaType: "Area Type",
  getLocation: "Get My Location button",
};

const LEAD_FIELD_LABELS: Record<LeadDialogFieldKey, string> = {
  email: "Email",
  phone: "Phone",
  city: "City",
  state: "State",
  serviceNeeded: "Service Needed",
  notes: "Notes",
};

const ROUTING_LABELS: Record<RoutingKey, string> = {
  Maharashtra: "Maharashtra",
  Telangana: "Telangana",
  AndhraPradesh: "Andhra Pradesh",
  Karnataka: "Karnataka",
  OtherIndia: "Other Indian States",
  OtherCountry: "Outside India",
};

const LABEL_SECTIONS: { key: EnquiryLabelKey; hint?: string }[] = [
  { key: "fullName", hint: "Add Lead dialog" },
  { key: "firstName" },
  { key: "lastName" },
  { key: "email" },
  { key: "expectedClose" },
  { key: "whatsapp" },
  { key: "phoneNumber" },
  { key: "getLocation", hint: "Button text" },
  { key: "bizArea" },
  { key: "distance" },
  { key: "service" },
  { key: "scans" },
  { key: "areaType" },
  { key: "totalArea" },
  { key: "description" },
  { key: "mailingStreet" },
  { key: "mailingCity" },
  { key: "mailingState" },
  { key: "pinCode" },
  { key: "submit", hint: "Button text" },
];

type Workspace = { id: string; slug: string; name: string };
type StaffUser = {
  user_id: string;
  full_name: string | null;
  username: string | null;
  role: string;
};

const EnquiryFormEditor = () => {
  const [cfg, setCfg] = useState<EnquiryFormCfg>(DEFAULT_CFG);
  const [rowId, setRowId] = useState<string | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data: row }, { data: ws }, { data: roles }] = await Promise.all([
        supabase.from("site_content").select("id, metadata").eq("section_key", "enquiry_form").maybeSingle(),
        supabase.from("crm_workspaces").select("id, slug, name").eq("is_active", true).order("name"),
        supabase
          .from("user_roles")
          .select("user_id, role")
          .in("role", ["super_admin", "admin", "employee", "crm_admin"] as any),
      ]);

      const userIds = Array.from(new Set((roles || []).map((r: any) => r.user_id)));
      let profiles: any[] = [];
      if (userIds.length) {
        const { data: pr } = await supabase
          .from("profiles")
          .select("user_id, full_name, username")
          .in("user_id", userIds);
        profiles = pr || [];
      }
      const profByUser = new Map(profiles.map((p) => [p.user_id, p]));
      const staffList: StaffUser[] = (roles || []).map((r: any) => ({
        user_id: r.user_id,
        role: r.role,
        full_name: profByUser.get(r.user_id)?.full_name ?? null,
        username: profByUser.get(r.user_id)?.username ?? null,
      }));
      const order = ["super_admin", "admin", "crm_admin", "employee"];
      const byUser = new Map<string, StaffUser>();
      for (const s of staffList) {
        const ex = byUser.get(s.user_id);
        if (!ex || order.indexOf(s.role) < order.indexOf(ex.role)) byUser.set(s.user_id, s);
      }
      setStaff(Array.from(byUser.values()).sort((a, b) => (a.full_name || a.username || "").localeCompare(b.full_name || b.username || "")));

      if (row) {
        setRowId(row.id);
        const meta = (row.metadata as Partial<EnquiryFormCfg>) || {};
        setCfg({
          intro: meta.intro ?? DEFAULT_CFG.intro,
          thank_you: meta.thank_you ?? DEFAULT_CFG.thank_you,
          fields: { ...DEFAULT_CFG.fields, ...(meta.fields || {}) } as Record<FieldKey, FieldCfg>,
          labels: { ...DEFAULT_LABELS, ...(meta.labels || {}) } as Record<EnquiryLabelKey, string>,
          placeholders: { ...DEFAULT_PLACEHOLDERS, ...(meta.placeholders || {}) },
          leadFields: { ...DEFAULT_LEAD_FIELDS, ...(meta.leadFields || {}) } as Record<LeadDialogFieldKey, FieldCfg>,
          routing: { ...DEFAULT_CFG.routing, ...(meta.routing || {}) } as Record<RoutingKey, string>,
          routing_assignees: { ...DEFAULT_CFG.routing_assignees, ...(meta.routing_assignees || {}) } as Record<RoutingKey, string[]>,
        });
      }
      setWorkspaces((ws as Workspace[]) || []);
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    const payload = {
      section_key: "enquiry_form",
      title: "Enquiry Form",
      content: "Public enquiry form configuration",
      metadata: cfg as any,
      updated_at: new Date().toISOString(),
    };
    const { error } = rowId
      ? await supabase.from("site_content").update(payload).eq("id", rowId)
      : await supabase.from("site_content").insert(payload);
    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Saved", description: "Enquiry form settings updated." });
  };

  const previewCfg: EnquiryFormConfig = useMemo(
    () => ({
      intro: cfg.intro,
      thank_you: cfg.thank_you,
      fields: cfg.fields,
      labels: cfg.labels,
      placeholders: cfg.placeholders,
      leadFields: cfg.leadFields,
    }),
    [cfg.intro, cfg.thank_you, cfg.fields, cfg.labels, cfg.placeholders, cfg.leadFields]
  );

  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin inline mr-2" /> Loading…
      </div>
    );
  }

  const setField = (key: FieldKey, patch: Partial<FieldCfg>) =>
    setCfg((c) => ({ ...c, fields: { ...c.fields, [key]: { ...c.fields[key], ...patch } } }));

  const setLeadField = (key: LeadDialogFieldKey, patch: Partial<FieldCfg>) =>
    setCfg((c) => ({ ...c, leadFields: { ...c.leadFields, [key]: { ...c.leadFields[key], ...patch } } }));

  const setRouting = (key: RoutingKey, slug: string) =>
    setCfg((c) => ({ ...c, routing: { ...c.routing, [key]: slug } }));

  const setLabel = (key: EnquiryLabelKey, value: string) =>
    setCfg((c) => ({ ...c, labels: { ...c.labels, [key]: value } }));

  const setPlaceholder = (key: EnquiryLabelKey, value: string) =>
    setCfg((c) => ({ ...c, placeholders: { ...c.placeholders, [key]: value } }));

  const toggleAssignee = (key: RoutingKey, userId: string) =>
    setCfg((c) => {
      const cur = c.routing_assignees[key] || [];
      const next = cur.includes(userId) ? cur.filter((u) => u !== userId) : [...cur, userId];
      return { ...c, routing_assignees: { ...c.routing_assignees, [key]: next } };
    });

  const staffLabel = (s: StaffUser) =>
    `${s.full_name || s.username || s.user_id.slice(0, 8)} · ${s.role.replace("_", " ")}`;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,420px)] gap-6">
      <div className="space-y-6 min-w-0">
        <Card className="p-5 space-y-4">
          <h3 className="font-semibold">Messages</h3>
          <div className="space-y-2">
            <Label>Intro text (shown above the form)</Label>
            <Textarea rows={2} value={cfg.intro} onChange={(e) => setCfg({ ...cfg, intro: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Thank-you message (shown after submission)</Label>
            <Textarea rows={2} value={cfg.thank_you} onChange={(e) => setCfg({ ...cfg, thank_you: e.target.value })} />
          </div>
        </Card>

        <Card className="p-5 space-y-4">
          <div>
            <h3 className="font-semibold">Field labels &amp; placeholders</h3>
            <p className="text-xs text-muted-foreground">Rename labels and customize input placeholders. Used by the public enquiry form and the CRM Add Lead dialog.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {LABEL_SECTIONS.map(({ key, hint }) => (
              <div key={key} className="space-y-2 rounded-md border border-border/50 p-3">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {key} {hint && <span className="normal-case font-normal">({hint})</span>}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Label</Label>
                  <Input
                    value={cfg.labels[key] ?? ""}
                    onChange={(e) => setLabel(key, e.target.value)}
                    placeholder={DEFAULT_LABELS[key]}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Placeholder</Label>
                  <Input
                    value={cfg.placeholders[key] ?? ""}
                    onChange={(e) => setPlaceholder(key, e.target.value)}
                    placeholder={DEFAULT_PLACEHOLDERS[key] ?? "Input placeholder…"}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 space-y-4">
          <div>
            <h3 className="font-semibold">Optional fields — Public enquiry form</h3>
            <p className="text-xs text-muted-foreground">Toggle which optional fields appear on the public form.</p>
          </div>
          <div className="divide-y">
            {(Object.keys(FIELD_LABELS) as FieldKey[]).map((k) => (
              <div key={k} className="flex items-center justify-between py-3 gap-4">
                <div className="text-sm font-medium">{FIELD_LABELS[k]}</div>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 text-xs">
                    <Switch checked={cfg.fields[k].visible} onCheckedChange={(v) => setField(k, { visible: v })} />
                    Visible
                  </label>
                  <label className="flex items-center gap-2 text-xs">
                    <Switch
                      checked={cfg.fields[k].required}
                      onCheckedChange={(v) => setField(k, { required: v })}
                      disabled={!cfg.fields[k].visible}
                    />
                    Required
                  </label>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 space-y-4">
          <div>
            <h3 className="font-semibold">Optional fields — CRM Add Lead dialog</h3>
            <p className="text-xs text-muted-foreground">Choose which fields appear in the in-CRM "Add Lead" dialog. Full Name is always required.</p>
          </div>
          <div className="divide-y">
            {(Object.keys(LEAD_FIELD_LABELS) as LeadDialogFieldKey[]).map((k) => (
              <div key={k} className="flex items-center justify-between py-3 gap-4">
                <div className="text-sm font-medium">{LEAD_FIELD_LABELS[k]}</div>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 text-xs">
                    <Switch checked={cfg.leadFields[k].visible} onCheckedChange={(v) => setLeadField(k, { visible: v })} />
                    Visible
                  </label>
                  <label className="flex items-center gap-2 text-xs">
                    <Switch
                      checked={cfg.leadFields[k].required}
                      onCheckedChange={(v) => setLeadField(k, { required: v })}
                      disabled={!cfg.leadFields[k].visible}
                    />
                    Required
                  </label>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 space-y-4">
          <div>
            <h3 className="font-semibold">CRM routing by state</h3>
            <p className="text-xs text-muted-foreground">
              Pick which CRM workspace receives leads from each region, and which staff (employees + super admins) get notified.
            </p>
          </div>
          <div className="space-y-4">
            {(Object.keys(ROUTING_LABELS) as RoutingKey[]).map((k) => {
              const assignees = cfg.routing_assignees[k] || [];
              return (
                <div key={k} className="rounded-lg border border-border/60 p-3 space-y-3">
                  <div className="font-medium text-sm">{ROUTING_LABELS[k]}</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">CRM workspace</Label>
                      <Select value={cfg.routing[k]} onValueChange={(v) => setRouting(k, v)}>
                        <SelectTrigger><SelectValue placeholder="Select CRM workspace" /></SelectTrigger>
                        <SelectContent>
                          {workspaces.map((w) => (
                            <SelectItem key={w.slug} value={w.slug}>{w.name} ({w.slug})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Assignees (employees & super admins)</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-between font-normal">
                            <span className="flex items-center gap-2 truncate">
                              <Users className="h-3.5 w-3.5" />
                              {assignees.length ? `${assignees.length} selected` : "Select staff"}
                            </span>
                            <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-72 p-0" align="start">
                          <ScrollArea className="h-64 p-2">
                            {staff.length === 0 ? (
                              <div className="text-xs text-muted-foreground p-3">No staff found.</div>
                            ) : staff.map((s) => {
                              const checked = assignees.includes(s.user_id);
                              return (
                                <label
                                  key={s.user_id}
                                  className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer text-xs"
                                >
                                  <Checkbox
                                    checked={checked}
                                    onCheckedChange={() => toggleAssignee(k, s.user_id)}
                                  />
                                  <span className="truncate">{staffLabel(s)}</span>
                                </label>
                              );
                            })}
                          </ScrollArea>
                        </PopoverContent>
                      </Popover>
                      {assignees.length > 0 && (
                        <div className="text-[10px] text-muted-foreground truncate">
                          {assignees.map((id) => {
                            const s = staff.find((x) => x.user_id === id);
                            return s ? (s.full_name || s.username || id.slice(0, 6)) : id.slice(0, 6);
                          }).join(", ")}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <div className="flex justify-end">
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save changes
          </Button>
        </div>
      </div>

      <div className="xl:sticky xl:top-24 xl:self-start min-w-0">
        <Card className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">Live preview</h3>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground ml-auto">Unsaved changes shown</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Reflects the editor state above. Submission is disabled in this preview.
          </p>
          <div className="rounded-xl border border-border bg-card/40 p-3">
            <EnquiryForm
              serviceTitle="General Enquiry"
              onSuccess={() => { /* preview */ }}
              configOverride={previewCfg}
              previewMode
            />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default EnquiryFormEditor;

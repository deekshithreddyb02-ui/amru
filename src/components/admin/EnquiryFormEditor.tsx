import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, Save, Eye } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import EnquiryForm from "@/components/EnquiryForm";
import type { EnquiryFormConfig } from "@/hooks/useEnquiryFormConfig";

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
  routing: Record<RoutingKey, string>;
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
  routing: {
    Maharashtra:   "mh",
    Telangana:     "hyd",
    AndhraPradesh: "hyd",
    Karnataka:     "blr",
    OtherIndia:    "mh",
    OtherCountry:  "others",
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

const ROUTING_LABELS: Record<RoutingKey, string> = {
  Maharashtra: "Maharashtra",
  Telangana: "Telangana",
  AndhraPradesh: "Andhra Pradesh",
  Karnataka: "Karnataka",
  OtherIndia: "Other Indian States",
  OtherCountry: "Outside India",
};

type Workspace = { id: string; slug: string; name: string };

const EnquiryFormEditor = () => {
  const [cfg, setCfg] = useState<EnquiryFormCfg>(DEFAULT_CFG);
  const [rowId, setRowId] = useState<string | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data: row }, { data: ws }] = await Promise.all([
        supabase.from("site_content").select("id, metadata").eq("section_key", "enquiry_form").maybeSingle(),
        supabase.from("crm_workspaces").select("id, slug, name").eq("is_active", true).order("name"),
      ]);
      if (row) {
        setRowId(row.id);
        const meta = (row.metadata as Partial<EnquiryFormCfg>) || {};
        setCfg({
          intro: meta.intro ?? DEFAULT_CFG.intro,
          thank_you: meta.thank_you ?? DEFAULT_CFG.thank_you,
          fields: { ...DEFAULT_CFG.fields, ...(meta.fields || {}) } as Record<FieldKey, FieldCfg>,
          routing: { ...DEFAULT_CFG.routing, ...(meta.routing || {}) } as Record<RoutingKey, string>,
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

  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin inline mr-2" /> Loading…
      </div>
    );
  }

  const setField = (key: FieldKey, patch: Partial<FieldCfg>) =>
    setCfg((c) => ({ ...c, fields: { ...c.fields, [key]: { ...c.fields[key], ...patch } } }));

  const setRouting = (key: RoutingKey, slug: string) =>
    setCfg((c) => ({ ...c, routing: { ...c.routing, [key]: slug } }));

  return (
    <div className="space-y-6">
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
          <h3 className="font-semibold">Optional fields</h3>
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
          <h3 className="font-semibold">CRM routing by state</h3>
          <p className="text-xs text-muted-foreground">
            Pick which CRM workspace receives leads from each region. Used when an enquiry comes in.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(Object.keys(ROUTING_LABELS) as RoutingKey[]).map((k) => (
            <div key={k} className="space-y-1.5">
              <Label>{ROUTING_LABELS[k]}</Label>
              <Select value={cfg.routing[k]} onValueChange={(v) => setRouting(k, v)}>
                <SelectTrigger><SelectValue placeholder="Select CRM workspace" /></SelectTrigger>
                <SelectContent>
                  {workspaces.map((w) => (
                    <SelectItem key={w.slug} value={w.slug}>{w.name} ({w.slug})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save changes
        </Button>
      </div>
    </div>
  );
};

export default EnquiryFormEditor;

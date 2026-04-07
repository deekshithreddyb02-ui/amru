import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { sanitizeError } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Loader2, Save, ExternalLink, Settings2 } from "lucide-react";

export interface FieldMappings {
  lastname: string;
  expected_close: string;
  whatsapp: string;
  biz_area: string;
  distance: string;
  service_needed: string;
  num_scans: string;
  area_type: string;
  total_area: string;
  biz_cost: string;
  description: string;
  mailing_street: string;
  mailing_city: string;
  mailing_pincode: string;
}

export const DEFAULT_FIELD_MAPPINGS: FieldMappings = {
  lastname: "lastname",
  expected_close: "cf_1044",
  whatsapp: "cf_1022",
  biz_area: "cf_990",
  distance: "cf_998",
  service_needed: "cf_994",
  num_scans: "cf_1014",
  area_type: "cf_1002",
  total_area: "cf_1006",
  biz_cost: "cf_1020",
  description: "description",
  mailing_street: "mailingstreet",
  mailing_city: "mailingcity",
  mailing_pincode: "mailingpobox",
};

const FIELD_LABELS: Record<keyof FieldMappings, string> = {
  lastname: "Last Name",
  expected_close: "Expected Close Date",
  whatsapp: "WhatsApp Number",
  biz_area: "BIZ Area",
  distance: "Distance",
  service_needed: "Service Needed",
  num_scans: "Number of Scans",
  area_type: "Area Type",
  total_area: "Total Area",
  biz_cost: "Total BIZ Cost",
  description: "Description",
  mailing_street: "Mailing Street",
  mailing_city: "Mailing City",
  mailing_pincode: "Mailing PIN Code",
};

export interface CrmConfig {
  label: string;
  state_key: string;
  crm_url: string;
  token: string;
  public_id: string;
  form_name: string;
  enabled: boolean;
  field_mappings?: FieldMappings;
}

interface LeadRouting {
  store_in_db: boolean;
  send_to_crm: boolean;
}

const STATE_SLOTS = [
  { label: "Maharashtra", state_key: "maharashtra" },
  { label: "Telangana", state_key: "telangana" },
  { label: "Andhra Pradesh", state_key: "andhrapradesh" },
  { label: "Karnataka", state_key: "karnataka" },
  { label: "Others", state_key: "others" },
];

const DEFAULT_CRMS: CrmConfig[] = STATE_SLOTS.map((s, i) => ({
  label: s.label,
  state_key: s.state_key,
  crm_url: i === 1 ? "https://appscomsolutions.com/VTCRM/modules/Webforms/capture.php" : "",
  token: i === 1 ? "sid:c13e250974b2e7ea0ef70de7fecdcc0cc6191ec5,1773737516" : "",
  public_id: i === 1 ? "85432a838b51f53a6bc4ec937b64ee40" : "",
  form_name: i === 1 ? "Enquiry Form: Telangana - Amruta HydroGeo Services" : "",
  enabled: i === 1,
  field_mappings: { ...DEFAULT_FIELD_MAPPINGS },
}));

const CrmSettingsEditor = () => {
  const { toast } = useToast();
  const [crms, setCrms] = useState<CrmConfig[]>(DEFAULT_CRMS);
  const [routing, setRouting] = useState<LeadRouting>({ store_in_db: true, send_to_crm: true });
  const [recaptchaSiteKey, setRecaptchaSiteKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data, error } = await (supabase as any)
          .from("site_settings")
          .select("value")
          .eq("key", "crm_settings")
          .maybeSingle();
        if (!error && data?.value) {
          const v = data.value as any;
          if (v.routing) {
            setRouting({
              store_in_db: v.routing.store_in_db !== false,
              send_to_crm: v.routing.send_to_crm !== false,
            });
          }
          if (v.recaptcha_site_key) setRecaptchaSiteKey(v.recaptcha_site_key);
          if (Array.isArray(v.crms)) {
            const loaded = v.crms as CrmConfig[];
            const merged = STATE_SLOTS.map((slot) => {
              const existing = loaded.find(
                (c) => c.state_key === slot.state_key || c.label?.toLowerCase() === slot.label.toLowerCase()
              );
              if (existing) {
                return {
                  ...existing,
                  state_key: slot.state_key,
                  field_mappings: existing.field_mappings ? { ...DEFAULT_FIELD_MAPPINGS, ...existing.field_mappings } : { ...DEFAULT_FIELD_MAPPINGS },
                };
              }
              return { ...DEFAULT_CRMS.find((d) => d.state_key === slot.state_key)! };
            });
            setCrms(merged);
          } else if (v.crm_url) {
            const migrated = [...DEFAULT_CRMS];
            migrated[1] = {
              ...migrated[1],
              crm_url: v.crm_url,
              token: v.token || migrated[1].token,
              public_id: v.public_id || migrated[1].public_id,
              form_name: v.form_name || migrated[1].form_name,
              enabled: true,
            };
            setCrms(migrated);
          }
        }
      } catch { /* defaults */ }
      setLoading(false);
    };
    load();
  }, []);

  const updateCrm = (index: number, patch: Partial<CrmConfig>) => {
    setCrms((prev) => prev.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  };

  const updateFieldMapping = (index: number, field: keyof FieldMappings, value: string) => {
    setCrms((prev) => prev.map((c, i) => {
      if (i !== index) return c;
      const fm = c.field_mappings || { ...DEFAULT_FIELD_MAPPINGS };
      return { ...c, field_mappings: { ...fm, [field]: value } };
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const value = { crms, routing, recaptcha_site_key: recaptchaSiteKey };
      const { data: existing } = await (supabase as any)
        .from("site_settings")
        .select("id")
        .eq("key", "crm_settings")
        .maybeSingle();

      if (existing) {
        const { error } = await (supabase as any)
          .from("site_settings")
          .update({ value, updated_at: new Date().toISOString() })
          .eq("key", "crm_settings");
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from("site_settings")
          .insert({ key: "crm_settings", value });
        if (error) throw error;
      }
      toast({ title: "Success", description: "CRM settings saved" });
    } catch (error: any) {
      toast({ title: "Error", description: sanitizeError(error), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <ExternalLink className="w-5 h-5 text-primary" />
          CRM Integration Settings (State-wise)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          Each CRM slot is mapped to a state. When a user submits the enquiry form, the form is routed to the CRM matching their detected state (via GPS). If the matched CRM is disabled or not configured, the submission goes to the <strong>"Others"</strong> CRM as fallback.
        </p>

        <Card className="bg-muted/30 border-border/50">
          <CardContent className="pt-4 space-y-3">
            <p className="text-xs font-semibold text-foreground">Lead Routing Control</p>
            <p className="text-[10px] text-muted-foreground">Choose where enquiry submissions are sent. You can enable both, one, or neither.</p>
            <div className="flex items-center gap-3">
              <Switch checked={routing.store_in_db} onCheckedChange={(v) => setRouting((r) => ({ ...r, store_in_db: v }))} />
              <Label className="text-sm">Save leads in database (visible in Admin Leads)</Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={routing.send_to_crm} onCheckedChange={(v) => setRouting((r) => ({ ...r, send_to_crm: v }))} />
              <Label className="text-sm">Send leads to CRM (Vtiger web form)</Label>
            </div>
            {!routing.store_in_db && !routing.send_to_crm && (
              <p className="text-[11px] text-destructive font-medium">⚠ Both options are disabled — enquiry submissions will be silently discarded.</p>
            )}
          </CardContent>
        </Card>

        {/* reCAPTCHA Settings */}
        <Card className="bg-muted/30 border-border/50">
          <CardContent className="pt-4 space-y-3">
            <p className="text-xs font-semibold text-foreground">Google reCAPTCHA v2 Settings</p>
            <p className="text-[10px] text-muted-foreground">Enter the reCAPTCHA v2 site key to display the "I am not a robot" checkbox on enquiry forms. Leave empty to disable reCAPTCHA.</p>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">reCAPTCHA Site Key</Label>
              <Input value={recaptchaSiteKey} onChange={(e) => setRecaptchaSiteKey(e.target.value)} placeholder="6LcXXXX..." />
            </div>
          </CardContent>
        </Card>

        <Accordion type="multiple" className="space-y-2">
          {crms.map((crm, i) => (
            <AccordionItem key={i} value={`crm-${i}`} className="border rounded-lg px-4">
              <AccordionTrigger className="py-3 hover:no-underline">
                <div className="flex items-center gap-3 w-full">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${crm.enabled ? "bg-green-500" : "bg-muted-foreground/30"}`} />
                  <span className="font-medium text-sm">{crm.label}</span>
                  <span className="text-[10px] text-muted-foreground ml-1">({crm.state_key})</span>
                  {crm.enabled && <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full ml-auto mr-4">Active</span>}
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pb-4">
                <div className="flex items-center gap-3">
                  <Switch checked={crm.enabled} onCheckedChange={(v) => updateCrm(i, { enabled: v })} />
                  <Label className="text-sm">Enable this CRM</Label>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Display Label</Label>
                  <Input value={crm.label} onChange={(e) => updateCrm(i, { label: e.target.value })} placeholder="e.g. Telangana CRM" />
                  <p className="text-[10px] text-muted-foreground">Display name only. State routing uses the fixed state key: <code>{crm.state_key}</code></p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">CRM Web Form URL</Label>
                  <Input value={crm.crm_url} onChange={(e) => updateCrm(i, { crm_url: e.target.value })} placeholder="https://..." />
                  <p className="text-[10px] text-muted-foreground">The Vtiger capture.php endpoint</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Web Form Token (__vtrftk)</Label>
                  <Input value={crm.token} onChange={(e) => updateCrm(i, { token: e.target.value })} placeholder="sid:..." />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Public ID</Label>
                  <Input value={crm.public_id} onChange={(e) => updateCrm(i, { public_id: e.target.value })} placeholder="85432a..." />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Form Name</Label>
                  <Input value={crm.form_name} onChange={(e) => updateCrm(i, { form_name: e.target.value })} placeholder="Enquiry Form: ..." />
                </div>

                {/* Per-CRM Field Mappings */}
                <Accordion type="single" collapsible>
                  <AccordionItem value="fields" className="border rounded-md bg-muted/20">
                    <AccordionTrigger className="px-3 py-2 hover:no-underline">
                      <div className="flex items-center gap-2">
                        <Settings2 className="w-3.5 h-3.5 text-primary" />
                        <span className="text-xs font-medium">CRM Field ID Mappings</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-3 pb-3 space-y-2">
                      <p className="text-[10px] text-muted-foreground mb-2">
                        Map each form field to the corresponding Vtiger custom field ID. Each CRM can have different field IDs (e.g., cf_1022 for Telangana, cf_2022 for Maharashtra).
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {(Object.keys(FIELD_LABELS) as (keyof FieldMappings)[]).map((field) => (
                          <div key={field} className="space-y-0.5">
                            <Label className="text-[10px] text-muted-foreground">{FIELD_LABELS[field]}</Label>
                            <Input
                              value={crm.field_mappings?.[field] ?? DEFAULT_FIELD_MAPPINGS[field]}
                              onChange={(e) => updateFieldMapping(i, field, e.target.value)}
                              placeholder={DEFAULT_FIELD_MAPPINGS[field]}
                              className="h-7 text-xs"
                            />
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <Button onClick={handleSave} disabled={saving} className="gap-2 w-full">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save All CRM Settings
        </Button>
      </CardContent>
    </Card>
  );
};

export default CrmSettingsEditor;

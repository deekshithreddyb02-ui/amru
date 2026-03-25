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
import { Loader2, Save, ExternalLink, Plus } from "lucide-react";

interface CrmConfig {
  label: string;
  crm_url: string;
  token: string;
  public_id: string;
  form_name: string;
  enabled: boolean;
}

const EMPTY_CRM: CrmConfig = {
  label: "",
  crm_url: "",
  token: "",
  public_id: "",
  form_name: "",
  enabled: false,
};

const DEFAULT_CRMS: CrmConfig[] = [
  {
    label: "Telangana",
    crm_url: "https://appscomsolutions.com/VTCRM/modules/Webforms/capture.php",
    token: "sid:c13e250974b2e7ea0ef70de7fecdcc0cc6191ec5,1773737516",
    public_id: "85432a838b51f53a6bc4ec937b64ee40",
    form_name: "Enquiry Form: Telangana - Amruta HydroGeo Services",
    enabled: true,
  },
  { ...EMPTY_CRM, label: "CRM 2" },
  { ...EMPTY_CRM, label: "CRM 3" },
  { ...EMPTY_CRM, label: "CRM 4" },
  { ...EMPTY_CRM, label: "CRM 5" },
];

const CrmSettingsEditor = () => {
  const { toast } = useToast();
  const [crms, setCrms] = useState<CrmConfig[]>(DEFAULT_CRMS);
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
          // Support new multi-CRM format
          if (Array.isArray(v.crms)) {
            const loaded = v.crms as CrmConfig[];
            // Ensure always 5 slots
            const padded = [...loaded];
            while (padded.length < 5) padded.push({ ...EMPTY_CRM, label: `CRM ${padded.length + 1}` });
            setCrms(padded.slice(0, 5));
          } else if (v.crm_url) {
            // Migrate old single-CRM format
            const migrated = [...DEFAULT_CRMS];
            migrated[0] = {
              label: "Primary CRM",
              crm_url: v.crm_url || DEFAULT_CRMS[0].crm_url,
              token: v.token || DEFAULT_CRMS[0].token,
              public_id: v.public_id || DEFAULT_CRMS[0].public_id,
              form_name: v.form_name || DEFAULT_CRMS[0].form_name,
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

  const handleSave = async () => {
    setSaving(true);
    try {
      const value = { crms };
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
          CRM Integration Settings (5 Slots)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">Configure up to 5 Vtiger CRM web forms. Enquiry submissions will be sent to all <strong>enabled</strong> CRMs simultaneously.</p>

        <Accordion type="multiple" className="space-y-2">
          {crms.map((crm, i) => (
            <AccordionItem key={i} value={`crm-${i}`} className="border rounded-lg px-4">
              <AccordionTrigger className="py-3 hover:no-underline">
                <div className="flex items-center gap-3 w-full">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${crm.enabled ? "bg-green-500" : "bg-muted-foreground/30"}`} />
                  <span className="font-medium text-sm">{crm.label || `CRM ${i + 1}`}</span>
                  {crm.enabled && <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full ml-auto mr-4">Active</span>}
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pb-4">
                <div className="flex items-center gap-3">
                  <Switch checked={crm.enabled} onCheckedChange={(v) => updateCrm(i, { enabled: v })} />
                  <Label className="text-sm">Enable this CRM</Label>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Label / Name</Label>
                  <Input value={crm.label} onChange={(e) => updateCrm(i, { label: e.target.value })} placeholder="e.g. Telangana CRM" />
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

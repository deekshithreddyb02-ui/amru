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
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, ExternalLink, Hash } from "lucide-react";

interface CrmConfig {
  label: string;
  state_key: string;
  crm_url: string;
  token: string;
  public_id: string;
  form_name: string;
  enabled: boolean;
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
}));

const CrmSettingsEditor = () => {
  const { toast } = useToast();
  const [crms, setCrms] = useState<CrmConfig[]>(DEFAULT_CRMS);
  const [routing, setRouting] = useState<LeadRouting>({ store_in_db: true, send_to_crm: true });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [leadCounts, setLeadCounts] = useState<Record<string, { total: number; success: number; failed: number }>>({});

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
          if (Array.isArray(v.crms)) {
            const loaded = v.crms as CrmConfig[];
            const merged = STATE_SLOTS.map((slot) => {
              const existing = loaded.find(
                (c) => c.state_key === slot.state_key || c.label?.toLowerCase() === slot.label.toLowerCase()
              );
              return existing
                ? { ...existing, state_key: slot.state_key }
                : { ...DEFAULT_CRMS.find((d) => d.state_key === slot.state_key)! };
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

  const handleSave = async () => {
    setSaving(true);
    try {
      const value = { crms, routing };
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

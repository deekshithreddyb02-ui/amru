import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { sanitizeError } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save, ExternalLink } from "lucide-react";

interface CrmSettings {
  crm_url: string;
  token: string;
  public_id: string;
  form_name: string;
}

const DEFAULTS: CrmSettings = {
  crm_url: "https://appscomsolutions.com/VTCRM/modules/Webforms/capture.php",
  token: "sid:c13e250974b2e7ea0ef70de7fecdcc0cc6191ec5,1773737516",
  public_id: "85432a838b51f53a6bc4ec937b64ee40",
  form_name: "Enquiry Form: Telangana - Amruta HydroGeo Services",
};

const CrmSettingsEditor = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<CrmSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data, error } = await (supabase as any)
          .from("site_settings")
          .select("value")
          .eq("key", "crm_settings")
          .maybeSingle();
        if (!error && data?.value) {
          const v = data.value as Record<string, string>;
          setSettings({
            crm_url: v.crm_url || DEFAULTS.crm_url,
            token: v.token || DEFAULTS.token,
            public_id: v.public_id || DEFAULTS.public_id,
            form_name: v.form_name || DEFAULTS.form_name,
          });
        }
      } catch { /* defaults */ }
      setLoading(false);
    };
    fetch();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Upsert CRM settings
      const { data: existing } = await (supabase as any)
        .from("site_settings")
        .select("id")
        .eq("key", "crm_settings")
        .maybeSingle();

      if (existing) {
        const { error } = await (supabase as any)
          .from("site_settings")
          .update({ value: settings, updated_at: new Date().toISOString() })
          .eq("key", "crm_settings");
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from("site_settings")
          .insert({ key: "crm_settings", value: settings });
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
          CRM Integration Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">CRM Web Form URL</Label>
          <Input
            value={settings.crm_url}
            onChange={(e) => setSettings(s => ({ ...s, crm_url: e.target.value }))}
            placeholder="https://..."
          />
          <p className="text-[11px] text-muted-foreground">The Vtiger CRM capture.php endpoint URL</p>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Web Form Token (__vtrftk)</Label>
          <Input
            value={settings.token}
            onChange={(e) => setSettings(s => ({ ...s, token: e.target.value }))}
            placeholder="sid:..."
          />
          <p className="text-[11px] text-muted-foreground">The security token from your Vtiger web form</p>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Public ID</Label>
          <Input
            value={settings.public_id}
            onChange={(e) => setSettings(s => ({ ...s, public_id: e.target.value }))}
            placeholder="85432a..."
          />
          <p className="text-[11px] text-muted-foreground">The public ID from your Vtiger web form</p>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Form Name</Label>
          <Input
            value={settings.form_name}
            onChange={(e) => setSettings(s => ({ ...s, form_name: e.target.value }))}
            placeholder="Enquiry Form: ..."
          />
          <p className="text-[11px] text-muted-foreground">Display name sent to CRM with each submission</p>
        </div>

        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save CRM Settings
        </Button>
      </CardContent>
    </Card>
  );
};

export default CrmSettingsEditor;

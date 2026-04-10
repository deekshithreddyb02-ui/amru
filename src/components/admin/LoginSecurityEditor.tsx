import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Loader2, Save, AlertTriangle } from "lucide-react";

const ATTEMPT_OPTIONS = ["3", "5", "10"];

const LoginSecurityEditor = () => {
  const [maxAttempts, setMaxAttempts] = useState("3");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentValue, setCurrentValue] = useState("3");
  const { toast } = useToast();

  useEffect(() => {
    fetchSetting();
  }, []);

  const fetchSetting = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "max_login_attempts")
        .maybeSingle();

      if (error) throw error;

      const val = data?.value ? String(data.value) : "3";
      setMaxAttempts(val);
      setCurrentValue(val);
    } catch {
      toast({ title: "Error", description: "Failed to load login security settings", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("site_settings")
        .update({ value: Number(maxAttempts) as any, updated_at: new Date().toISOString() })
        .eq("key", "max_login_attempts");

      if (error) throw error;

      setCurrentValue(maxAttempts);
      toast({ title: "Saved", description: `Max login attempts updated to ${maxAttempts}` });
    } catch {
      toast({ title: "Error", description: "Failed to save setting", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const hasChanges = maxAttempts !== currentValue;

  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">Login Attempt Limits</CardTitle>
            <CardDescription>
              Control how many failed login attempts are allowed before temporarily blocking access
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Maximum Failed Login Attempts
          </label>
          <Select value={maxAttempts} onValueChange={setMaxAttempts}>
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue placeholder="Select max attempts" />
            </SelectTrigger>
            <SelectContent>
              {ATTEMPT_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt} attempts
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground flex items-start gap-1.5 mt-1">
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-500" />
            After {maxAttempts} consecutive failed attempts within 1 hour, the account will be temporarily blocked.
            Failed attempts are automatically cleared after 1 hour.
          </p>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button onClick={handleSave} disabled={saving || !hasChanges} size="sm">
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
          {!hasChanges && (
            <span className="text-xs text-muted-foreground">
              Current: {currentValue} attempts
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default LoginSecurityEditor;

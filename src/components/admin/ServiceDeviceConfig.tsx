import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { sanitizeError } from "@/lib/errors";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Save, Monitor, Tablet, Smartphone } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Service {
  id: string;
  title: string;
  image: string;
  is_main: boolean;
  is_main_tablet: boolean;
  is_main_mobile: boolean;
  display_order: number;
  display_order_tablet: number;
  display_order_mobile: number;
}

type DeviceType = "laptop" | "tablet" | "mobile";

const DEVICE_FIELDS: Record<DeviceType, { main: string; order: string }> = {
  laptop: { main: "is_main", order: "display_order" },
  tablet: { main: "is_main_tablet", order: "display_order_tablet" },
  mobile: { main: "is_main_mobile", order: "display_order_mobile" },
};

const ServiceDeviceConfig = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changes, setChanges] = useState<Record<string, Partial<Service>>>({});
  const { toast } = useToast();

  const fetchServices = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("services")
      .select("id, title, image, is_main, is_main_tablet, is_main_mobile, display_order, display_order_tablet, display_order_mobile")
      .order("display_order");

    if (error) {
      toast({ title: "Error", description: sanitizeError(error), variant: "destructive" });
    } else {
      setServices((data as Service[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const updateField = (id: string, field: string, value: boolean | number) => {
    setChanges((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  };

  const getFieldValue = (service: Service, field: string): any => {
    if (changes[service.id] && field in changes[service.id]) {
      return (changes[service.id] as any)[field];
    }
    return (service as any)[field];
  };

  const handleSaveAll = async () => {
    const ids = Object.keys(changes);
    if (ids.length === 0) {
      toast({ title: "No changes", description: "Nothing to save" });
      return;
    }

    setSaving(true);
    let hasError = false;

    for (const id of ids) {
      const { error } = await supabase
        .from("services")
        .update(changes[id] as any)
        .eq("id", id);

      if (error) {
        toast({ title: "Error", description: sanitizeError(error), variant: "destructive" });
        hasError = true;
        break;
      }
    }

    setSaving(false);
    if (!hasError) {
      toast({ title: "Success", description: "Device settings saved" });
      setChanges({});
      fetchServices();
    }
  };

  const hasChanges = Object.keys(changes).length > 0;

  const renderDeviceTab = (device: DeviceType) => {
    const { main: mainField, order: orderField } = DEVICE_FIELDS[device];
    const sortedServices = [...services].sort(
      (a, b) => getFieldValue(a, orderField) - getFieldValue(b, orderField)
    );

    return (
      <div className="space-y-2">
        <div className="grid grid-cols-[1fr_auto_auto] gap-2 items-center px-2 pb-1 border-b text-xs font-medium text-muted-foreground">
          <span>Service</span>
          <span className="w-16 text-center">Main</span>
          <span className="w-20 text-center">Order</span>
        </div>
        {sortedServices.map((service) => (
          <Card key={service.id} className={changes[service.id] ? "border-primary/40" : ""}>
            <CardContent className="p-3">
              <div className="grid grid-cols-[1fr_auto_auto] gap-2 items-center">
                <div className="flex items-center gap-2 min-w-0">
                  <img src={service.image} alt="" className="w-8 h-8 rounded object-cover shrink-0" />
                  <span className="text-sm font-medium truncate">{service.title}</span>
                </div>
                <div className="w-16 flex justify-center">
                  <Switch
                    checked={getFieldValue(service, mainField)}
                    onCheckedChange={(v) => updateField(service.id, mainField, v)}
                  />
                </div>
                <div className="w-20">
                  <Input
                    type="number"
                    className="h-8 text-center text-sm"
                    value={getFieldValue(service, orderField)}
                    onChange={(e) => updateField(service.id, orderField, parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Device View Settings</h3>
        {hasChanges && (
          <Button size="sm" onClick={handleSaveAll} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Changes
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Configure which services appear as "Main" (shown first) vs "Extra" (behind Show More) and their display order for each device type.
      </p>

      <Tabs defaultValue="laptop">
        <TabsList className="w-full">
          <TabsTrigger value="laptop" className="flex-1 gap-1">
            <Monitor className="w-4 h-4" />
            <span className="hidden sm:inline">Laptop</span>
          </TabsTrigger>
          <TabsTrigger value="tablet" className="flex-1 gap-1">
            <Tablet className="w-4 h-4" />
            <span className="hidden sm:inline">Tablet</span>
          </TabsTrigger>
          <TabsTrigger value="mobile" className="flex-1 gap-1">
            <Smartphone className="w-4 h-4" />
            <span className="hidden sm:inline">Mobile</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="laptop">{renderDeviceTab("laptop")}</TabsContent>
        <TabsContent value="tablet">{renderDeviceTab("tablet")}</TabsContent>
        <TabsContent value="mobile">{renderDeviceTab("mobile")}</TabsContent>
      </Tabs>
    </div>
  );
};

export default ServiceDeviceConfig;

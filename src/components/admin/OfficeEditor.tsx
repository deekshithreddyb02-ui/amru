import { useState, lazy, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { sanitizeError } from "@/lib/errors";
import { Loader2, Save, MapPin, Plus, Trash2 } from "lucide-react";
import { useSiteContent } from "@/hooks/useSiteContent";
import { supabase } from "@/integrations/supabase/client";

const OfficeMap = lazy(() => import("@/components/OfficeMap"));

interface Office {
  city: string;
  address: string;
  label?: string;
  lat?: number;
  lng?: number;
}

const OfficeEditor = () => {
  const { data: officesContent, loading: isLoading } = useSiteContent("offices");
  const [offices, setOffices] = useState<Office[] | null>(null);
  const [popupBgColor, setPopupBgColor] = useState<string>("");
  const [popupTextColor, setPopupTextColor] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const currentOffices: Office[] = offices ?? 
    ((officesContent?.metadata as any)?.offices || []);
  const currentPopupBgColor = popupBgColor || (officesContent?.metadata as any)?.popupBgColor || "";
  const currentPopupTextColor = popupTextColor || (officesContent?.metadata as any)?.popupTextColor || "";

  const startEditing = () => {
    setOffices([...currentOffices]);
    setPopupBgColor(currentPopupBgColor);
    setPopupTextColor(currentPopupTextColor);
  };

  const updateOffice = (index: number, field: keyof Office, value: string) => {
    if (!offices) return;
    const updated = [...offices];
    if (field === "lat" || field === "lng") {
      (updated[index] as any)[field] = value ? parseFloat(value) : undefined;
    } else {
      (updated[index] as any)[field] = value;
    }
    setOffices(updated);
  };

  const addOffice = () => {
    if (!offices) startEditing();
    setOffices(prev => [...(prev || currentOffices), { city: "", address: "" }]);
  };

  const removeOffice = (index: number) => {
    if (!offices) return;
    setOffices(offices.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!offices) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("site_content")
        .update({ metadata: { offices, popupBgColor: popupBgColor || undefined, popupTextColor: popupTextColor || undefined } as unknown as Record<string, any>, updated_at: new Date().toISOString() })
        .eq("section_key", "offices");

      if (error) throw error;
      toast({ title: "Success", description: "Office locations updated" });
      setOffices(null);
      setPopupBgColor("");
      setPopupTextColor("");
    } catch (error: any) {
      toast({ title: "Error", description: sanitizeError(error), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const isEditing = offices !== null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          Office Locations & Maps
        </h2>
        <div className="flex gap-2">
          {!isEditing ? (
            <Button variant="outline" size="sm" onClick={startEditing}>
              Edit Offices
            </Button>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={() => { setOffices(null); setPopupBgColor(""); setPopupTextColor(""); }}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save
              </Button>
            </>
          )}
        </div>
      </div>

      {isEditing && (
        <Card className="mb-4">
          <CardContent className="pt-4 flex items-center gap-4">
            <Label className="text-sm font-medium whitespace-nowrap">Popup Background Color</Label>
            <input
              type="color"
              value={popupBgColor || "#ffffff"}
              onChange={e => setPopupBgColor(e.target.value)}
              className="h-9 w-14 rounded border border-border cursor-pointer"
            />
            <Input
              value={popupBgColor}
              onChange={e => setPopupBgColor(e.target.value)}
              placeholder="#ffffff"
              className="w-32"
            />
            {popupBgColor && (
              <Button variant="ghost" size="sm" onClick={() => setPopupBgColor("")}>
                Reset
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {currentOffices.map((office, index) => (
          <Card key={index}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span>{office.city || `Office ${index + 1}`}</span>
                {isEditing && (
                  <Button variant="ghost" size="icon" onClick={() => removeOffice(index)} className="h-7 w-7">
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isEditing ? (
                <>
                  <div>
                    <Label className="text-xs">Display Name (shown in map popup)</Label>
                    <Input value={office.label || ""} onChange={e => updateOffice(index, "label", e.target.value)} className="mt-1" placeholder="e.g. Amruta Integrated Water Solutions Pvt. Ltd." />
                  </div>
                  <div>
                    <Label className="text-xs">City</Label>
                    <Input value={office.city} onChange={e => updateOffice(index, "city", e.target.value)} className="mt-1" placeholder="City name" />
                  </div>
                  <div>
                    <Label className="text-xs">Address</Label>
                    <Input value={office.address} onChange={e => updateOffice(index, "address", e.target.value)} className="mt-1" placeholder="Full address" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Latitude</Label>
                      <Input value={office.lat ?? ""} onChange={e => updateOffice(index, "lat", e.target.value)} className="mt-1" placeholder="18.5997" type="number" step="any" />
                    </div>
                    <div>
                      <Label className="text-xs">Longitude</Label>
                      <Input value={office.lng ?? ""} onChange={e => updateOffice(index, "lng", e.target.value)} className="mt-1" placeholder="73.7997" type="number" step="any" />
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>{office.address}</p>
                  {office.lat && office.lng && <p className="text-xs">📍 {office.lat}, {office.lng}</p>}
                </div>
              )}
              
              {/* Map preview */}
              <Suspense fallback={<div className="h-[200px] bg-muted rounded-lg animate-pulse" />}>
                <OfficeMap office={office} height="200px" />
              </Suspense>
            </CardContent>
          </Card>
        ))}
      </div>

      {isEditing && (
        <Button variant="outline" onClick={addOffice} className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Add Office
        </Button>
      )}
    </div>
  );
};

export default OfficeEditor;

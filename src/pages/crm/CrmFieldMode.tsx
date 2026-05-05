import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Camera, WifiOff, Wifi, RefreshCw, Save, Loader2 } from "lucide-react";
import { useOfflineFieldVisits } from "@/hooks/useOfflineFieldVisits";
import { toast } from "sonner";

export default function CrmFieldMode() {
  const { workspace } = useOutletContext<{ workspace: { id: string; name: string } }>();
  const { pending, online, syncing, save, sync } = useOfflineFieldVisits(workspace.id);
  const [customer, setCustomer] = useState("");
  const [notes, setNotes] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [busy, setBusy] = useState(false);

  const captureGPS = () => {
    if (!navigator.geolocation) return toast.error("GPS not available");
    navigator.geolocation.getCurrentPosition(
      (p) => { setCoords({ lat: p.coords.latitude, lng: p.coords.longitude }); toast.success("Location captured"); },
      () => toast.error("Could not get location"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const submit = async () => {
    if (!customer.trim()) return toast.error("Customer name required");
    setBusy(true);
    try {
      await save({
        workspace_id: workspace.id,
        visit_date: new Date().toISOString(),
        customer_name: customer.trim(),
        notes: notes.trim() || undefined,
        latitude: coords?.lat,
        longitude: coords?.lng,
      });
      toast.success(online ? "Saved & syncing" : "Saved offline – will sync");
      setCustomer(""); setNotes(""); setCoords(null);
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-4 max-w-xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-serif flex items-center gap-2"><MapPin className="h-6 w-6 text-primary" /> Field Mode</h1>
        <Badge variant={online ? "default" : "destructive"} className="gap-1">
          {online ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
          {online ? "Online" : "Offline"}
        </Badge>
      </div>

      <Card className="p-4 space-y-3">
        <div className="space-y-1">
          <label className="text-sm font-medium">Customer / site name</label>
          <Input value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="Site or customer name" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Visit notes</label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observations, next steps…" rows={4} />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={captureGPS}><MapPin className="h-4 w-4 mr-1" />{coords ? "GPS ✓" : "Capture GPS"}</Button>
          <Button variant="outline" disabled><Camera className="h-4 w-4 mr-1" />Photo (soon)</Button>
        </div>
        {coords && <div className="text-xs text-muted-foreground">{coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</div>}
        <Button className="w-full" onClick={submit} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
          Save check-in
        </Button>
      </Card>

      <Card className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm">Pending sync ({pending.length})</h2>
          <Button size="sm" variant="ghost" onClick={sync} disabled={!online || syncing}>
            <RefreshCw className={`h-4 w-4 mr-1 ${syncing ? "animate-spin" : ""}`} />Sync
          </Button>
        </div>
        {pending.length === 0 ? (
          <p className="text-xs text-muted-foreground">All check-ins synced.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {pending.map(v => (
              <li key={v.client_uuid} className="flex items-center justify-between border rounded p-2">
                <span className="truncate">{v.customer_name}</span>
                <span className="text-xs text-muted-foreground">{new Date(v.created_at).toLocaleTimeString()}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

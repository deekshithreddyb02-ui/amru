import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCrmWorkspaces } from "@/hooks/useCrmWorkspaces";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { MapPin, Camera, CheckCircle2, Plus, Navigation, Loader2, Image as ImageIcon } from "lucide-react";

type Visit = {
  id: string;
  visit_number: string;
  title: string;
  visit_type: string;
  status: string;
  scheduled_at: string | null;
  customer_name: string | null;
  site_address: string | null;
  site_city: string | null;
  checkin_at: string | null;
  checkin_lat: number | null;
  checkin_lng: number | null;
  checkout_at: string | null;
  findings: string | null;
  recommendations: string | null;
  photo_paths: string[];
  assigned_to: string | null;
};

const STATUS_VARIANT: Record<string, any> = {
  scheduled: "secondary",
  in_progress: "default",
  completed: "outline",
  cancelled: "destructive",
};

const getCoords = () =>
  new Promise<{ lat: number; lng: number }>((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("Geolocation unavailable"));
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      (e) => reject(e),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  });

export default function CrmFieldVisits() {
  const { slug } = useParams();
  const { workspaces } = useCrmWorkspaces();
  const ws = workspaces.find((w) => w.slug === slug);

  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<string>("mine");
  const [meId, setMeId] = useState<string | null>(null);

  // New visit form
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", visit_type: "site_survey", customer_name: "", site_address: "", scheduled_at: "" });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setMeId(data.session?.user?.id ?? null));
  }, []);

  const load = async () => {
    if (!ws?.id) return;
    setLoading(true);
    let q = supabase.from("crm_field_visits").select("*").eq("workspace_id", ws.id).order("created_at", { ascending: false }).limit(100);
    if (filter === "mine" && meId) q = q.eq("assigned_to", meId);
    if (filter === "today") {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
      q = q.gte("scheduled_at", today.toISOString()).lt("scheduled_at", tomorrow.toISOString());
    }
    if (filter === "open") q = q.in("status", ["scheduled", "in_progress"]);
    const { data } = await q;
    setVisits((data as Visit[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [ws?.id, filter, meId]);

  const create = async () => {
    if (!ws?.id || !form.title) { toast.error("Title required"); return; }
    const { error } = await supabase.from("crm_field_visits").insert({
      workspace_id: ws.id,
      title: form.title,
      visit_type: form.visit_type,
      customer_name: form.customer_name || null,
      site_address: form.site_address || null,
      scheduled_at: form.scheduled_at || null,
      assigned_to: meId,
      created_by: meId,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Visit scheduled");
    setOpen(false);
    setForm({ title: "", visit_type: "site_survey", customer_name: "", site_address: "", scheduled_at: "" });
    load();
  };

  const checkIn = async (v: Visit) => {
    try {
      const { lat, lng } = await getCoords();
      await supabase.from("crm_field_visits").update({
        checkin_at: new Date().toISOString(),
        checkin_lat: lat, checkin_lng: lng,
        status: "in_progress",
      }).eq("id", v.id);
      toast.success("Checked in");
      load();
    } catch (e: any) {
      toast.error("GPS error: " + (e.message || "denied"));
    }
  };

  const checkOut = async (v: Visit) => {
    try {
      const { lat, lng } = await getCoords();
      await supabase.from("crm_field_visits").update({
        checkout_at: new Date().toISOString(),
        checkout_lat: lat, checkout_lng: lng,
        status: "completed",
      }).eq("id", v.id);
      toast.success("Checked out");
      load();
    } catch (e: any) {
      toast.error("GPS error: " + (e.message || "denied"));
    }
  };

  const uploadPhoto = async (v: Visit, file: File) => {
    if (!ws?.id) return;
    const path = `field-visits/${ws.id}/${v.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("crm-documents").upload(path, file, { upsert: false });
    if (error) { toast.error(error.message); return; }
    const next = [...(v.photo_paths || []), path];
    await supabase.from("crm_field_visits").update({ photo_paths: next }).eq("id", v.id);
    toast.success("Photo uploaded");
    load();
  };

  const updateFindings = async (v: Visit, findings: string, recs: string) => {
    await supabase.from("crm_field_visits").update({ findings, recommendations: recs }).eq("id", v.id);
    toast.success("Saved");
    load();
  };

  return (
    <div className="p-3 md:p-6 space-y-3 max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2"><MapPin className="w-5 h-5" /> Field Visits</h1>
          <p className="text-xs text-muted-foreground">Schedule, check-in with GPS, capture photos, and log findings on-site.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-32 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="mine">My visits</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" />New</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Schedule visit</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Type</Label>
                    <Select value={form.visit_type} onValueChange={(v) => setForm({ ...form, visit_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="site_survey">Site survey</SelectItem>
                        <SelectItem value="installation">Installation</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="inspection">Inspection</SelectItem>
                        <SelectItem value="meeting">Customer meeting</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Date/time</Label><Input type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} /></div>
                </div>
                <div><Label>Customer</Label><Input value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} /></div>
                <div><Label>Site address</Label><Textarea rows={2} value={form.site_address} onChange={(e) => setForm({ ...form, site_address: e.target.value })} /></div>
                <Button onClick={create} className="w-full">Create</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="grid place-items-center py-10"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : visits.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">No visits yet.</CardContent></Card>
      ) : (
        visits.map((v) => <VisitCard key={v.id} v={v} onCheckIn={() => checkIn(v)} onCheckOut={() => checkOut(v)} onUpload={(f) => uploadPhoto(v, f)} onSave={(f, r) => updateFindings(v, f, r)} />)
      )}
    </div>
  );
}

function VisitCard({ v, onCheckIn, onCheckOut, onUpload, onSave }: {
  v: Visit;
  onCheckIn: () => void;
  onCheckOut: () => void;
  onUpload: (f: File) => void;
  onSave: (findings: string, recs: string) => void;
}) {
  const [findings, setFindings] = useState(v.findings || "");
  const [recs, setRecs] = useState(v.recommendations || "");
  const [expanded, setExpanded] = useState(false);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="text-base truncate">{v.title}</CardTitle>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <code className="text-[10px] text-muted-foreground">{v.visit_number}</code>
              <Badge variant={STATUS_VARIANT[v.status] || "secondary"} className="text-[10px]">{v.status.replace("_", " ")}</Badge>
              <span className="text-[10px] text-muted-foreground capitalize">{v.visit_type.replace("_", " ")}</span>
            </div>
          </div>
          <Button size="sm" variant="ghost" onClick={() => setExpanded(!expanded)}>{expanded ? "Hide" : "Open"}</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {v.customer_name && <div className="text-sm"><span className="text-muted-foreground">Customer:</span> {v.customer_name}</div>}
        {v.site_address && <div className="text-xs text-muted-foreground flex gap-1"><MapPin className="w-3 h-3 mt-0.5 shrink-0" />{v.site_address}</div>}
        {v.scheduled_at && <div className="text-xs text-muted-foreground">Scheduled: {new Date(v.scheduled_at).toLocaleString()}</div>}

        {/* Quick actions row */}
        <div className="flex gap-2 pt-1">
          {!v.checkin_at && <Button size="sm" onClick={onCheckIn} className="flex-1"><Navigation className="w-3.5 h-3.5 mr-1" />Check in</Button>}
          {v.checkin_at && !v.checkout_at && <Button size="sm" variant="default" onClick={onCheckOut} className="flex-1"><CheckCircle2 className="w-3.5 h-3.5 mr-1" />Check out</Button>}
          {v.checkin_at && (
            <label className="flex-1">
              <Button size="sm" variant="outline" className="w-full" asChild>
                <span><Camera className="w-3.5 h-3.5 mr-1" />Photo</span>
              </Button>
              <input type="file" accept="image/*" capture="environment" hidden onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} />
            </label>
          )}
        </div>

        {v.checkin_at && (
          <div className="text-[10px] text-muted-foreground">
            In: {new Date(v.checkin_at).toLocaleTimeString()} {v.checkin_lat && `(${v.checkin_lat.toFixed(4)}, ${v.checkin_lng?.toFixed(4)})`}
            {v.checkout_at && ` → Out: ${new Date(v.checkout_at).toLocaleTimeString()}`}
          </div>
        )}

        {expanded && (
          <div className="space-y-2 pt-2 border-t">
            {v.photo_paths?.length > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground"><ImageIcon className="w-3.5 h-3.5" /> {v.photo_paths.length} photo(s) attached</div>
            )}
            <div>
              <Label className="text-xs">Findings</Label>
              <Textarea rows={3} value={findings} onChange={(e) => setFindings(e.target.value)} placeholder="What did you observe on site?" />
            </div>
            <div>
              <Label className="text-xs">Recommendations / next action</Label>
              <Textarea rows={2} value={recs} onChange={(e) => setRecs(e.target.value)} />
            </div>
            <Button size="sm" onClick={() => onSave(findings, recs)} className="w-full">Save notes</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

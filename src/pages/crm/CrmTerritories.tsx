import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Map, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Workspace = { id: string; slug: string; name: string };
type Territory = {
  id: string; name: string; description: string | null;
  states: string[]; countries: string[]; region_keys: string[];
  owner_user_id: string | null; is_active: boolean;
};

export default function CrmTerritories() {
  const { workspace, myRole } = useOutletContext<{ workspace: Workspace; myRole: string }>();
  const [rows, setRows] = useState<Territory[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", states: "", countries: "" });
  const isAdmin = myRole === "crm_admin" || myRole === "super_admin";

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("crm_territories" as any).select("*").eq("workspace_id", workspace.id).order("created_at", { ascending: false });
    setRows((data as any) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [workspace.id]);

  const save = async () => {
    if (!form.name.trim()) return toast.error("Name required");
    const { error } = await supabase.from("crm_territories" as any).insert({
      workspace_id: workspace.id,
      name: form.name.trim(),
      description: form.description || null,
      states: form.states.split(",").map((s) => s.trim()).filter(Boolean),
      countries: form.countries.split(",").map((s) => s.trim()).filter(Boolean),
    });
    if (error) return toast.error(error.message);
    toast.success("Territory created");
    setForm({ name: "", description: "", states: "", countries: "" });
    setOpen(false);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-serif flex items-center gap-2"><Map className="h-6 w-6 text-primary" />Sales Territories</h1>
          <p className="text-sm text-muted-foreground">Define geographic ownership for leads & deals.</p>
        </div>
        {isAdmin && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" />New territory</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New territory</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                <div><Label>States (comma-separated)</Label><Input value={form.states} onChange={(e) => setForm({ ...form, states: e.target.value })} placeholder="Maharashtra, Telangana" /></div>
                <div><Label>Countries</Label><Input value={form.countries} onChange={(e) => setForm({ ...form, countries: e.target.value })} placeholder="India" /></div>
                <Button onClick={save} className="w-full">Save</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : rows.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">No territories yet.</Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rows.map((t) => (
            <Card key={t.id} className="p-4 space-y-2">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold">{t.name}</h3>
                {t.is_active ? <Badge variant="outline" className="text-xs">Active</Badge> : <Badge variant="secondary" className="text-xs">Inactive</Badge>}
              </div>
              {t.description && <p className="text-sm text-muted-foreground">{t.description}</p>}
              {t.states?.length > 0 && <div className="text-xs text-muted-foreground">States: {t.states.join(", ")}</div>}
              {t.countries?.length > 0 && <div className="text-xs text-muted-foreground">Countries: {t.countries.join(", ")}</div>}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

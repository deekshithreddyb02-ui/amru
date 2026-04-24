import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Plus, Mic, FileAudio, ListChecks } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Workspace { id: string; slug: string; name: string }
interface Summary {
  id: string; title: string; meeting_date: string | null; source_type: string;
  status: string; summary: string | null; action_items: any; follow_ups: any;
  participants: any; transcript: string | null; created_at: string; error_message: string | null;
}

export default function CrmMeetings() {
  const { workspace } = useOutletContext<{ workspace: Workspace }>();
  const { toast } = useToast();
  const [items, setItems] = useState<Summary[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [view, setView] = useState<Summary | null>(null);
  const [tab, setTab] = useState("paste");

  const [pasteForm, setPasteForm] = useState({ title: "", meeting_date: "", transcript: "" });
  const [audioForm, setAudioForm] = useState<{ title: string; meeting_date: string; file: File | null }>({ title: "", meeting_date: "", file: null });

  const fetchItems = async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("crm_meeting_summaries").select("*").eq("workspace_id", workspace.id)
      .order("created_at", { ascending: false }).limit(100);
    setItems((data as Summary[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, [workspace.id]);

  const submit = async () => {
    setSubmitting(true);
    try {
      let audio_path: string | undefined;
      let payload: any = { workspace_id: workspace.id };

      if (tab === "paste") {
        if (!pasteForm.title || !pasteForm.transcript) { toast({ title: "Title and transcript required", variant: "destructive" }); setSubmitting(false); return; }
        payload = { ...payload, source_type: "paste", title: pasteForm.title, meeting_date: pasteForm.meeting_date || undefined, transcript: pasteForm.transcript };
      } else {
        if (!audioForm.title || !audioForm.file) { toast({ title: "Title and audio file required", variant: "destructive" }); setSubmitting(false); return; }
        const path = `${workspace.id}/meetings/${Date.now()}_${audioForm.file.name}`;
        const { error: upErr } = await supabase.storage.from("crm-documents").upload(path, audioForm.file);
        if (upErr) throw upErr;
        audio_path = path;
        payload = { ...payload, source_type: "audio", title: audioForm.title, meeting_date: audioForm.meeting_date || undefined, audio_path };
      }

      const { data, error } = await supabase.functions.invoke("crm-meeting-summarize", { body: payload });
      if (error || !data?.ok) throw new Error(data?.error || error?.message || "Failed");
      toast({ title: "Summary ready", description: "Open it to view action items." });
      setOpen(false);
      setPasteForm({ title: "", meeting_date: "", transcript: "" });
      setAudioForm({ title: "", meeting_date: "", file: null });
      fetchItems();
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    } finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-serif">Meeting summaries</h1>
          <p className="text-sm text-muted-foreground">AI-generated summaries, action items, follow-ups</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" />New summary</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Summarize a meeting</DialogTitle></DialogHeader>
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="grid grid-cols-2"><TabsTrigger value="paste"><Mic className="h-4 w-4 mr-2" />Paste transcript</TabsTrigger><TabsTrigger value="audio"><FileAudio className="h-4 w-4 mr-2" />Upload audio</TabsTrigger></TabsList>
              <TabsContent value="paste" className="space-y-3">
                <div><Label>Title</Label><Input value={pasteForm.title} onChange={(e) => setPasteForm({ ...pasteForm, title: e.target.value })} /></div>
                <div><Label>Meeting date</Label><Input type="date" value={pasteForm.meeting_date} onChange={(e) => setPasteForm({ ...pasteForm, meeting_date: e.target.value })} /></div>
                <div><Label>Transcript</Label><Textarea rows={8} value={pasteForm.transcript} onChange={(e) => setPasteForm({ ...pasteForm, transcript: e.target.value })} placeholder="Paste full meeting transcript here…" /></div>
              </TabsContent>
              <TabsContent value="audio" className="space-y-3">
                <div><Label>Title</Label><Input value={audioForm.title} onChange={(e) => setAudioForm({ ...audioForm, title: e.target.value })} /></div>
                <div><Label>Meeting date</Label><Input type="date" value={audioForm.meeting_date} onChange={(e) => setAudioForm({ ...audioForm, meeting_date: e.target.value })} /></div>
                <div><Label>Audio file (mp3 / wav, max ~25MB)</Label><Input type="file" accept="audio/*" onChange={(e) => setAudioForm({ ...audioForm, file: e.target.files?.[0] || null })} /></div>
                <p className="text-xs text-muted-foreground">Audio is transcribed by AI then summarized. Long files take longer.</p>
              </TabsContent>
            </Tabs>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={submit} disabled={submitting}>{submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Summarize</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : items.length === 0 ? (
        <Card><CardContent className="text-center py-10 text-muted-foreground"><ListChecks className="h-10 w-10 mx-auto mb-2" />No summaries yet.</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {items.map((m) => (
            <Card key={m.id} className="cursor-pointer hover:border-primary/50" onClick={() => setView(m)}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{m.title}</CardTitle>
                  <Badge variant={m.status === "ready" ? "default" : m.status === "failed" ? "destructive" : "secondary"}>{m.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{m.meeting_date || new Date(m.created_at).toLocaleDateString("en-IN")} • {m.source_type}</p>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3">{m.summary || m.error_message || "Processing…"}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!view} onOpenChange={(o) => !o && setView(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh]">
          <DialogHeader><DialogTitle>{view?.title}</DialogTitle></DialogHeader>
          <ScrollArea className="max-h-[65vh] pr-3 space-y-4">
            {view?.summary && (<><h3 className="font-semibold">Summary</h3><p className="text-sm whitespace-pre-wrap">{view.summary}</p></>)}
            {Array.isArray(view?.action_items) && view!.action_items.length > 0 && (
              <><h3 className="font-semibold mt-4">Action items</h3>
                <ul className="text-sm list-disc pl-5 space-y-1">
                  {view!.action_items.map((a: any, i: number) => <li key={i}><strong>{a.task}</strong>{a.owner && ` — ${a.owner}`}{a.due && ` (due ${a.due})`}</li>)}
                </ul></>
            )}
            {Array.isArray(view?.follow_ups) && view!.follow_ups.length > 0 && (
              <><h3 className="font-semibold mt-4">Follow-ups</h3><ul className="text-sm list-disc pl-5 space-y-1">{view!.follow_ups.map((f: string, i: number) => <li key={i}>{f}</li>)}</ul></>
            )}
            {view?.transcript && (<><h3 className="font-semibold mt-4">Transcript</h3><pre className="text-xs whitespace-pre-wrap text-muted-foreground">{view.transcript.slice(0, 4000)}{view.transcript.length > 4000 ? "…" : ""}</pre></>)}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}

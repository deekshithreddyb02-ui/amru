import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, FileSignature, CheckCircle2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function QuotationSign() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  const [signed, setSigned] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ signer_name: "", signer_email: "", signer_company: "" });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/crm-sign-quotation?token=${encodeURIComponent(token ?? "")}`;
        const r = await fetch(url, { headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY } });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Failed");
        setData(d);
        if (d.token?.used_at) setSigned(true);
      } catch (e: any) { setErr(e.message); } finally { setLoading(false); }
    })();
  }, [token]);

  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
    ctx.strokeStyle = "#000"; ctx.lineWidth = 2; ctx.lineCap = "round";
  }, [data, signed]);

  const pos = (e: React.PointerEvent) => {
    const c = canvasRef.current!; const r = c.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (c.width / r.width), y: (e.clientY - r.top) * (c.height / r.height) };
  };
  const start = (e: React.PointerEvent) => { drawing.current = true; const ctx = canvasRef.current!.getContext("2d")!; const p = pos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); };
  const move = (e: React.PointerEvent) => { if (!drawing.current) return; const ctx = canvasRef.current!.getContext("2d")!; const p = pos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); };
  const end = () => { drawing.current = false; };
  const clear = () => { const c = canvasRef.current!; const ctx = c.getContext("2d")!; ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height); };

  const submit = async () => {
    if (!form.signer_name.trim()) return toast.error("Name required");
    setSubmitting(true);
    try {
      const dataUrl = canvasRef.current!.toDataURL("image/png");
      const r = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/crm-sign-quotation`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
        body: JSON.stringify({ token, ...form, signature_data_url: dataUrl }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed");
      setSigned(true);
      toast.success("Quotation signed");
    } catch (e: any) { toast.error(e.message); } finally { setSubmitting(false); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (err) return <div className="min-h-screen flex items-center justify-center px-4"><Card className="p-8 max-w-md text-center space-y-2"><AlertTriangle className="h-8 w-8 mx-auto text-destructive" /><h1 className="text-xl font-serif">Cannot open</h1><p className="text-sm text-muted-foreground">{err}</p></Card></div>;

  const q = data?.quotation;

  return (
    <div className="min-h-screen bg-muted/30 py-6 px-3">
      <div className="max-w-2xl mx-auto space-y-4">
        <Card className="p-5 space-y-2">
          <h1 className="text-2xl font-serif flex items-center gap-2"><FileSignature className="h-6 w-6 text-primary" />Sign Quotation {q?.quotation_number}</h1>
          <div className="text-sm text-muted-foreground">For: {q?.customer_name}</div>
          <div className="text-sm">Total: <strong>{q?.currency} {Number(q?.total ?? 0).toLocaleString()}</strong></div>
          {q?.notes && <p className="text-sm text-muted-foreground border-t pt-2 whitespace-pre-line">{q.notes}</p>}
        </Card>

        {signed ? (
          <Card className="p-8 text-center space-y-2"><CheckCircle2 className="h-10 w-10 mx-auto text-emerald-600" /><h2 className="text-lg font-semibold">Signature recorded</h2><p className="text-sm text-muted-foreground">Thank you. The quotation has been accepted.</p></Card>
        ) : (
          <Card className="p-5 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><Label>Your name *</Label><Input value={form.signer_name} onChange={(e) => setForm({ ...form, signer_name: e.target.value })} /></div>
              <div><Label>Email</Label><Input type="email" value={form.signer_email} onChange={(e) => setForm({ ...form, signer_email: e.target.value })} /></div>
              <div className="sm:col-span-2"><Label>Company</Label><Input value={form.signer_company} onChange={(e) => setForm({ ...form, signer_company: e.target.value })} /></div>
            </div>
            <div>
              <Label>Sign below</Label>
              <div className="border rounded bg-white touch-none">
                <canvas ref={canvasRef} width={600} height={200} className="w-full"
                  onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerLeave={end} />
              </div>
              <div className="flex justify-between mt-2"><Button variant="outline" size="sm" onClick={clear}>Clear</Button></div>
            </div>
            <Button onClick={submit} disabled={submitting} className="w-full">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Accept & Sign"}
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}

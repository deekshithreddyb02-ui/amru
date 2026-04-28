import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCrmWorkspaces } from "@/hooks/useCrmWorkspaces";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Copy, Link2, Trash2 } from "lucide-react";

type Token = {
  id: string;
  token: string;
  scope: string;
  customer_name: string | null;
  customer_email: string | null;
  expires_at: string | null;
  revoked_at: string | null;
  view_count: number;
  last_viewed_at: string | null;
  created_at: string;
};

const randToken = () =>
  crypto.getRandomValues(new Uint8Array(24)).reduce((s, b) => s + b.toString(36).padStart(2, "0"), "");

export default function CrmCustomerPortal() {
  const { slug } = useParams();
  const { workspaces } = useCrmWorkspaces();
  const ws = workspaces.find((w) => w.slug === slug);

  const [rows, setRows] = useState<Token[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [scope, setScope] = useState("all");
  const [days, setDays] = useState("30");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!ws?.id) return;
    const { data } = await supabase
      .from("crm_portal_tokens")
      .select("*")
      .eq("workspace_id", ws.id)
      .order("created_at", { ascending: false })
      .limit(100);
    setRows((data as Token[]) || []);
  };

  useEffect(() => {
    load();
  }, [ws?.id]);

  const issue = async () => {
    if (!ws?.id) return;
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    const tok = randToken();
    const expires = days === "0" ? null : new Date(Date.now() + Number(days) * 86400000).toISOString();
    const { error } = await supabase.from("crm_portal_tokens").insert({
      workspace_id: ws.id,
      token: tok,
      scope,
      customer_name: name || null,
      customer_email: email || null,
      expires_at: expires,
      created_by: session?.user?.id,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Share link created");
    setName(""); setEmail("");
    load();
  };

  const revoke = async (id: string) => {
    await supabase.from("crm_portal_tokens").update({ revoked_at: new Date().toISOString() }).eq("id", id);
    toast.success("Revoked");
    load();
  };

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/portal/${token}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied");
  };

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Link2 className="w-5 h-5" /> Customer portal links</h1>
        <p className="text-sm text-muted-foreground">Generate token-based share links so customers can view their invoices, quotations, and reports without creating an account.</p>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Issue a new link</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="space-y-1"><Label>Customer name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div className="space-y-1"><Label>Customer email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <div className="space-y-1">
              <Label>Scope</Label>
              <Select value={scope} onValueChange={setScope}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All (invoices + quotes + reports)</SelectItem>
                  <SelectItem value="invoice">Invoices only</SelectItem>
                  <SelectItem value="quotation">Quotations only</SelectItem>
                  <SelectItem value="report">Reports only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Expires in</Label>
              <Select value={days} onValueChange={setDays}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                  <SelectItem value="0">Never</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={issue} disabled={loading || !ws?.id} className="w-full">Create link</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Active links</CardTitle></CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No links issued yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground border-b">
                  <tr><th className="py-2 pr-3">Customer</th><th>Scope</th><th>Status</th><th>Views</th><th>Expires</th><th></th></tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const expired = r.expires_at && new Date(r.expires_at) < new Date();
                    return (
                      <tr key={r.id} className="border-b last:border-0">
                        <td className="py-2 pr-3">
                          <div className="font-medium">{r.customer_name || "—"}</div>
                          <div className="text-xs text-muted-foreground">{r.customer_email || ""}</div>
                        </td>
                        <td><Badge variant="secondary">{r.scope}</Badge></td>
                        <td>
                          {r.revoked_at ? <Badge variant="destructive">Revoked</Badge>
                            : expired ? <Badge variant="outline">Expired</Badge>
                            : <Badge>Active</Badge>}
                        </td>
                        <td>{r.view_count}</td>
                        <td className="text-xs">{r.expires_at ? new Date(r.expires_at).toLocaleDateString() : "Never"}</td>
                        <td className="text-right whitespace-nowrap">
                          <Button size="sm" variant="ghost" onClick={() => copyLink(r.token)}><Copy className="w-3.5 h-3.5" /></Button>
                          {!r.revoked_at && (
                            <Button size="sm" variant="ghost" onClick={() => revoke(r.id)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

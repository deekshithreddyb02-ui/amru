import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { sanitizeError } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, RefreshCw, Activity, Wifi, WifiOff, Trash2 } from "lucide-react";

interface PingRecord {
  id: string;
  state_key: string;
  crm_label: string | null;
  crm_url: string;
  status: string;
  response_time_ms: number | null;
  status_code: number | null;
  error_message: string | null;
  pinged_at: string;
}

const CrmPingDashboard = () => {
  const { toast } = useToast();
  const [pings, setPings] = useState<PingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [pinging, setPinging] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const fetchPings = async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from("crm_ping_history")
        .select("*")
        .order("pinged_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      setPings(data || []);
    } catch (error: any) {
      toast({ title: "Error", description: sanitizeError(error), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPings(); }, []);

  const runPing = async () => {
    setPinging(true);
    try {
      const { data, error } = await supabase.functions.invoke("crm-ping");
      if (error) throw error;
      toast({ title: "Ping Complete", description: `Pinged ${data?.results?.length || 0} CRM endpoints` });
      await fetchPings();
    } catch (error: any) {
      toast({ title: "Error", description: sanitizeError(error), variant: "destructive" });
    } finally {
      setPinging(false);
    }
  };

  const runRetry = async () => {
    setRetrying(true);
    try {
      const { data, error } = await supabase.functions.invoke("crm-retry");
      if (error) throw error;
      toast({
        title: "Retry Complete",
        description: `Retried ${data?.retried || 0} leads, ${data?.succeeded || 0} succeeded`,
      });
    } catch (error: any) {
      toast({ title: "Error", description: sanitizeError(error), variant: "destructive" });
    } finally {
      setRetrying(false);
    }
  };

  const clearHistory = async () => {
    if (!confirm("Clear all ping history?")) return;
    try {
      const ids = pings.map(p => p.id);
      if (ids.length > 0) {
        await (supabase as any).from("crm_ping_history").delete().in("id", ids);
      }
      setPings([]);
      toast({ title: "Cleared", description: "Ping history cleared" });
    } catch (error: any) {
      toast({ title: "Error", description: sanitizeError(error), variant: "destructive" });
    }
  };

  // Get latest ping per state
  const latestByState = new Map<string, PingRecord>();
  for (const p of pings) {
    if (!latestByState.has(p.state_key)) {
      latestByState.set(p.state_key, p);
    }
  }

  const statusBadge = (status: string) => {
    if (status === "online") return <Badge className="bg-green-500/10 text-green-700 border-green-300 gap-1 text-[10px]"><Wifi className="w-3 h-3" />Online</Badge>;
    if (status === "offline") return <Badge variant="destructive" className="gap-1 text-[10px]"><WifiOff className="w-3 h-3" />Offline</Badge>;
    return <Badge variant="outline" className="text-[10px]">Unknown</Badge>;
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          CRM Health Monitor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button onClick={runPing} disabled={pinging} size="sm" className="gap-2">
            {pinging ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Ping All CRMs Now
          </Button>
          <Button onClick={runRetry} disabled={retrying} size="sm" variant="outline" className="gap-2">
            {retrying ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Retry Failed Leads
          </Button>
          <Button onClick={clearHistory} size="sm" variant="ghost" className="gap-2 text-destructive">
            <Trash2 className="w-4 h-4" /> Clear History
          </Button>
        </div>

        {/* Current Status Summary */}
        {latestByState.size > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {Array.from(latestByState.values()).map((p) => (
              <div key={p.state_key} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20">
                <div>
                  <p className="font-semibold text-sm">{p.crm_label || p.state_key}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {p.response_time_ms !== null ? `${p.response_time_ms}ms` : "-"}
                    {p.status_code ? ` · HTTP ${p.status_code}` : ""}
                  </p>
                </div>
                {statusBadge(p.status)}
              </div>
            ))}
          </div>
        )}

        {/* Ping History Table */}
        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>CRM</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Response Time</TableHead>
                <TableHead>HTTP Code</TableHead>
                <TableHead>Error</TableHead>
                <TableHead>Pinged At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No ping history. Click "Ping All CRMs Now" to start.
                  </TableCell>
                </TableRow>
              ) : (
                pings.slice(0, 100).map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium text-sm whitespace-nowrap">{p.crm_label || p.state_key}</TableCell>
                    <TableCell>{statusBadge(p.status)}</TableCell>
                    <TableCell className="text-sm font-mono">{p.response_time_ms !== null ? `${p.response_time_ms}ms` : "-"}</TableCell>
                    <TableCell className="text-sm">{p.status_code || "-"}</TableCell>
                    <TableCell className="text-xs text-destructive max-w-[200px] truncate">{p.error_message || "-"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(p.pinged_at).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default CrmPingDashboard;

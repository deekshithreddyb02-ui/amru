import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, RefreshCw, Database, CloudUpload, AlertTriangle, CheckCircle2 } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { toast } from "sonner";

interface Row {
  table: string;
  lovable: number;
  external: number | null;
}

export default function CrmDbAnalytics() {
  const navigate = useNavigate();
  const { isSuperAdmin, loading: roleLoading } = useUserRole();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("db-analytics", { body: { op: "stats" } });
    if (error || !data?.ok) {
      toast.error("Failed to load analytics: " + (error?.message || data?.error || "unknown"));
    } else {
      setRows(data.rows || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (roleLoading) return;
    if (!isSuperAdmin) { navigate("/crm"); return; }
    load();
  }, [isSuperAdmin, roleLoading, navigate]);

  const handleSync = async () => {
    setSyncing(true);
    toast.info("Syncing all tables to external database...");
    const { data, error } = await supabase.functions.invoke("db-analytics", { body: { op: "sync" } });
    if (error || !data?.ok) {
      toast.error("Sync failed: " + (error?.message || data?.error || "unknown"));
    } else {
      const failed = (data.results || []).filter((r: any) => !r.ok);
      if (failed.length === 0) toast.success(`Synced ${data.results.length} tables successfully`);
      else toast.warning(`Synced with ${failed.length} table errors — check details`);
    }
    setSyncing(false);
    await load();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const totals = rows.reduce(
    (a, r) => ({ lovable: a.lovable + r.lovable, external: a.external + (r.external ?? 0) }),
    { lovable: 0, external: 0 },
  );
  const drift = rows.filter((r) => r.external !== null && r.lovable !== r.external).length;
  const missing = rows.filter((r) => r.external === null).length;

  const chartData = rows
    .filter((r) => r.lovable > 0 || (r.external ?? 0) > 0)
    .sort((a, b) => b.lovable - a.lovable)
    .slice(0, 25)
    .map((r) => ({ name: r.table.replace(/^crm_/, ""), Lovable: r.lovable, External: r.external ?? 0 }));

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/crm")} className="gap-2 mb-2">
              <ArrowLeft className="h-4 w-4" />Back to CRM
            </Button>
            <h1 className="text-3xl font-serif">Database analytics</h1>
            <p className="text-sm text-muted-foreground">Row counts across Lovable Cloud and external Supabase</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={load} disabled={loading || syncing} className="gap-2">
              <RefreshCw className="h-4 w-4" />Refresh
            </Button>
            <Button onClick={handleSync} disabled={syncing} className="gap-2">
              {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CloudUpload className="h-4 w-4" />}
              Sync both
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card><CardContent className="p-4 text-center">
            <Database className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">{totals.lovable.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Lovable rows</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <Database className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">{totals.external.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">External rows</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <AlertTriangle className="h-5 w-5 mx-auto mb-1 text-amber-500" />
            <p className="text-2xl font-bold">{drift}</p>
            <p className="text-xs text-muted-foreground">Tables out of sync</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <AlertTriangle className="h-5 w-5 mx-auto mb-1 text-destructive" />
            <p className="text-2xl font-bold">{missing}</p>
            <p className="text-xs text-muted-foreground">Missing externally</p>
          </CardContent></Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Top tables — Lovable vs External</CardTitle></CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No data</p>
            ) : (
              <ChartContainer
                config={{
                  Lovable: { label: "Lovable", color: "hsl(var(--primary))" },
                  External: { label: "External", color: "hsl(var(--muted-foreground))" },
                }}
                className="h-[420px] w-full"
              >
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-40} textAnchor="end" height={100} interval={0} />
                  <YAxis allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Bar dataKey="Lovable" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="External" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">All tables ({rows.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2">Table</th>
                    <th className="py-2 text-right">Lovable</th>
                    <th className="py-2 text-right">External</th>
                    <th className="py-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const diff = r.external === null ? null : r.lovable - r.external;
                    return (
                      <tr key={r.table} className="border-b hover:bg-muted/40">
                        <td className="py-2 font-mono text-xs">{r.table}</td>
                        <td className="py-2 text-right font-medium">{r.lovable.toLocaleString()}</td>
                        <td className="py-2 text-right font-medium">{r.external === null ? "—" : r.external.toLocaleString()}</td>
                        <td className="py-2 text-right">
                          {r.external === null ? (
                            <Badge variant="destructive">missing</Badge>
                          ) : diff === 0 ? (
                            <Badge variant="outline" className="gap-1"><CheckCircle2 className="h-3 w-3" />in sync</Badge>
                          ) : (
                            <Badge variant="secondary">{diff! > 0 ? `+${diff}` : diff}</Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, AlertTriangle, Database, Gauge, Info, RotateCcw, Zap } from "lucide-react";
import { perfMonitor } from "@/lib/perfMonitor";
import { usePerfSnapshot, useRenderTiming, useRouteTiming } from "@/hooks/usePerfMonitor";
import { detectBottlenecks, summarizeLikelyCause, type Bottleneck } from "@/lib/perfBottlenecks";
import type { CrmWorkspace } from "@/hooks/useCrmWorkspaces";

type Ctx = { workspace: CrmWorkspace; myRole: string };

const fmt = (ms: number) => `${ms.toFixed(0)}ms`;
const tone = (ms: number) =>
  ms < 100 ? "text-emerald-600" : ms < 500 ? "text-amber-600" : "text-red-600";

export default function CrmPerfMonitor() {
  useOutletContext<Ctx>();
  useRouteTiming();
  useRenderTiming("CrmPerfMonitor");
  const snap = usePerfSnapshot();
  const bottlenecks = useMemo(() => detectBottlenecks(snap), [snap]);
  const summary = useMemo(() => summarizeLikelyCause(bottlenecks), [bottlenecks]);

  const stats = useMemo(() => {
    const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
    const contactQ = snap.queries.filter((q) => q.label.startsWith("crm_contacts"));
    return {
      routesCount: snap.routes.length,
      routesAvg: avg(snap.routes.map((r) => r.ms)),
      queriesCount: snap.queries.length,
      queriesAvg: avg(snap.queries.map((q) => q.ms)),
      queriesFailed: snap.queries.filter((q) => !q.ok).length,
      contactQueries: contactQ.length,
      contactAvg: avg(contactQ.map((q) => q.ms)),
      rendersAvg: avg(snap.renders.map((r) => r.ms)),
    };
  }, [snap]);

  const cards = [
    { label: "Routes tracked", value: stats.routesCount, sub: `avg ${fmt(stats.routesAvg)}`, Icon: Gauge },
    { label: "Queries run", value: stats.queriesCount, sub: `avg ${fmt(stats.queriesAvg)} · ${stats.queriesFailed} failed`, Icon: Database },
    { label: "Contacts queries", value: stats.contactQueries, sub: `avg ${fmt(stats.contactAvg)}`, Icon: Activity },
    { label: "Render avg", value: fmt(stats.rendersAvg), sub: `${snap.renders.length} samples`, Icon: Activity },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif">Performance Monitor</h1>
          <p className="text-muted-foreground text-sm mt-1">
            In-session route load times, query counts, and render durations.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => perfMonitor.clear()}>
          <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Clear
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map(({ label, value, sub, Icon }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0">
              <CardTitle className="text-xs text-muted-foreground font-normal">{label}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-semibold">{value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <BottlenecksPanel items={bottlenecks} summary={summary} />

      <div className="grid lg:grid-cols-3 gap-4">

        <SamplesCard title="Route load times" empty="Navigate around the CRM to record samples.">
          {snap.routes.map((r, i) => (
            <Row key={i} left={r.path} right={<span className={tone(r.ms)}>{fmt(r.ms)}</span>} at={r.at} />
          ))}
        </SamplesCard>

        <SamplesCard title="Queries" empty="No queries recorded yet.">
          {snap.queries.map((q, i) => (
            <Row
              key={i}
              left={
                <span className="flex items-center gap-2">
                  {q.label}
                  {!q.ok && <Badge variant="destructive" className="h-4 text-[10px]">fail</Badge>}
                </span>
              }
              right={<span className={tone(q.ms)}>{fmt(q.ms)}</span>}
              at={q.at}
            />
          ))}
        </SamplesCard>

        <SamplesCard title="Render durations" empty="No renders recorded yet.">
          {snap.renders.map((r, i) => (
            <Row key={i} left={r.component} right={<span className={tone(r.ms)}>{fmt(r.ms)}</span>} at={r.at} />
          ))}
        </SamplesCard>
      </div>
    </div>
  );
}

function SamplesCard({
  title, empty, children,
}: { title: string; empty: string; children: React.ReactNode }) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : !!children;
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm">{title}</CardTitle></CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[420px] overflow-y-auto divide-y">
          {hasChildren ? children : (
            <div className="p-6 text-center text-xs text-muted-foreground">{empty}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Row({ left, right, at }: { left: React.ReactNode; right: React.ReactNode; at: number }) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2 text-xs">
      <div className="min-w-0 flex-1 truncate font-mono">{left}</div>
      <div className="text-muted-foreground tabular-nums">{new Date(at).toLocaleTimeString()}</div>
      <div className="font-semibold tabular-nums w-14 text-right">{right}</div>
    </div>
  );
}

import type { RouteSample, QuerySample, RenderSample } from "@/lib/perfMonitor";

export type Severity = "info" | "warn" | "critical";

export type Bottleneck = {
  id: string;
  severity: Severity;
  category: "query" | "render" | "route" | "pattern";
  title: string;
  detail: string;
  suggestion: string;
  metric?: string;
};

// Thresholds (ms)
const Q_WARN = 400, Q_CRIT = 1200;
const R_WARN = 50, R_CRIT = 200;
const ROUTE_WARN = 800, ROUTE_CRIT = 2000;

const groupBy = <T, K extends string>(arr: T[], key: (t: T) => K) => {
  const m = new Map<K, T[]>();
  for (const x of arr) {
    const k = key(x);
    const arr2 = m.get(k);
    if (arr2) arr2.push(x); else m.set(k, [x]);
  }
  return m;
};

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const p95 = (xs: number[]) => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(s.length * 0.95))];
};

export function detectBottlenecks(snap: {
  routes: RouteSample[];
  queries: QuerySample[];
  renders: RenderSample[];
}): Bottleneck[] {
  const out: Bottleneck[] = [];

  // --- Queries: group by label ---
  const byQ = groupBy(snap.queries, (q) => q.label);
  for (const [label, items] of byQ) {
    const durations = items.map((i) => i.ms);
    const a = avg(durations);
    const max = Math.max(...durations);
    const fails = items.filter((i) => !i.ok).length;
    const sev: Severity = max > Q_CRIT || a > Q_WARN ? (max > Q_CRIT ? "critical" : "warn") : "info";
    if (sev !== "info") {
      out.push({
        id: `q:${label}`,
        severity: sev,
        category: "query",
        title: `Slow query: ${label}`,
        detail: `${items.length} call(s), avg ${a.toFixed(0)}ms, p95 ${p95(durations).toFixed(0)}ms, max ${max.toFixed(0)}ms${fails ? `, ${fails} failed` : ""}.`,
        suggestion:
          a > Q_CRIT
            ? "Add database indexes on filter columns, narrow selected fields, or paginate the result set."
            : "Consider caching, narrowing the select(), or moving this query off the critical path.",
        metric: `${max.toFixed(0)}ms`,
      });
    }
    if (fails > 0 && sev === "info") {
      out.push({
        id: `qfail:${label}`,
        severity: "warn",
        category: "query",
        title: `Failing query: ${label}`,
        detail: `${fails} of ${items.length} call(s) failed.`,
        suggestion: "Check RLS policies, network, and error handling for this query.",
      });
    }
  }

  // Repeated identical queries (N+1 / duplicate fetch pattern)
  for (const [label, items] of byQ) {
    if (items.length >= 5) {
      // window: 10s
      const recent = items.filter((i) => Date.now() - i.at < 10_000);
      if (recent.length >= 5) {
        out.push({
          id: `qdup:${label}`,
          severity: "warn",
          category: "pattern",
          title: `Repeated query (${recent.length}× in 10s): ${label}`,
          detail: "The same query ran many times in a short window — likely a render loop or missing memoization.",
          suggestion: "Memoize the calling component, lift the fetch into a parent, or cache the result.",
          metric: `${recent.length}×`,
        });
      }
    }
  }

  // --- Renders: group by component ---
  const byR = groupBy(snap.renders, (r) => r.component);
  for (const [component, items] of byR) {
    const durations = items.map((i) => i.ms);
    const a = avg(durations);
    const max = Math.max(...durations);
    const sev: Severity = max > R_CRIT || a > R_WARN ? (max > R_CRIT ? "critical" : "warn") : "info";
    if (sev !== "info") {
      out.push({
        id: `r:${component}`,
        severity: sev,
        category: "render",
        title: `Slow component: ${component}`,
        detail: `${items.length} sample(s), avg ${a.toFixed(0)}ms, max ${max.toFixed(0)}ms.`,
        suggestion:
          a > R_CRIT
            ? "Break this component up, virtualize long lists, or memoize children with React.memo / useMemo."
            : "Memoize handlers/derived data with useCallback / useMemo to reduce re-render cost.",
        metric: `${max.toFixed(0)}ms`,
      });
    }
    if (items.length >= 10) {
      out.push({
        id: `rmany:${component}`,
        severity: "warn",
        category: "pattern",
        title: `Frequent re-renders: ${component}`,
        detail: `${items.length} renders recorded — component may be re-rendering on every parent update.`,
        suggestion: "Wrap in React.memo, stabilize props with useMemo/useCallback, or split state down.",
        metric: `${items.length}×`,
      });
    }
  }

  // --- Routes ---
  const byRoute = groupBy(snap.routes, (r) => r.path);
  for (const [path, items] of byRoute) {
    const durations = items.map((i) => i.ms);
    const max = Math.max(...durations);
    const a = avg(durations);
    if (max > ROUTE_WARN) {
      const sev: Severity = max > ROUTE_CRIT ? "critical" : "warn";
      out.push({
        id: `route:${path}`,
        severity: sev,
        category: "route",
        title: `Slow route: ${path}`,
        detail: `${items.length} load(s), avg ${a.toFixed(0)}ms, max ${max.toFixed(0)}ms.`,
        suggestion:
          "Defer non-critical data fetches, lazy-load heavy children, and ensure the route's queries are parallelized.",
        metric: `${max.toFixed(0)}ms`,
      });
    }
  }

  // Sort: critical > warn > info, then by metric desc
  const sevRank = { critical: 0, warn: 1, info: 2 } as const;
  out.sort((a, b) => sevRank[a.severity] - sevRank[b.severity]);
  return out;
}

export function summarizeLikelyCause(items: Bottleneck[]): string {
  if (!items.length) return "No bottlenecks detected. Performance is within target thresholds.";
  const crit = items.filter((i) => i.severity === "critical");
  const top = (crit[0] ?? items[0]);
  const buckets = {
    query: items.filter((i) => i.category === "query").length,
    render: items.filter((i) => i.category === "render").length,
    route: items.filter((i) => i.category === "route").length,
    pattern: items.filter((i) => i.category === "pattern").length,
  };
  const dominant = Object.entries(buckets).sort((a, b) => b[1] - a[1])[0];
  const area =
    dominant[0] === "query" ? "database queries"
    : dominant[0] === "render" ? "component rendering"
    : dominant[0] === "route" ? "route loading"
    : "repeated work / re-renders";
  return `Likely cause: ${area}. Worst offender — ${top.title} (${top.metric ?? top.severity}).`;
}

// Lightweight in-memory performance monitor for CRM
// Tracks route load times, supabase query counts/durations, and render durations.

export type RouteSample = { path: string; ms: number; at: number };
export type QuerySample = { label: string; ms: number; at: number; ok: boolean };
export type RenderSample = { component: string; ms: number; at: number };

type Listener = () => void;

const MAX = 100;
const routes: RouteSample[] = [];
const queries: QuerySample[] = [];
const renders: RenderSample[] = [];
const listeners = new Set<Listener>();

const push = <T,>(arr: T[], item: T) => {
  arr.push(item);
  if (arr.length > MAX) arr.shift();
  listeners.forEach((l) => l());
};

export const perfMonitor = {
  recordRoute(path: string, ms: number) {
    push(routes, { path, ms, at: Date.now() });
  },
  recordQuery(label: string, ms: number, ok = true) {
    push(queries, { label, ms, at: Date.now(), ok });
  },
  recordRender(component: string, ms: number) {
    push(renders, { component, ms, at: Date.now() });
  },
  snapshot() {
    return {
      routes: [...routes].reverse(),
      queries: [...queries].reverse(),
      renders: [...renders].reverse(),
    };
  },
  clear() {
    routes.length = 0;
    queries.length = 0;
    renders.length = 0;
    listeners.forEach((l) => l());
  },
  subscribe(l: Listener) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

// Helper to time a promise (e.g. a supabase query)
export async function timeQuery<T>(label: string, p: PromiseLike<T>): Promise<T> {
  const t = performance.now();
  try {
    const r = await p;
    perfMonitor.recordQuery(label, performance.now() - t, true);
    return r;
  } catch (e) {
    perfMonitor.recordQuery(label, performance.now() - t, false);
    throw e;
  }
}

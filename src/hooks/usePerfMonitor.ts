import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useLocation } from "react-router-dom";
import { perfMonitor } from "@/lib/perfMonitor";

// Subscribe to the perf monitor store
export function usePerfSnapshot() {
  const getSnap = () => perfMonitor.snapshot();
  // useSyncExternalStore returns the cached snapshot, but our snapshot returns
  // fresh arrays. We wrap in useState to refresh on listener events.
  const [, force] = useState(0);
  useEffect(() => perfMonitor.subscribe(() => force((n) => n + 1)), []);
  return getSnap();
}

// Record route navigation duration (from path change to next paint)
export function useRouteTiming() {
  const loc = useLocation();
  const startRef = useRef<number>(performance.now());
  useEffect(() => {
    startRef.current = performance.now();
    // Measure on next frame after route mounts
    const raf = requestAnimationFrame(() => {
      const ms = performance.now() - startRef.current;
      perfMonitor.recordRoute(loc.pathname, ms);
    });
    return () => cancelAnimationFrame(raf);
  }, [loc.pathname]);
}

// Record render duration of a component (mount + commit)
export function useRenderTiming(component: string) {
  const start = useRef(performance.now());
  useEffect(() => {
    perfMonitor.recordRender(component, performance.now() - start.current);
  }, [component]);
}

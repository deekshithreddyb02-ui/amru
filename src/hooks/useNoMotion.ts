import { useIsMobile } from "./use-mobile";

const TABLET_BREAKPOINT = 1024;

/**
 * Returns true when animations should be disabled (mobile & tablet viewports < 1024px).
 * Components should use this to skip framer-motion entrance/hover animations.
 */
export function useNoMotion(): boolean {
  const isMobile = useIsMobile(); // < 768
  // Also check tablet range (768–1023)
  if (typeof window === "undefined") return false;
  return isMobile || window.innerWidth < TABLET_BREAKPOINT;
}

/** Helper: returns empty animation props when motion is disabled */
export function motionProps(noMotion: boolean, props: Record<string, unknown>) {
  if (noMotion) return {};
  return props;
}

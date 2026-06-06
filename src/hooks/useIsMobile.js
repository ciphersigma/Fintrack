import { useSyncExternalStore } from "react";

// Resize-aware mobile breakpoint check. Replaces ad-hoc window.innerWidth
// reads during render, which never update on rotate/resize.
// Uses useSyncExternalStore so it stays in sync without setState-in-effect.
export default function useIsMobile(breakpoint = 640) {
  const query = `(max-width: ${breakpoint - 1}px)`;

  const subscribe = (callback) => {
    const mql = window.matchMedia(query);
    mql.addEventListener("change", callback);
    return () => mql.removeEventListener("change", callback);
  };

  const getSnapshot = () =>
    typeof window !== "undefined" && window.matchMedia(query).matches;

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

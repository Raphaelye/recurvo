import { useSegments } from "expo-router";
import { useEffect } from "react";

import { trackScreen } from "@/lib/posthog";

// Sends a screen view whenever the route changes. Uses the route pattern, e.g.
// "/subscription/[id]", so ids never reach analytics. Groups such as "(tabs)"
// are left out. Used once, by the root layout.
export function useScreenTracking() {
  const segments = useSegments();
  const route = `/${segments.filter((segment) => !segment.startsWith("(")).join("/")}`;

  useEffect(() => {
    trackScreen(route);
  }, [route]);
}

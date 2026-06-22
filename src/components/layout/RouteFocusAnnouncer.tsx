"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  MAIN_CONTENT_ID,
  routeAnnouncementForPath,
} from "@/lib/ui/route-announcement";

export function RouteFocusAnnouncer() {
  const pathname = usePathname();
  const didMount = useRef(false);
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    const next = routeAnnouncementForPath(pathname);
    setAnnouncement(next.announcement);

    if (!didMount.current) {
      didMount.current = true;
      return undefined;
    }

    const frame = window.requestAnimationFrame(() => {
      document.getElementById(MAIN_CONTENT_ID)?.focus({ preventScroll: true });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  return (
    <div className="sr-only" aria-live="polite" aria-atomic="true">
      {announcement}
    </div>
  );
}

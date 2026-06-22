"use client";

import { useEffect, useRef } from "react";

export function useChatAutoScroll(trigger: unknown) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    bottomRef.current?.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  }, [trigger]);

  return bottomRef;
}

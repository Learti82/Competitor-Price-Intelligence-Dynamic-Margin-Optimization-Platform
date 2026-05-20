"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const SHORTCUTS: Record<string, string> = {
  g: "/dashboard",
  p: "/dashboard/products",
  c: "/dashboard/competitors",
  r: "/dashboard/recommendations",
  a: "/dashboard/alerts",
  n: "/dashboard/analytics",
  s: "/dashboard/stores",
  u: "/dashboard/audit",
  l: "/dashboard/rules",
  m: "/dashboard/promotions",
  i: "/dashboard/import",
  o: "/dashboard/onboarding",
};

export function useKeyboardShortcuts(onHelp: () => void) {
  const router = useRouter();

  useEffect(() => {
    let gPressed = false;
    let gTimer: ReturnType<typeof setTimeout>;

    function handler(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === "?") {
        onHelp();
        return;
      }

      if (e.key === "g") {
        gPressed = true;
        clearTimeout(gTimer);
        gTimer = setTimeout(() => { gPressed = false; }, 1000);
        return;
      }

      if (gPressed) {
        gPressed = false;
        clearTimeout(gTimer);
        const path = SHORTCUTS[e.key];
        if (path) router.push(path);
        return;
      }
    }

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [router, onHelp]);
}

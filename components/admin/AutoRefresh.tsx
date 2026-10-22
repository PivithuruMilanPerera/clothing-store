"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/** Re-fetches server data on an interval and when the tab regains focus. */
export function AutoRefresh({ intervalMs = 60_000 }: { intervalMs?: number }) {
  const router = useRouter();
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  useEffect(() => {
    const initial = setTimeout(() => setUpdatedAt(new Date()), 0);

    function refresh() {
      if (document.visibilityState !== "visible") return;
      router.refresh();
      setUpdatedAt(new Date());
    }

    const timer = setInterval(refresh, intervalMs);
    document.addEventListener("visibilitychange", refresh);

    return () => {
      clearTimeout(initial);
      clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [router, intervalMs]);

  return (
    <p className="font-label flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-green-600" />
      </span>
      Live
      {updatedAt
        ? ` · updated ${updatedAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`
        : null}
    </p>
  );
}

"use client";

import { useLinkStatus } from "next/link";
import { LoadingCircle } from "@/components/ui/loading-circle/LoadingCircle";
import { cn } from "@/lib/utils";

type LinkPendingCircleProps = {
  className?: string;
};

/** Shows a leading loading circle while a parent Next.js Link is navigating. */
export function LinkPendingCircle({ className }: LinkPendingCircleProps) {
  const { pending } = useLinkStatus();

  if (!pending) {
    return null;
  }

  return <LoadingCircle className={cn(className)} />;
}

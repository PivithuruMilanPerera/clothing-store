import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type BadgeProps = {
  children: ReactNode;
  className?: string;
};

export function Badge({ children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "font-label text-xs font-bold uppercase tracking-[0.15em] leading-none bg-primary px-2 py-1 text-on-primary",
        className,
      )}
    >
      {children}
    </span>
  );
}

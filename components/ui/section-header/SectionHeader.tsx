import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  action?: { label: string; href: string };
  className?: string;
  titleClassName?: string;
};

export function SectionHeader({
  title,
  subtitle,
  action,
  className,
  titleClassName,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "mb-4 flex items-end justify-between gap-4 md:mb-6",
        className,
      )}
    >
      <div>
        <h2
          className={cn(
            "font-headline text-2xl font-extrabold leading-tight tracking-tight uppercase md:text-[2.25rem] text-on-surface",
            titleClassName,
          )}
        >
          {title}
        </h2>
        {subtitle ? (
          <p className="font-body mt-1 text-sm leading-normal text-on-surface-variant">
            {subtitle}
          </p>
        ) : null}
      </div>
      {action ? (
        <Link
          href={action.href}
          className="font-label text-xs font-bold uppercase tracking-[0.15em] leading-none inline-flex items-center gap-2 text-on-surface-variant hover:text-primary"
        >
          {action.label}
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
      ) : null}
    </div>
  );
}

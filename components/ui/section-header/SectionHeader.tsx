import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

type SectionHeaderProps = {
  title: string;
  action?: { label: string; href: string };
  className?: string;
  titleClassName?: string;
};

export function SectionHeader({
  title,
  action,
  className,
  titleClassName,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "mb-6 flex items-end justify-between gap-4 md:mb-10",
        className,
      )}
    >
      <h2 className={cn("type-headline-lg text-on-surface", titleClassName)}>
        {title}
      </h2>
      {action ? (
        <Link
          href={action.href}
          className="type-label-uppercase inline-flex items-center gap-2 text-on-surface-variant hover:text-primary"
        >
          {action.label}
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
      ) : null}
    </div>
  );
}

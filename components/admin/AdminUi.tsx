import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const adminInputClass =
  "font-body w-full min-w-0 max-w-full border border-outline-variant/50 bg-surface-container-lowest px-3 py-2 text-sm text-on-surface outline-none focus:border-primary disabled:opacity-60";

export const adminLabelClass =
  "mb-1.5 block font-label text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant";

export const adminPrimaryButtonClass =
  "font-label inline-flex items-center justify-center gap-2 border border-primary bg-primary px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-on-primary hover:opacity-90 disabled:opacity-50";

export const adminSecondaryButtonClass =
  "font-label inline-flex items-center justify-center gap-2 border border-outline-variant px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-on-surface hover:bg-surface-container-low disabled:opacity-50";

export const adminDangerButtonClass =
  "font-label inline-flex items-center justify-center gap-2 border border-error/30 bg-error/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-error hover:bg-error/15 disabled:opacity-50";

export function AdminPageHeader({
  eyebrow = "Admin",
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <p className="font-label text-xs font-bold uppercase tracking-[0.15em] leading-none text-on-surface-variant">
          {eyebrow}
        </p>
        <h1 className="font-headline mt-2 text-2xl font-extrabold uppercase leading-tight tracking-tight text-on-surface md:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="font-body mt-2 max-w-2xl text-sm text-on-surface-variant">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function AdminPanel({
  title,
  description,
  actions,
  children,
  className,
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "min-w-0 border border-outline-variant bg-surface-container-lowest",
        className,
      )}
    >
      {title || actions ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant px-4 py-3 sm:px-5 sm:py-4">
          <div>
            {title ? (
              <h2 className="font-label text-xs font-bold uppercase tracking-[0.15em] text-on-surface">
                {title}
              </h2>
            ) : null}
            {description ? (
              <p className="font-body mt-1 text-xs text-on-surface-variant">
                {description}
              </p>
            ) : null}
          </div>
          {actions}
        </div>
      ) : null}
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

export function AdminStatCard({
  label,
  value,
  hint,
  href,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  href?: string;
  tone?: "default" | "warning" | "danger" | "success";
}) {
  const toneClass = {
    default: "text-on-surface",
    warning: "text-amber-700",
    danger: "text-error",
    success: "text-green-700",
  }[tone];

  const content = (
    <>
      <p className="font-label text-[10px] font-bold uppercase leading-snug tracking-[0.12em] text-on-surface-variant sm:tracking-[0.15em]">
        {label}
      </p>
      <p
        className={cn(
          "font-headline mt-2 break-words text-xl font-extrabold tabular-nums leading-none sm:mt-3 sm:text-2xl md:text-3xl",
          toneClass,
        )}
      >
        {value}
      </p>
      {hint ? (
        <p className="font-body mt-1 text-xs text-on-surface-variant">{hint}</p>
      ) : null}
    </>
  );

  const className =
    "block min-w-0 border border-outline-variant bg-surface-container-lowest p-4 sm:p-5";

  return href ? (
    <Link href={href} className={cn(className, "hover:border-primary")}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  );
}

export function AdminBadge({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "font-label inline-block whitespace-nowrap border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] leading-none",
        className ?? "border-outline-variant text-on-surface-variant",
      )}
    >
      {children}
    </span>
  );
}

export function AdminEmptyState({ children }: { children: ReactNode }) {
  return (
    <p className="font-body py-6 text-center text-sm text-on-surface-variant">
      {children}
    </p>
  );
}

export function AdminNotice({
  tone = "info",
  children,
}: {
  tone?: "info" | "error" | "success";
  children: ReactNode;
}) {
  const toneClass = {
    info: "border-amber-500/30 bg-amber-500/10 text-amber-800",
    error: "border-error/30 bg-error/10 text-error",
    success: "border-green-600/30 bg-green-600/10 text-green-700",
  }[tone];

  return (
    <div className={cn("font-body border px-4 py-3 text-sm", toneClass)}>
      {children}
    </div>
  );
}

export function formatAdminDate(
  value: string | null | undefined,
  withTime = true,
) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
    timeZone: "Asia/Colombo",
  }).format(new Date(value));
}

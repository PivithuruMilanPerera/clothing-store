import type { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import { LinkPendingCircle } from "@/components/ui/loading-circle/LinkPendingCircle";
import { LoadingCircle } from "@/components/ui/loading-circle/LoadingCircle";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "inverted" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  href?: string;
  isLoading?: boolean;
  prefetch?: boolean;
  children: ReactNode;
};

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-on-primary border border-primary hover:bg-on-primary hover:border-on-primary hover:text-primary",
  secondary:
    "bg-surface-container-low text-on-surface border border-transparent hover:bg-primary hover:text-on-primary",
  inverted:
    "bg-on-primary text-primary border border-on-primary hover:bg-primary hover:text-on-primary",
  ghost:
    "bg-transparent text-primary border-[1.5px] border-primary hover:bg-primary hover:text-on-primary",
};

export function Button({
  variant = "primary",
  href,
  isLoading = false,
  prefetch,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const isDisabled = Boolean(disabled || isLoading);
  const classes = cn(
    "font-label text-xs font-bold uppercase tracking-[0.15em] leading-none inline-flex items-center justify-center gap-2 px-6 py-3 cursor-pointer transition-none disabled:pointer-events-none disabled:opacity-50",
    variantStyles[variant],
    className,
  );

  const content = (
    <>
      {isLoading ? <LoadingCircle /> : href ? <LinkPendingCircle /> : null}
      {children}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        prefetch={prefetch}
        className={cn(classes, isDisabled && "pointer-events-none opacity-50")}
        aria-disabled={isDisabled || undefined}
        aria-busy={isLoading || undefined}
        tabIndex={isDisabled ? -1 : undefined}
        onClick={
          isDisabled
            ? (event) => {
                event.preventDefault();
              }
            : undefined
        }
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={classes}
      disabled={isDisabled}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {content}
    </button>
  );
}

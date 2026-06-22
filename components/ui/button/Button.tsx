import type { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "inverted" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  href?: string;
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
  className,
  children,
  ...props
}: ButtonProps) {
  const classes = cn(
    "font-label text-xs font-bold uppercase tracking-[0.15em] leading-none inline-flex items-center justify-center px-6 py-3 cursor-pointer transition-none disabled:pointer-events-none disabled:opacity-50",
    variantStyles[variant],
    className,
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" className={classes} {...props}>
      {children}
    </button>
  );
}

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  children: ReactNode;
  variant?: "light" | "dark";
};

export function IconButton({
  label,
  children,
  variant = "dark",
  className,
  ...props
}: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        "inline-flex h-10 w-10 items-center justify-center border transition-none",
        variant === "light"
          ? "border-on-primary bg-on-primary text-primary hover:bg-primary hover:text-on-primary"
          : "border-primary bg-primary text-on-primary hover:bg-on-primary hover:text-primary",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

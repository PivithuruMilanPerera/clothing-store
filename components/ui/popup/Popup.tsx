"use client";

import { useEffect, type ReactNode } from "react";
import { XIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

type PopupProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
};

const sizeStyles = {
  sm: "max-w-md",
  md: "max-w-2xl",
  lg: "max-w-4xl",
};

export function Popup({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: PopupProps) {
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-80 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="popup-title"
        aria-describedby={description ? "popup-description" : undefined}
        className={cn(
          "relative z-10 flex max-h-[92vh] w-full flex-col border border-outline-variant bg-surface-container-lowest shadow-lg sm:max-h-[88vh] sm:rounded-lg",
          sizeStyles[size],
        )}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-outline-variant px-5 py-4 md:px-6">
          <div className="min-w-0">
            <h2
              id="popup-title"
              className="font-headline text-base font-bold uppercase leading-tight tracking-wide text-on-surface md:text-lg"
            >
              {title}
            </h2>
            {description ? (
              <p
                id="popup-description"
                className="font-body mt-1 text-sm leading-normal text-on-surface-variant"
              >
                {description}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="shrink-0 text-on-surface-variant hover:text-on-surface"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        {children ? (
          <div className="flex-1 overflow-y-auto px-5 py-5 md:px-6">
            {children}
          </div>
        ) : null}

        {footer ? (
          <div className="shrink-0 border-t border-outline-variant px-5 py-4 md:px-6">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

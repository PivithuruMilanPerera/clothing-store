import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export function Input({ label, id, className, ...props }: InputProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={inputId} className="type-label-uppercase text-on-surface">
        {label}
      </label>
      <input
        id={inputId}
        className="border-b border-primary bg-transparent pb-2 text-on-surface outline-none focus:border-b-2"
        {...props}
      />
    </div>
  );
}

import { cn } from "@/lib/utils";

type LoadingCircleProps = {
  className?: string;
};

/** Leading spinner circle for button loading states. */
export function LoadingCircle({ className }: LoadingCircleProps) {
  return (
    <span
      className={cn(
        "inline-block h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent",
        className,
      )}
      aria-hidden="true"
    />
  );
}

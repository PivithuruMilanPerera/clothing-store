import { cn } from "@/lib/utils";

type ProductCornerRibbonProps = {
  label: string;
  variant?: "default" | "sale";
};

export function ProductCornerRibbon({
  label,
  variant = "default",
}: ProductCornerRibbonProps) {
  return (
    <span
      className={cn(
        "absolute top-3 right-[-40px] z-10 w-[145px] rotate-45 py-1 text-center text-[13px] font-medium text-white uppercase md:top-4 md:right-[-36px]",
        variant === "sale" ? "bg-error" : "bg-neutral-900",
      )}
    >
      {label}
    </span>
  );
}

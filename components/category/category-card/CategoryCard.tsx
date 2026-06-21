import Image from "next/image";
import Link from "next/link";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";

type CategoryCardProps = {
  category: Category;
  className?: string;
};

export function CategoryCard({ category, className }: CategoryCardProps) {
  return (
    <Link
      href={category.href}
      className={cn(
        "group relative block aspect-[3/5] overflow-hidden md:aspect-[2/3.5]",
        className,
      )}
    >
      <Image
        src={category.image}
        alt={category.name}
        fill
        sizes="25vw"
        className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
      />
      <div className="absolute inset-0 bg-linear-to-t from-primary/70 via-primary/15 to-transparent transition-opacity duration-300 group-hover:from-primary/80" />

      <span
        className="absolute top-6 left-4 origin-top-left -rotate-90 font-label text-[10px] font-bold uppercase tracking-[0.15em] text-on-primary/80 md:text-[0.6875rem]"
        aria-hidden="true"
      >
        {category.name}
      </span>

      <h3 className="text-lg lg:text-2xl font-bold absolute bottom-5 left-5 uppercase text-on-primary transition-transform duration-300 group-hover:-translate-y-1 md:bottom-6 md:left-6">
        {category.name}
      </h3>
    </Link>
  );
}

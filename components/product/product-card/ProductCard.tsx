import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";

type ProductCardProps = {
  product: Product;
  className?: string;
};

export function ProductCard({ product, className }: ProductCardProps) {
  return (
    <article className={cn("group h-full", className)}>
      <Link href={product.href} className="flex h-full flex-col">
        <div className="relative aspect-4/5 overflow-hidden bg-surface-container-low">
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          />
          {product.badge ? (
            <span className="absolute top-3 right-[-36px] z-10 w-[130px] rotate-45 bg-neutral-900 py-1 text-center text-xs font-medium text-white uppercase md:top-4 md:right-[-32px]">
              {product.badge}
            </span>
          ) : null}
        </div>

        <div className="mt-0 flex min-h-[132px] flex-1 flex-col justify-center space-y-1 bg-gray-50 px-3 py-5 text-center md:min-h-[150px] md:px-4 md:py-6">
          <p className="font-label text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant md:text-xs md:tracking-[0.15em]">
            {product.brand}
          </p>
          <h3 className="type-product-name text-on-surface">{product.name}</h3>
          <p className="font-body text-[0.95rem] font-medium tabular-nums text-on-surface md:text-lg">
            ${product.price}
          </p>
        </div>
      </Link>
    </article>
  );
}

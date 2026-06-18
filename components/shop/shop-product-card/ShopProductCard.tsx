import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui";
import type { ShopProduct } from "@/lib/types";
import { cn } from "@/lib/utils";

type ShopProductCardProps = {
  product: ShopProduct;
  className?: string;
};

export function ShopProductCard({ product, className }: ShopProductCardProps) {
  return (
    <article className={cn("group", className)}>
      <Link href={product.href} className="block">
        <div className="relative aspect-square overflow-hidden bg-surface-container-low">
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          />
          {product.badge ? (
            <Badge className="absolute top-3 right-3">{product.badge}</Badge>
          ) : null}
        </div>

        <div className="mt-4 space-y-1">
          <h3 className="type-headline-md text-sm font-bold text-on-surface md:text-base">
            {product.name}
          </h3>
          <p className="type-body-md font-medium tabular-nums text-on-surface">
            ${product.price.toFixed(2)}
          </p>
        </div>
      </Link>
    </article>
  );
}

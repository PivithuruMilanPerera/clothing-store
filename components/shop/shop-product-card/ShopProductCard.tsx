import Image from "next/image";
import Link from "next/link";
import { ProductCornerRibbon } from "@/components/product/product-corner-ribbon/ProductCornerRibbon";
import { formatSaleLabel } from "@/lib/pricing";
import type { ShopProduct } from "@/lib/types";
import { cn, formatPrice } from "@/lib/utils";

type ShopProductCardProps = {
  product: ShopProduct;
  className?: string;
};

export function ShopProductCard({ product, className }: ShopProductCardProps) {
  const saleLabel = formatSaleLabel(
    product.discountType,
    product.discountValue,
    product.basePrice,
    product.discountAmount,
  );
  const ribbonLabel = saleLabel ?? product.badge;

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
          {ribbonLabel ? (
            <ProductCornerRibbon
              label={ribbonLabel}
              variant={saleLabel ? "sale" : "default"}
            />
          ) : null}
        </div>

        <div className="mt-4 space-y-1">
          <h3 className="font-headline text-sm font-bold text-on-surface md:text-base">
            {product.name}
          </h3>
          {product.discountAmount > 0 ? (
            <p className="font-body text-base leading-normal font-medium tabular-nums text-on-surface">
              <span className="mr-2 text-on-surface-variant line-through">
                {formatPrice(product.basePrice)}
              </span>
              <span className="text-error">{formatPrice(product.price)}</span>
            </p>
          ) : (
            <p className="font-body text-base leading-normal font-medium tabular-nums text-on-surface">
              {formatPrice(product.price)}
            </p>
          )}
        </div>
      </Link>
    </article>
  );
}

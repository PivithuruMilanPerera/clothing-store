import Image from "next/image";
import Link from "next/link";
import { ProductCardShopNow } from "@/components/product/product-card/ProductCardShopNow";
import { ProductCornerRibbon } from "@/components/product/product-corner-ribbon/ProductCornerRibbon";
import { getColorLabel } from "@/lib/cart";
import { formatSaleLabel } from "@/lib/pricing";
import type { Product } from "@/lib/types";
import { cn, formatPrice } from "@/lib/utils";

type ProductCardProps = {
  product: Product;
  className?: string;
};

export function ProductCard({ product, className }: ProductCardProps) {
  const swatches =
    product.colorOptions && product.colorOptions.length > 0
      ? product.colorOptions
      : (product.colors ?? []).map((colorId) => ({
          id: colorId,
          name: getColorLabel(colorId),
          hex: "",
        }));
  const saleLabel = formatSaleLabel(
    product.discountType,
    product.discountValue,
    product.basePrice,
    product.discountAmount,
  );
  const ribbonLabel = saleLabel ?? product.badge;
  const isOutOfStock = product.inventory <= 0;

  return (
    <article
      className={cn(
        "group h-full border border-ghost-border transition-shadow duration-300 hover:shadow-md",
        className,
      )}
    >
      <Link href={product.href} className="flex h-full flex-col">
        {/* ── Image ── */}
        <div className="relative aspect-4/5 overflow-hidden bg-surface-container-low">
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
            className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.06]"
          />

          {ribbonLabel ? (
            <ProductCornerRibbon
              label={ribbonLabel}
              variant={saleLabel ? "sale" : "default"}
            />
          ) : null}

          {isOutOfStock ? (
            <span className="pointer-events-none absolute top-1.5 left-1.5 z-10 bg-neutral-900 px-1.5 py-1 font-label text-[8px] font-bold uppercase leading-none tracking-[0.08em] text-white sm:top-2 sm:left-2 sm:px-2 sm:text-[9px] sm:tracking-[0.12em] md:top-2.5 md:left-2.5 md:px-2.5 md:text-[10px] md:tracking-[0.14em]">
              Out of stock
            </span>
          ) : (
            <span className="pointer-events-none absolute top-1.5 left-1.5 z-10 inline-flex items-center gap-1 font-label text-[8px] font-bold uppercase leading-none tracking-[0.08em] text-green-600 sm:top-2 sm:left-2 sm:gap-1.5 sm:text-[9px] sm:tracking-[0.12em] md:top-2.5 md:left-2.5 md:text-[10px] md:tracking-[0.14em]">
              <span className="relative flex h-1.5 w-1.5 shrink-0 md:h-2 md:w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75 motion-reduce:animate-none" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-600 md:h-2 md:w-2" />
              </span>
              In stock
            </span>
          )}

          <ProductCardShopNow />
        </div>

        {/* ── Info ── */}
        <div className="flex flex-1 flex-col items-center gap-1.5 bg-surface-container-lowest px-2.5 py-3.5 text-center sm:px-3 sm:py-4 md:px-4 md:py-5">
          {/* Brand */}
          <p className="font-label text-[9px] font-bold uppercase tracking-[0.32em] text-on-surface-variant md:text-[10px] md:tracking-[0.38em]">
            {product.brand}
          </p>

          {/* Name */}
          <h3 className="text-sm leading-snug text-on-surface font-semibold sm:text-base lg:text-md xl:text-lg">
            {product.name}
          </h3>

          {/* Divider */}
          <span className="block h-px w-6 bg-outline-variant" />

          {/* Price */}
          {product.discountAmount > 0 ? (
            <p className="font-headline text-sm font-bold tabular-nums text-on-surface md:text-[0.95rem]">
              <span className="mr-2 text-on-surface-variant line-through">
                {formatPrice(product.basePrice, { decimals: 0 })}
              </span>
              <span className="text-error">
                {formatPrice(product.price, { decimals: 0 })}
              </span>
            </p>
          ) : (
            <p className="font-headline text-sm font-bold tabular-nums text-on-surface md:text-[0.95rem]">
              {formatPrice(product.price, { decimals: 0 })}
            </p>
          )}

          {/* Color swatches */}
          {swatches.length > 0 ? (
            <div className="flex w-full flex-wrap justify-center gap-2 pt-0.5">
              {swatches.map((color) => (
                <span
                  key={color.id}
                  title={color.name}
                  aria-label={color.name}
                  className="h-4 w-4 border border-outline-variant transition-[outline,transform] duration-200 hover:scale-110 hover:outline-1 hover:outline-offset-1 hover:outline-outline md:h-[18px] md:w-[18px]"
                  style={{ backgroundColor: color.hex || "#e5e5e5" }}
                />
              ))}
            </div>
          ) : null}

          {/* Size boxes */}
          {product.sizes && product.sizes.length > 0 ? (
            <div className="flex w-full flex-wrap justify-center gap-1.5 pt-0.5">
              {product.sizes.map((size) => (
                <span
                  key={size}
                  aria-label={`Size ${size}`}
                  className="font-label min-w-8 border border-outline-variant px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] leading-none text-on-surface-variant md:min-w-9 md:text-[10px]"
                >
                  {size}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </Link>
    </article>
  );
}

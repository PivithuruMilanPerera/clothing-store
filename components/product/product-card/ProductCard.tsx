import Image from "next/image";
import Link from "next/link";
import { ProductCornerRibbon } from "@/components/product/product-corner-ribbon/ProductCornerRibbon";
import { colorSwatchStyles, getColorLabel } from "@/lib/cart";
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
  const isLowStock = product.inventory > 0 && product.inventory <= 10;

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

          {/* Hover overlay: dim + "Shop Now" strip slides up */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-500 group-hover:bg-black/15"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-full bg-primary py-3 text-center transition-transform duration-500 ease-out group-hover:translate-y-0"
          >
            <span className="font-label text-[10px] font-bold uppercase tracking-[0.2em] text-on-primary md:text-[11px]">
              Shop Now
            </span>
          </div>
        </div>

        {/* ── Info ── */}
        <div className="flex flex-1 flex-col items-center justify-center gap-1.5 bg-surface-container-lowest px-2.5 py-3.5 text-center sm:px-3 sm:py-4 md:px-4 md:py-5">
          {/* Brand */}
          <p className="font-label text-[9px] font-bold uppercase tracking-[0.32em] text-on-surface-variant md:text-[10px] md:tracking-[0.38em]">
            {product.brand}
          </p>

          {/* Name */}
          <h3 className="text-sm leading-snug text-on-surface font-semibold sm:text-base lg:text-lg xl:text-xl">
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
            <div className="flex justify-center gap-1.5 pt-0.5">
              {swatches.map((color) => (
                <span
                  key={color.id}
                  title={color.name}
                  aria-label={color.name}
                  className={cn(
                    "h-3.5 w-3.5 border border-outline-variant transition-[outline,transform] duration-200 hover:scale-110 hover:outline-1 hover:outline-offset-1 hover:outline-outline",
                    !color.hex && colorSwatchStyles[color.id],
                  )}
                  style={color.hex ? { backgroundColor: color.hex } : undefined}
                />
              ))}
            </div>
          ) : null}

          {isOutOfStock ? (
            <p className="font-label pt-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-error md:text-[11px]">
              Out of stock
            </p>
          ) : isLowStock ? (
            <p className="font-label pt-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-orange-400 md:text-[11px]">
              Low Stock
            </p>
          ) : null}
        </div>
      </Link>
    </article>
  );
}

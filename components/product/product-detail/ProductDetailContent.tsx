"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/components/cart";
import { ChevronDownIcon, SearchIcon, XIcon } from "@/components/icons";
import { ProductCornerRibbon } from "@/components/product/product-corner-ribbon/ProductCornerRibbon";
import { Button } from "@/components/ui";
import { colorSwatchStyles, getColorHex, getColorLabel } from "@/lib/cart";
import { formatSaleLabel } from "@/lib/pricing";
import type { ProductDetail, ProductImage } from "@/lib/types";
import { cn, formatPrice } from "@/lib/utils";

type ProductDetailContentProps = {
  product: ProductDetail;
};

type AccordionItemProps = {
  title: string;
  content: string;
  isOpen: boolean;
  onToggle: () => void;
};

function AccordionItem({ title, content, isOpen, onToggle }: AccordionItemProps) {
  return (
    <div className="border-b border-outline-variant">
      <button
        type="button"
        onClick={onToggle}
        className="font-label text-xs font-bold uppercase tracking-[0.15em] leading-none flex w-full items-center justify-between py-4 text-left text-on-surface"
        aria-expanded={isOpen}
      >
        {title}
        <ChevronDownIcon
          className={cn(
            "h-4 w-4 shrink-0 transition-transform duration-200",
            isOpen && "rotate-180",
          )}
        />
      </button>
      {isOpen ? (
        <p className="font-body text-base leading-normal pb-4 text-on-surface-variant">{content}</p>
      ) : null}
    </div>
  );
}

function ProductImageGallery({
  images,
  productName,
  ribbonLabel,
  ribbonVariant = "default",
  activeImageIndex,
  onImageChange,
}: {
  images: ProductImage[];
  productName: string;
  ribbonLabel?: string;
  ribbonVariant?: "default" | "sale";
  activeImageIndex: number;
  onImageChange: (index: number) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const activeImage = images[activeImageIndex] ?? images[0];

  useEffect(() => {
    if (!isExpanded) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsExpanded(false);
      }
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isExpanded]);

  if (!activeImage) {
    return null;
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className="group relative aspect-square w-full overflow-hidden bg-surface-container-low"
          aria-label="Expand product image"
        >
          <Image
            src={activeImage.src}
            alt={activeImage.alt || productName}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 55vw"
            className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.02]"
          />
          {ribbonLabel ? (
            <ProductCornerRibbon label={ribbonLabel} variant={ribbonVariant} />
          ) : null}
          <span className="absolute bottom-3 right-3 flex items-center gap-1.5 border border-outline-variant bg-surface-container-lowest/95 px-2.5 py-1.5 font-body text-xs text-on-surface shadow-sm">
            <SearchIcon className="h-3.5 w-3.5" />
            Click to expand
          </span>
        </button>

        {images.length > 1 ? (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {images.map((image, index) => {
              const isActive = index === activeImageIndex;

              return (
                <button
                  key={`${image.src}-${index}`}
                  type="button"
                  onClick={() => onImageChange(index)}
                  className={cn(
                    "relative h-16 w-16 shrink-0 overflow-hidden bg-surface-container-low sm:h-[4.5rem] sm:w-[4.5rem]",
                    isActive
                      ? "border-2 border-neutral-800"
                      : "border border-outline-variant opacity-80 hover:opacity-100",
                  )}
                  aria-label={`View image ${index + 1}`}
                  aria-pressed={isActive}
                >
                  <Image
                    src={image.src}
                    alt={image.alt || `${productName} image ${index + 1}`}
                    fill
                    sizes="72px"
                    className="object-cover object-center"
                  />
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      {isExpanded ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setIsExpanded(false)}
          role="dialog"
          aria-modal="true"
          aria-label={`${productName} image preview`}
        >
          <button
            type="button"
            onClick={() => setIsExpanded(false)}
            className="absolute right-4 top-4 text-on-primary hover:opacity-80"
            aria-label="Close image preview"
          >
            <XIcon className="h-6 w-6" />
          </button>

          <div
            className="relative h-[min(80vh,900px)] w-[min(90vw,900px)]"
            onClick={(event) => event.stopPropagation()}
          >
            <Image
              src={activeImage.src}
              alt={activeImage.alt || productName}
              fill
              sizes="90vw"
              className="object-contain"
            />
          </div>
        </div>
      ) : null}
    </>
  );
}

function getDefaultSize(sizes: string[]): string {
  if (sizes.includes("M")) {
    return "M";
  }

  return sizes[0];
}

function getImagesForColor(
  images: ProductImage[],
  colorId: string,
  colorOptions: ProductDetail["colorOptions"],
): ProductImage[] {
  if (images.length === 0) {
    return images;
  }

  const colorName = getColorLabel(colorId, colorOptions).trim().toLowerCase();
  const hasTaggedImages = images.some((image) => Boolean(image.colorName));

  if (!hasTaggedImages) {
    return images;
  }

  const tagged = images.filter(
    (image) => image.colorName?.trim().toLowerCase() === colorName,
  );
  if (tagged.length > 0) {
    return tagged;
  }

  const shared = images.filter((image) => !image.colorName);
  return shared.length > 0 ? shared : images;
}

function getFallbackImageIndexForColor(
  images: ProductImage[],
  colorId: string,
  colorIds: string[],
): number {
  const hasTaggedImages = images.some((image) => Boolean(image.colorName));
  if (hasTaggedImages) {
    return 0;
  }

  const colorIndex = colorIds.indexOf(colorId);
  if (colorIndex >= 0 && colorIndex < images.length) {
    return colorIndex;
  }

  return 0;
}

export function ProductDetailContent({ product }: ProductDetailContentProps) {
  const router = useRouter();
  const { addItem } = useCart();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState(
    product.colors[0],
  );
  const [selectedSize, setSelectedSize] = useState(
    getDefaultSize(product.sizes),
  );
  const [quantity, setQuantity] = useState(1);
  const [sizeError, setSizeError] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);

  const galleryImages = getImagesForColor(
    product.images,
    selectedColor,
    product.colorOptions,
  );
  const activeImage = galleryImages[activeImageIndex] ?? galleryImages[0] ?? product.images[0];
  const saleLabel = formatSaleLabel(
    product.discountType,
    product.discountValue,
    product.basePrice,
    product.discountAmount,
  );
  const ribbonLabel = saleLabel ?? product.badge;
  const isOutOfStock = product.inventory <= 0;
  const isLowStock = product.inventory > 0 && product.inventory <= 10;
  const maxQuantity = Math.max(product.inventory, 1);

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    setActiveImageIndex(
      getFallbackImageIndexForColor(product.images, color, product.colors),
    );
  };

  const handleAddToCart = () => {
    if (isOutOfStock) {
      return;
    }

    if (!selectedSize) {
      setSizeError(true);
      return;
    }

    setSizeError(false);
    addItem({
      slug: product.slug,
      name: product.name,
      image: activeImage?.src ?? product.images[0]?.src ?? "",
      price: product.price,
      color: selectedColor,
      size: selectedSize,
      quantity: Math.min(quantity, product.inventory),
    });
    router.push("/cart");
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-12 xl:gap-16">
      <ProductImageGallery
        images={galleryImages}
        productName={product.name}
        ribbonLabel={ribbonLabel}
        ribbonVariant={saleLabel ? "sale" : "default"}
        activeImageIndex={activeImageIndex}
        onImageChange={setActiveImageIndex}
      />

      <div className="flex flex-col">
        <h1 className="font-headline text-[2rem] font-extrabold leading-tight uppercase md:text-5xl md:tracking-tight text-on-surface">
          {product.name}
        </h1>
        <p className="font-body text-lg leading-relaxed mt-3 font-medium tabular-nums text-on-surface md:mt-4">
          {product.discountAmount > 0 ? (
            <>
              <span className="mr-2 text-on-surface-variant line-through">
                {formatPrice(product.basePrice)}
              </span>
              <span className="text-error">{formatPrice(product.price)}</span>
            </>
          ) : (
            formatPrice(product.price)
          )}
        </p>
        {isLowStock ? (
          <p className="font-body mt-2 text-sm font-medium text-error">
            Almost out of stock
          </p>
        ) : null}
        {isOutOfStock ? (
          <p className="font-body mt-2 text-sm font-medium text-error">
            Out of stock
          </p>
        ) : null}

        <div className="mt-8 border-t border-outline-variant pt-8">
          <p className="font-label text-xs font-bold uppercase tracking-[0.15em] leading-none text-on-surface">
            Color: {getColorLabel(selectedColor, product.colorOptions)}
          </p>
          <div className="mt-3 flex gap-2">
            {product.colors.map((color) => {
              const isActive = color === selectedColor;
              const swatchStyle = colorSwatchStyles[color];
              const hex = getColorHex(color, product.colorOptions);

              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => handleColorSelect(color)}
                  className={cn(
                    "h-8 w-8 border border-outline-variant transition-shadow",
                    swatchStyle,
                    isActive && "ring-1 ring-primary ring-offset-2",
                  )}
                  style={!swatchStyle && hex ? { backgroundColor: hex } : undefined}
                  aria-label={getColorLabel(color, product.colorOptions)}
                  aria-pressed={isActive}
                />
              );
            })}
          </div>
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between gap-4">
            <p className="font-label text-xs font-bold uppercase tracking-[0.15em] leading-none text-on-surface">
              Size: {selectedSize}
            </p>
            <button
              type="button"
              className="font-body text-base leading-normal text-on-surface-variant underline underline-offset-4 hover:text-on-surface"
            >
              Size Guide
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {product.sizes.map((size) => {
              const isActive = size === selectedSize;

              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => {
                    setSelectedSize(size);
                    setSizeError(false);
                  }}
                  className={cn(
                    "font-label text-xs font-bold uppercase tracking-[0.15em] leading-none min-w-12 border px-4 py-2.5 transition-colors",
                    isActive
                      ? "border-primary bg-primary text-on-primary"
                      : "border-outline-variant bg-surface-container-lowest text-on-surface hover:border-primary",
                  )}
                  aria-pressed={isActive}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="shrink-0">
            <p className="font-label text-xs font-bold uppercase tracking-[0.15em] leading-none text-on-surface">
              Quantity
            </p>
            <div
              className={cn(
                "mt-3 flex h-14 items-center border border-outline-variant",
                isOutOfStock && "opacity-50",
              )}
            >
              <button
                type="button"
                disabled={isOutOfStock}
                onClick={() =>
                  setQuantity((current) => Math.max(1, current - 1))
                }
                className="font-label flex h-full min-w-14 items-center justify-center text-lg font-bold text-on-surface hover:bg-surface-container-low disabled:pointer-events-none"
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="font-body flex h-full min-w-16 items-center justify-center border-x border-outline-variant text-lg tabular-nums text-on-surface">
                {quantity}
              </span>
              <button
                type="button"
                disabled={isOutOfStock || quantity >= maxQuantity}
                onClick={() =>
                  setQuantity((current) =>
                    Math.min(maxQuantity, current + 1),
                  )
                }
                className="font-label flex h-full min-w-14 items-center justify-center text-lg font-bold text-on-surface hover:bg-surface-container-low disabled:pointer-events-none disabled:opacity-40"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </div>

          <Button
            className={cn(
              "h-14 w-full flex-1",
              isOutOfStock &&
                "border-neutral-400 bg-neutral-400 text-white hover:border-neutral-400 hover:bg-neutral-400 hover:text-white",
            )}
            disabled={isOutOfStock}
            onClick={handleAddToCart}
          >
            {isOutOfStock ? "Out of Stock" : "Add to Cart"}
          </Button>
        </div>
        {sizeError ? (
          <p className="font-body text-base leading-normal mt-2 text-error">
            Please select a size before adding to cart.
          </p>
        ) : null}

        <p className="font-body text-base leading-normal mt-8 text-on-surface-variant">
          {product.description}
        </p>

        <div className="mt-8">
          <AccordionItem
            title="Materials & Care"
            content={product.materialsCare}
            isOpen={openAccordion === "materials"}
            onToggle={() =>
              setOpenAccordion((current) =>
                current === "materials" ? null : "materials",
              )
            }
          />
          <AccordionItem
            title="Shipping & Returns"
            content={product.shippingReturns}
            isOpen={openAccordion === "shipping"}
            onToggle={() =>
              setOpenAccordion((current) =>
                current === "shipping" ? null : "shipping",
              )
            }
          />
        </div>
      </div>
    </div>
  );
}

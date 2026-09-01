"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/components/cart";
import { ChevronDownIcon, SearchIcon, XIcon } from "@/components/icons";
import { ProductCornerRibbon } from "@/components/product/product-corner-ribbon/ProductCornerRibbon";
import { Button } from "@/components/ui";
import { getColorHex, getColorLabel } from "@/lib/cart";
import {
  getVariantInventory,
  isLowStock as hasLowStockLevel,
  isOutOfStock as isStockDepleted,
} from "@/lib/inventory";
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
                    "relative h-16 w-16 shrink-0 overflow-hidden bg-surface-container-low transition-all sm:h-[4.5rem] sm:w-[4.5rem]",
                    isActive
                      ? "border-2 border-primary ring-1 ring-primary"
                      : "border border-outline-variant opacity-75 hover:opacity-100",
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

function resolveSelectedVariantStock(
  product: ProductDetail,
  selectedColor: string,
  selectedSize: string,
): number | null {
  if (!product.variantInventory || product.variantInventory.length === 0) {
    return product.inventory;
  }

  const hasColors = product.colors.length > 0;
  const hasSizes = product.sizes.length > 0;

  if (hasColors && hasSizes) {
    return selectedSize
      ? getVariantInventory(
          product.variantInventory,
          selectedColor,
          selectedSize,
        )
      : null;
  }

  if (hasColors) {
    return getVariantInventory(product.variantInventory, selectedColor, "");
  }

  if (hasSizes) {
    return selectedSize
      ? getVariantInventory(product.variantInventory, "", selectedSize)
      : null;
  }

  return product.inventory;
}

function getImagesForColor(
  images: ProductImage[],
  colorId: string,
): ProductImage[] {
  if (images.length === 0) {
    return images;
  }

  const hasTaggedImages = images.some((image) => Boolean(image.colorId));

  if (!hasTaggedImages) {
    return images;
  }

  const tagged = images.filter((image) => image.colorId === colorId);
  if (tagged.length > 0) {
    return tagged;
  }

  const shared = images.filter((image) => !image.colorId);
  return shared.length > 0 ? shared : images;
}

export function ProductDetailContent({ product }: ProductDetailContentProps) {
  const router = useRouter();
  const { addItem } = useCart();
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Customer selects Color (default to first available or empty)
  const [selectedColor, setSelectedColor] = useState(
    product.colors[0] ?? "",
  );

  // Customer explicitly selects Size (starts empty when sizes exist to require choice)
  const [selectedSize, setSelectedSize] = useState<string>("");

  // Customer selects Quantity
  const [quantity, setQuantity] = useState(1);
  const [sizeError, setSizeError] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);

  // Selecting a colour variant instantly updates gallery images and hero display
  const galleryImages = useMemo(
    () => getImagesForColor(product.images, selectedColor),
    [product.images, selectedColor],
  );

  const activeImage =
    galleryImages[activeImageIndex] ?? galleryImages[0] ?? product.images[0];

  const saleLabel = formatSaleLabel(
    product.discountType,
    product.discountValue,
    product.basePrice,
    product.discountAmount,
  );
  const ribbonLabel = saleLabel ?? product.badge;

  const selectedVariantStock = resolveSelectedVariantStock(
    product,
    selectedColor,
    selectedSize,
  );

  const isProductOutOfStock = isStockDepleted(product.inventory);
  const isVariantOutOfStock =
    selectedVariantStock !== null && isStockDepleted(selectedVariantStock);
  const isVariantLowStock =
    selectedVariantStock !== null && hasLowStockLevel(selectedVariantStock);

  const isOutOfStock =
    isProductOutOfStock ||
    (selectedSize ? isVariantOutOfStock : false);

  const maxQuantity = Math.max(
    selectedVariantStock !== null
      ? selectedVariantStock
      : product.inventory,
    1,
  );

  // Ensure quantity stays within available stock when variant changes
  useEffect(() => {
    if (selectedVariantStock !== null && selectedVariantStock > 0) {
      setQuantity((current) =>
        Math.min(current, selectedVariantStock),
      );
    }
  }, [selectedColor, selectedSize, selectedVariantStock]);

  // Selecting colour variant instantly updates the displayed product image and resets active index
  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    setActiveImageIndex(0);
    setSizeError(false);
  };

  const handleSizeSelect = (size: string) => {
    setSelectedSize(size);
    setSizeError(false);
  };

  const handleAddToCart = () => {
    // 1. Check size selection if product has sizes
    if (product.sizes.length > 0 && !selectedSize) {
      setSizeError(true);
      return;
    }

    // 2. Check stock availability
    if (isOutOfStock || (selectedVariantStock !== null && selectedVariantStock <= 0)) {
      return;
    }

    setSizeError(false);

    const availableLimit =
      selectedVariantStock !== null ? selectedVariantStock : product.inventory;
    const finalQuantity = Math.max(1, Math.min(quantity, Math.max(1, availableLimit)));

    addItem({
      slug: product.slug,
      name: product.name,
      image: activeImage?.src ?? product.images[0]?.src ?? "",
      price: product.price,
      color: selectedColor,
      colorName: getColorLabel(selectedColor, product.colorOptions),
      size: selectedSize || "One Size",
      quantity: finalQuantity,
    });

    router.push("/cart");
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-12 xl:gap-16">
      {/* ── Product Image Gallery (Instantly updates on colour select) ── */}
      <ProductImageGallery
        images={galleryImages}
        productName={product.name}
        ribbonLabel={ribbonLabel}
        ribbonVariant={saleLabel ? "sale" : "default"}
        activeImageIndex={activeImageIndex}
        onImageChange={setActiveImageIndex}
      />

      {/* ── Product Details & Selections ── */}
      <div className="flex flex-col">
        <h1 className="font-headline text-[2rem] font-extrabold leading-tight uppercase md:text-5xl md:tracking-tight text-on-surface">
          {product.name}
        </h1>

        {/* Pricing */}
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

        {/* Real-time stock status */}
        <div className="mt-2">
          {isOutOfStock ? (
            <span className="font-label inline-flex items-center gap-1.5 rounded-sm bg-error/10 px-2.5 py-1 text-xs font-bold uppercase tracking-[0.12em] text-error">
              ● Out of Stock
            </span>
          ) : isVariantLowStock ? (
            <span className="font-label inline-flex items-center gap-1.5 rounded-sm bg-orange-400/10 px-2.5 py-1 text-xs font-bold uppercase tracking-[0.12em] text-orange-400">
              ● Low Stock {selectedVariantStock !== null ? `(${selectedVariantStock} left)` : ""}
            </span>
          ) : selectedSize ? (
            <span className="font-label inline-flex items-center gap-1.5 rounded-sm bg-green-600/10 px-2.5 py-1 text-xs font-bold uppercase tracking-[0.12em] text-green-600">
              ● In Stock
            </span>
          ) : (
            <span className="font-label inline-flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant">
              Select size to see availability
            </span>
          )}
        </div>

        {/* ── 1. Colour Selection (Instantly updates image) ── */}
        {product.colors.length > 0 ? (
          <div className="mt-8 border-t border-outline-variant pt-8">
            <div className="flex items-center justify-between">
              <p className="font-label text-xs font-bold uppercase tracking-[0.15em] leading-none text-on-surface">
                Colour:{" "}
                <span className="font-body font-normal text-on-surface-variant">
                  {getColorLabel(selectedColor, product.colorOptions)}
                </span>
              </p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2.5">
              {product.colors.map((color) => {
                const isActive = color === selectedColor;
                const hex = getColorHex(color, product.colorOptions);
                const label = getColorLabel(color, product.colorOptions);

                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => handleColorSelect(color)}
                    className={cn(
                      "group relative h-9 w-9 rounded-full border border-outline-variant p-0.5 transition-all duration-200 hover:scale-105",
                      isActive
                        ? "ring-2 ring-primary ring-offset-2 ring-offset-surface-container-lowest"
                        : "hover:border-primary",
                    )}
                    aria-label={`Select colour ${label}`}
                    aria-pressed={isActive}
                    title={label}
                  >
                    <span
                      className="block h-full w-full rounded-full border border-black/10"
                      style={{ backgroundColor: hex ?? "#e5e5e5" }}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* ── 2. Size Selection ── */}
        {product.sizes.length > 0 ? (
          <div className="mt-8">
            <div className="flex items-center justify-between gap-4">
              <p
                className={cn(
                  "font-label text-xs font-bold uppercase tracking-[0.15em] leading-none",
                  sizeError ? "text-error" : "text-on-surface",
                )}
              >
                Size:{" "}
                {selectedSize ? (
                  <span className="font-body font-bold text-on-surface">
                    {selectedSize}
                  </span>
                ) : (
                  <span className="font-body font-normal text-on-surface-variant">
                    Please select
                  </span>
                )}
              </p>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {product.sizes.map((size) => {
                const isActive = size === selectedSize;
                const sizeStock = getVariantInventory(
                  product.variantInventory,
                  selectedColor,
                  size,
                );
                const isSizeOutOfStock = isStockDepleted(sizeStock);

                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => handleSizeSelect(size)}
                    className={cn(
                      "font-label relative min-w-14 border px-4 py-3 text-xs font-bold uppercase tracking-[0.15em] leading-none transition-all",
                      isActive
                        ? "border-primary bg-primary text-on-primary shadow-sm"
                        : isSizeOutOfStock
                          ? "border-dashed border-outline-variant/60 bg-surface-container-low text-on-surface-variant/50 hover:border-primary"
                          : "border-outline-variant bg-surface-container-lowest text-on-surface hover:border-primary",
                    )}
                    aria-pressed={isActive}
                    aria-label={`Size ${size}${isSizeOutOfStock ? " (Out of stock)" : ""}`}
                  >
                    <span>{size}</span>
                    {isSizeOutOfStock && !isActive ? (
                      <span className="block text-[8px] font-medium lowercase tracking-normal text-error opacity-75">
                        sold out
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>

            {sizeError ? (
              <p className="font-body text-xs font-medium mt-2 text-error">
                Please select a size before adding to cart.
              </p>
            ) : null}
          </div>
        ) : null}

        {/* ── 3. Quantity Selection & Add to Cart ── */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="shrink-0">
            <p className="font-label text-xs font-bold uppercase tracking-[0.15em] leading-none text-on-surface">
              Quantity
            </p>
            <div
              className={cn(
                "mt-3 flex h-14 items-center border border-outline-variant bg-surface-container-lowest",
                (isOutOfStock || (selectedSize && selectedVariantStock !== null && selectedVariantStock <= 0)) &&
                  "opacity-50",
              )}
            >
              <button
                type="button"
                disabled={isOutOfStock || quantity <= 1}
                onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                className="font-label flex h-full min-w-14 items-center justify-center text-lg font-bold text-on-surface transition-colors hover:bg-surface-container-low disabled:pointer-events-none disabled:opacity-30"
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="font-body flex h-full min-w-16 items-center justify-center border-x border-outline-variant text-base font-semibold tabular-nums text-on-surface">
                {quantity}
              </span>
              <button
                type="button"
                disabled={
                  isOutOfStock ||
                  (selectedVariantStock !== null && quantity >= selectedVariantStock) ||
                  quantity >= maxQuantity
                }
                onClick={() =>
                  setQuantity((current) => Math.min(maxQuantity, current + 1))
                }
                className="font-label flex h-full min-w-14 items-center justify-center text-lg font-bold text-on-surface transition-colors hover:bg-surface-container-low disabled:pointer-events-none disabled:opacity-30"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </div>

          <Button
            className={cn(
              "h-14 w-full flex-1 uppercase tracking-[0.15em] font-bold text-xs transition-all",
              isOutOfStock
                ? "border-neutral-400 bg-neutral-400 text-white hover:border-neutral-400 hover:bg-neutral-400 cursor-not-allowed"
                : "",
            )}
            disabled={isOutOfStock}
            onClick={handleAddToCart}
          >
            {isOutOfStock
              ? "Out of Stock"
              : product.sizes.length > 0 && !selectedSize
                ? "Select Size"
                : "Add to Cart"}
          </Button>
        </div>

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

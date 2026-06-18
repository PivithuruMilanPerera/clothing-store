"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/components/cart";
import { ChevronDownIcon } from "@/components/icons";
import { Button } from "@/components/ui";
import { colorLabels } from "@/lib/cart";
import type { ProductColor, ProductDetail, ProductSize } from "@/lib/types";
import { cn } from "@/lib/utils";

type ProductDetailContentProps = {
  product: ProductDetail;
};

const colorSwatchStyles: Record<ProductColor, string> = {
  black: "bg-black",
  white: "bg-white",
  gray: "bg-neutral-400",
  cream: "bg-[#f0ebe3]",
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
        className="type-label-uppercase flex w-full items-center justify-between py-4 text-left text-on-surface"
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
        <p className="type-body-md pb-4 text-on-surface-variant">{content}</p>
      ) : null}
    </div>
  );
}

function getDefaultSize(sizes: ProductSize[]): ProductSize {
  if (sizes.includes("M")) {
    return "M";
  }

  return sizes[0];
}

export function ProductDetailContent({ product }: ProductDetailContentProps) {
  const router = useRouter();
  const { addItem } = useCart();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState<ProductColor>(
    product.colors[0],
  );
  const [selectedSize, setSelectedSize] = useState<ProductSize>(
    getDefaultSize(product.sizes),
  );
  const [sizeError, setSizeError] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);

  const activeImage = product.images[activeImageIndex] ?? product.images[0];

  const handleAddToCart = () => {
    if (!selectedSize) {
      setSizeError(true);
      return;
    }

    setSizeError(false);
    addItem({
      slug: product.slug,
      name: product.name,
      image: activeImage.src,
      price: product.price,
      color: selectedColor,
      size: selectedSize,
    });
    router.push("/cart");
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-12 xl:gap-16">
      <div className="flex flex-col gap-4 sm:flex-row lg:gap-5">
        <div className="order-2 flex gap-2 sm:order-1 sm:flex-col">
          {product.images.map((image, index) => {
            const isActive = index === activeImageIndex;

            return (
              <button
                key={`${image.src}-${index}`}
                type="button"
                onClick={() => setActiveImageIndex(index)}
                className={cn(
                  "relative aspect-square w-[4.5rem] shrink-0 overflow-hidden bg-surface-container-low sm:w-20",
                  isActive
                    ? "ring-1 ring-primary ring-offset-2 ring-offset-surface-container-lowest"
                    : "opacity-80 hover:opacity-100",
                )}
                aria-label={`View image ${index + 1}`}
                aria-pressed={isActive}
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  sizes="80px"
                  className="object-cover object-center"
                />
              </button>
            );
          })}
        </div>

        <div className="relative order-1 aspect-square flex-1 overflow-hidden bg-surface-container-low sm:order-2">
          <Image
            src={activeImage.src}
            alt={activeImage.alt}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 55vw"
            className="object-cover object-center"
          />
        </div>
      </div>

      <div className="flex flex-col">
        <h1 className="type-headline-lg-mobile md:type-headline-lg text-on-surface">
          {product.name}
        </h1>
        <p className="type-body-lg mt-3 font-medium tabular-nums text-on-surface md:mt-4">
          ${product.price.toFixed(2)}
        </p>

        <div className="mt-8 border-t border-outline-variant pt-8">
          <p className="type-label-uppercase text-on-surface">
            Color: {colorLabels[selectedColor]}
          </p>
          <div className="mt-3 flex gap-2">
            {product.colors.map((color) => {
              const isActive = color === selectedColor;

              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={cn(
                    "h-8 w-8 border border-outline-variant transition-shadow",
                    colorSwatchStyles[color],
                    isActive && "ring-1 ring-primary ring-offset-2",
                  )}
                  aria-label={colorLabels[color]}
                  aria-pressed={isActive}
                />
              );
            })}
          </div>
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between gap-4">
            <p className="type-label-uppercase text-on-surface">
              Size: {selectedSize}
            </p>
            <button
              type="button"
              className="type-body-md text-on-surface-variant underline underline-offset-4 hover:text-on-surface"
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
                    "type-label-uppercase min-w-12 border px-4 py-2.5 transition-colors",
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

        <Button className="mt-8 w-full py-4" onClick={handleAddToCart}>
          Add to Cart
        </Button>
        {sizeError ? (
          <p className="type-body-md mt-2 text-error">
            Please select a size before adding to cart.
          </p>
        ) : null}

        <p className="type-body-md mt-8 text-on-surface-variant">
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

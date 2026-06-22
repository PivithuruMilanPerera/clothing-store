"use client";

import { useState } from "react";
import {
  maxShopPrice,
  shopCategories,
  shopColors,
  shopProducts,
  shopSizes,
} from "@/data/shop";
import type { ProductCategory, SortOption } from "@/lib/types";
import { colorLabels, colorSwatchStyles } from "@/lib/cart";
import { filterProducts, sortProducts } from "@/lib/shop";
import { cn, formatPrice } from "@/lib/utils";
import { ProductCard } from "@/components/product";

type ShopFiltersProps = {
  selectedCategories: ProductCategory[];
  selectedSizes: string[];
  selectedColors: string[];
  maxPrice: number;
  onCategoryToggle: (category: ProductCategory) => void;
  onSizeToggle: (size: string) => void;
  onColorToggle: (color: string) => void;
  onMaxPriceChange: (price: number) => void;
};

function ShopFilters({
  selectedCategories,
  selectedSizes,
  selectedColors,
  maxPrice,
  onCategoryToggle,
  onSizeToggle,
  onColorToggle,
  onMaxPriceChange,
}: ShopFiltersProps) {
  return (
    <aside className="space-y-8">
      <FilterSection title="Category">
        <ul className="space-y-3">
          {shopCategories.map((category) => (
            <li key={category.id}>
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(category.id)}
                  onChange={() => onCategoryToggle(category.id)}
                  className="h-4 w-4 accent-primary"
                />
                <span className="font-body text-base leading-normal text-on-surface">
                  {category.label}
                </span>
              </label>
            </li>
          ))}
        </ul>
      </FilterSection>

      <FilterSection title="Size">
        <div className="flex flex-wrap gap-2">
          {shopSizes.map((size) => {
            const isActive = selectedSizes.includes(size);
            return (
              <button
                key={size}
                type="button"
                onClick={() => onSizeToggle(size)}
                className={cn(
                  "font-label text-xs font-bold uppercase tracking-[0.15em] leading-none min-w-10 border px-3 py-2 transition-colors",
                  isActive
                    ? "border-primary bg-primary text-on-primary"
                    : "border-outline-variant bg-surface-container-lowest text-on-surface hover:border-primary",
                )}
              >
                {size}
              </button>
            );
          })}
        </div>
      </FilterSection>

      <FilterSection title="Color">
        <div className="flex flex-wrap gap-2">
          {shopColors.map((color) => {
            const isActive = selectedColors.includes(color.id);

            return (
              <button
                key={color.id}
                type="button"
                onClick={() => onColorToggle(color.id)}
                className={cn(
                  "h-8 w-8 border border-outline-variant transition-shadow hover:scale-110",
                  colorSwatchStyles[color.id],
                  isActive && "ring-1 ring-primary ring-offset-2",
                )}
                aria-label={colorLabels[color.id]}
                aria-pressed={isActive}
              />
            );
          })}
        </div>
      </FilterSection>

      <FilterSection title="Price Range">
        <div className="space-y-3">
          <input
            type="range"
            min={0}
            max={maxShopPrice}
            step={10}
            value={maxPrice}
            onChange={(e) => onMaxPriceChange(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="font-body text-base leading-normal flex justify-between text-on-surface-variant">
            <span>{formatPrice(0, { decimals: 0 })}</span>
            <span>
              {formatPrice(
                maxPrice >= maxShopPrice ? maxShopPrice : maxPrice,
                { decimals: 0 },
              )}
              {maxPrice >= maxShopPrice ? "+" : ""}
            </span>
          </div>
        </div>
      </FilterSection>
    </aside>
  );
}

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-outline-variant pb-8 last:border-b-0">
      <h2 className="font-label text-xs font-bold uppercase tracking-[0.15em] leading-none mb-4 text-on-surface">{title}</h2>
      {children}
    </div>
  );
}

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "name", label: "Name" },
];

type ShopContentProps = {
  title: string;
  defaultCategories?: ProductCategory[];
};

export function ShopContent({ title, defaultCategories = [] }: ShopContentProps) {
  const [selectedCategories, setSelectedCategories] =
    useState<ProductCategory[]>(defaultCategories);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState(maxShopPrice);
  const [sort, setSort] = useState<SortOption>("newest");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const filtered = filterProducts(shopProducts, {
    categories: selectedCategories,
    sizes: selectedSizes,
    colors: selectedColors,
    maxPrice,
  });
  const products = sortProducts(filtered, sort);

  const toggleCategory = (category: ProductCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category],
    );
  };

  const toggleSize = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size],
    );
  };

  const toggleColor = (color: string) => {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color],
    );
  };

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 border-b border-gray-200 pb-6 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between md:mb-10 lg:gap-6">
        <div className="min-w-0 -mt-2">
          <h1 className="font-headline text-2xl font-extrabold leading-tight uppercase text-on-surface md:text-3xl md:tracking-tight lg:text-4xl">
            {title}
          </h1>
          <p className="font-body text-xs sm:text-sm leading-normal  text-on-surface-variant">
            Showing {products.length}{" "}
            {products.length === 1 ? "Product" : "Products"}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => setMobileFiltersOpen((open) => !open)}
            className="font-label text-xs font-bold uppercase tracking-[0.15em] leading-none border border-primary px-4 py-2 text-primary lg:hidden"
          >
            {mobileFiltersOpen ? "Hide Filters" : "Filters"}
          </button>

          <label className="flex min-w-0 items-center gap-2 sm:gap-3">
            <span className="font-label text-xs font-bold uppercase tracking-[0.15em] leading-none text-on-surface">
              Sort by:
            </span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="font-body text-base leading-normal cursor-pointer border-b border-primary bg-transparent pb-1 text-on-surface outline-none"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row lg:gap-6 xl:gap-8">
        <div
          className={cn(
            "w-full shrink-0 lg:block lg:w-56 xl:w-64",
            mobileFiltersOpen ? "block" : "hidden",
          )}
        >
          <ShopFilters
            selectedCategories={selectedCategories}
            selectedSizes={selectedSizes}
            selectedColors={selectedColors}
            maxPrice={maxPrice}
            onCategoryToggle={toggleCategory}
            onSizeToggle={toggleSize}
            onColorToggle={toggleColor}
            onMaxPriceChange={setMaxPrice}
          />
        </div>

        <div className="min-w-0 flex-1">
          {products.length > 0 ? (
            <div className="grid grid-cols-2 gap-x-3 gap-y-6 lg:grid-cols-3 lg:gap-x-3 lg:gap-y-6 xl:grid-cols-4 xl:gap-x-4 xl:gap-y-7">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <p className="font-body text-lg leading-relaxed py-16 text-center text-on-surface-variant">
              No products match your filters.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

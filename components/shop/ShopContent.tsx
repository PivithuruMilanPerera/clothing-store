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
import { filterProducts, sortProducts } from "@/lib/shop";
import { cn } from "@/lib/utils";
import { ShopProductCard } from "./shop-product-card/ShopProductCard";

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
                <span className="type-body-md text-on-surface">
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
                  "type-label-uppercase min-w-10 border px-3 py-2 transition-colors",
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
        <ul className="space-y-3">
          {shopColors.map((color) => (
            <li key={color.id}>
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectedColors.includes(color.id)}
                  onChange={() => onColorToggle(color.id)}
                  className="h-4 w-4 accent-primary"
                />
                <span className="type-body-md text-on-surface">
                  {color.label}
                </span>
              </label>
            </li>
          ))}
        </ul>
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
          <div className="type-body-md flex justify-between text-on-surface-variant">
            <span>$0</span>
            <span>${maxPrice >= maxShopPrice ? `${maxShopPrice}+` : maxPrice}</span>
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
      <h2 className="type-label-uppercase mb-4 text-on-surface">{title}</h2>
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
      <div className="mb-8 flex flex-col gap-4 border-b border-outline-variant pb-6 md:mb-10 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="type-headline-lg-mobile md:type-headline-lg text-on-surface">
            {title}
          </h1>
          <p className="type-body-md mt-2 text-on-surface-variant">
            Showing {products.length}{" "}
            {products.length === 1 ? "Product" : "Products"}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setMobileFiltersOpen((open) => !open)}
            className="type-label-uppercase border border-primary px-4 py-2 text-primary md:hidden"
          >
            {mobileFiltersOpen ? "Hide Filters" : "Filters"}
          </button>

          <label className="flex items-center gap-3">
            <span className="type-label-uppercase text-on-surface">
              Sort by:
            </span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="type-body-md cursor-pointer border-b border-primary bg-transparent pb-1 text-on-surface outline-none"
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

      <div className="flex gap-10 lg:gap-16">
        <div
          className={cn(
            "w-full shrink-0 md:block md:w-56 lg:w-64",
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
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
              {products.map((product) => (
                <ShopProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <p className="type-body-lg py-16 text-center text-on-surface-variant">
              No products match your filters.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

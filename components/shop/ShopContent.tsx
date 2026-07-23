"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ProductCategory, ShopProduct, SortOption } from "@/lib/types";
import type { ShopFilterColor } from "@/lib/product-types";
import { filterProducts, sortProducts } from "@/lib/shop";
import { buildShopHref } from "@/lib/shop-url";
import {
  getCategoryToggleSlugs,
  type ShopCategoryFilterNode,
} from "@/lib/category-tree";
import { cn, formatPrice } from "@/lib/utils";
import { ProductCard } from "@/components/product";
import { SearchIcon } from "@/components/icons";

function getCategorySelectionState(
  slugs: ProductCategory[],
  selectedCategories: ProductCategory[],
) {
  const selectedCount = slugs.filter((slug) =>
    selectedCategories.includes(slug),
  ).length;

  return {
    allSelected: selectedCount === slugs.length && slugs.length > 0,
    someSelected: selectedCount > 0 && selectedCount < slugs.length,
  };
}

function getActiveMainCategorySlugs(
  categories: ShopCategoryFilterNode[],
  selectedCategories: ProductCategory[],
): ProductCategory[] {
  return categories
    .filter((category) => {
      const slugs = getCategoryToggleSlugs(category);
      const { allSelected, someSelected } = getCategorySelectionState(
        slugs,
        selectedCategories,
      );

      return allSelected || someSelected;
    })
    .map((category) => category.id as ProductCategory);
}

type SubCategoryFilterItem = {
  category: ShopCategoryFilterNode;
  depth: number;
};

function getVisibleSubCategories(
  nodes: ShopCategoryFilterNode[],
  selectedMainSlugs: ProductCategory[],
): SubCategoryFilterItem[] {
  if (selectedMainSlugs.length === 0) {
    return [];
  }

  const items: SubCategoryFilterItem[] = [];

  for (const main of nodes) {
    if (!selectedMainSlugs.includes(main.id as ProductCategory)) {
      continue;
    }

    for (const child of main.children) {
      items.push({ category: child, depth: 0 });

      for (const nested of child.children) {
        items.push({ category: nested, depth: 1 });
      }
    }
  }

  return items;
}

function ensureParentSubCategoriesSelected(
  categories: ShopCategoryFilterNode[],
  selectedCategories: ProductCategory[],
): ProductCategory[] {
  const next = new Set(selectedCategories);

  for (const main of categories) {
    for (const child of main.children) {
      const hasNestedSelected = child.children.some((nested) =>
        next.has(nested.id as ProductCategory),
      );

      if (hasNestedSelected) {
        next.add(child.id as ProductCategory);
      }
    }
  }

  return [...next];
}

function findParentSubCategory(
  categories: ShopCategoryFilterNode[],
  categoryId: ProductCategory,
): ShopCategoryFilterNode | null {
  for (const main of categories) {
    for (const child of main.children) {
      if (child.children.some((nested) => nested.id === categoryId)) {
        return child;
      }
    }
  }

  return null;
}

function getCategoryUrlSlug(
  selectedCategories: ProductCategory[],
  categories: ShopCategoryFilterNode[],
): string | undefined {
  for (const main of categories) {
    const slugs = getCategoryToggleSlugs(main);
    const { allSelected } = getCategorySelectionState(
      slugs,
      selectedCategories,
    );

    if (allSelected) {
      return main.id;
    }
  }

  return undefined;
}

type ShopFiltersProps = {
  brands: string[];
  categories: ShopCategoryFilterNode[];
  sizes: string[];
  colors: ShopFilterColor[];
  maxShopPrice: number;
  selectedBrands: string[];
  selectedCategories: ProductCategory[];
  selectedSizes: string[];
  selectedColors: string[];
  maxPrice: number;
  onBrandToggle: (brand: string) => void;
  onMainCategoryToggle: (category: ShopCategoryFilterNode) => void;
  onSubCategoryToggle: (category: ShopCategoryFilterNode) => void;
  onSizeToggle: (size: string) => void;
  onColorToggle: (color: string) => void;
  onMaxPriceChange: (price: number) => void;
};

function ShopFilters({
  brands,
  categories,
  sizes,
  colors,
  maxShopPrice,
  selectedBrands,
  selectedCategories,
  selectedSizes,
  selectedColors,
  maxPrice,
  onBrandToggle,
  onMainCategoryToggle,
  onSubCategoryToggle,
  onSizeToggle,
  onColorToggle,
  onMaxPriceChange,
}: ShopFiltersProps) {
  const selectedMainSlugs = getActiveMainCategorySlugs(
    categories,
    selectedCategories,
  );

  const subCategories = getVisibleSubCategories(categories, selectedMainSlugs);

  return (
    <aside className="space-y-8">
      {categories.length > 0 ? (
        <FilterSection title="Main Category">
          <ul className="space-y-3">
            {categories.map((category) => {
              const slugs = getCategoryToggleSlugs(category);
              const { allSelected, someSelected } = getCategorySelectionState(
                slugs,
                selectedCategories,
              );

              return (
                <li key={category.id}>
                  <label className="flex cursor-pointer items-center gap-3">
                    <input
                      ref={(input) => {
                        if (input) {
                          input.indeterminate = someSelected;
                        }
                      }}
                      type="checkbox"
                      checked={allSelected}
                      onChange={() => onMainCategoryToggle(category)}
                      className="h-4 w-4 accent-primary"
                    />
                    <span className="font-body text-base font-medium leading-normal text-on-surface">
                      {category.label}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </FilterSection>
      ) : null}

      {subCategories.length > 0 ? (
        <FilterSection title="Sub-Category">
          <ul className="space-y-3">
            {subCategories.map(({ category, depth }) => {
              const slugs = getCategoryToggleSlugs(category);
              const { allSelected, someSelected } = getCategorySelectionState(
                slugs,
                selectedCategories,
              );
              const hasChildren = category.children.length > 0;
              const isChecked = hasChildren
                ? allSelected || someSelected
                : allSelected;

              return (
                <li key={category.id}>
                  <label
                    className={cn(
                      "flex cursor-pointer items-center gap-3",
                      depth > 0 && "pl-6",
                    )}
                  >
                    <input
                      ref={(input) => {
                        if (input && hasChildren) {
                          input.indeterminate = someSelected && !allSelected;
                        }
                      }}
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => onSubCategoryToggle(category)}
                      className="h-4 w-4 accent-primary"
                    />
                    <span className="font-body text-sm leading-normal text-on-surface-variant">
                      {category.label}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </FilterSection>
      ) : null}

      {brands.length > 0 ? (
        <FilterSection title="Brand">
          <ul className="space-y-3">
            {brands.map((brand) => {
              const isActive = selectedBrands.includes(brand);

              return (
                <li key={brand}>
                  <label className="flex cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={() => onBrandToggle(brand)}
                      className="h-4 w-4 accent-primary"
                    />
                    <span className="font-body text-sm leading-normal text-on-surface">
                      {brand}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </FilterSection>
      ) : null}

      {sizes.length > 0 ? (
        <FilterSection title="Size">
          <div className="flex flex-wrap gap-2">
            {sizes.map((size) => {
              const isActive = selectedSizes.includes(size);
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => onSizeToggle(size)}
                  className={cn(
                    "font-label min-w-10 border px-3 py-2 text-xs font-bold uppercase leading-none tracking-[0.15em] transition-colors",
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
      ) : null}

      {colors.length > 0 ? (
        <FilterSection title="Color">
          <div className="flex flex-wrap gap-2">
            {colors.map((color) => {
              const isActive = selectedColors.includes(color.id);

              return (
                <button
                  key={color.id}
                  type="button"
                  onClick={() => onColorToggle(color.id)}
                  className={cn(
                    "h-8 w-8 border border-outline-variant transition-shadow hover:scale-110",
                    isActive && "ring-1 ring-primary ring-offset-2",
                  )}
                  style={{ backgroundColor: color.hex }}
                  aria-label={color.label}
                  aria-pressed={isActive}
                />
              );
            })}
          </div>
        </FilterSection>
      ) : null}

      {maxShopPrice > 0 ? (
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
            <div className="font-body flex justify-between text-base leading-normal text-on-surface-variant">
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
      ) : null}
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
      <h2 className="font-label mb-4 text-xs font-bold uppercase leading-none tracking-[0.15em] text-on-surface">
        {title}
      </h2>
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
  products: ShopProduct[];
  categories?: ShopCategoryFilterNode[];
  brands?: string[];
  sizes?: string[];
  colors?: ShopFilterColor[];
  maxShopPrice?: number;
  defaultCategorySlugs?: ProductCategory[];
  defaultQuery?: string;
  defaultBrand?: string;
};

export function ShopContent({
  title,
  products,
  categories = [],
  brands = [],
  sizes = [],
  colors = [],
  maxShopPrice = 0,
  defaultCategorySlugs = [],
  defaultQuery = "",
  defaultBrand = "",
}: ShopContentProps) {
  const router = useRouter();
  const hasProducts = products.length > 0;
  const [query, setQuery] = useState(defaultQuery);
  const [selectedCategories, setSelectedCategories] = useState<ProductCategory[]>(
    defaultCategorySlugs,
  );
  const [selectedBrands, setSelectedBrands] = useState<string[]>(
    defaultBrand ? [defaultBrand] : [],
  );
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState(maxShopPrice);
  const [sort, setSort] = useState<SortOption>("newest");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const skipUrlSyncRef = useRef(false);
  const skipPropsSyncRef = useRef(false);

  const defaultCategoryKey = defaultCategorySlugs.join("|");

  useEffect(() => {
    if (skipPropsSyncRef.current) {
      skipPropsSyncRef.current = false;
      return;
    }

    skipUrlSyncRef.current = true;
    setQuery(defaultQuery);
    setSelectedCategories(
      ensureParentSubCategoriesSelected(categories, defaultCategorySlugs),
    );
    setSelectedBrands(defaultBrand ? [defaultBrand] : []);
    // defaultCategoryKey tracks the slug list; avoid resetting on new array identity
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally keyed
  }, [defaultQuery, defaultCategoryKey, defaultBrand]);

  useEffect(() => {
    setMaxPrice(maxShopPrice);
  }, [maxShopPrice]);

  const categoryUrlSlug = useMemo(
    () => getCategoryUrlSlug(selectedCategories, categories),
    [selectedCategories, categories],
  );

  useEffect(() => {
    if (skipUrlSyncRef.current) {
      skipUrlSyncRef.current = false;
      return;
    }

    const nextHref = buildShopHref({
      q: query,
      category: categoryUrlSlug,
      brand: selectedBrands.length === 1 ? selectedBrands[0] : undefined,
    });
    const currentHref = `${window.location.pathname}${window.location.search}`;

    if (currentHref !== nextHref) {
      skipPropsSyncRef.current = true;
      router.replace(nextHref, { scroll: false });
    }
  }, [query, categoryUrlSlug, selectedBrands, router]);

  const filtered = filterProducts(products, {
    query,
    categories: selectedCategories,
    brands: selectedBrands,
    sizes: selectedSizes,
    colors: selectedColors,
    maxPrice,
  });
  const sortedProducts = sortProducts(filtered, sort);

  const toggleMainCategory = (category: ShopCategoryFilterNode) => {
    const slugs = getCategoryToggleSlugs(category);
    const { allSelected } = getCategorySelectionState(
      slugs,
      selectedCategories,
    );

    setSelectedCategories((prev) =>
      allSelected
        ? prev.filter((slug) => !slugs.includes(slug))
        : [...new Set([...prev, ...slugs])],
    );
  };

  const toggleSubCategory = (category: ShopCategoryFilterNode) => {
    const slugs = getCategoryToggleSlugs(category);
    const { allSelected } = getCategorySelectionState(
      slugs,
      selectedCategories,
    );
    const categorySlug = category.id as ProductCategory;
    const parentSubCategory = findParentSubCategory(categories, categorySlug);

    setSelectedCategories((prev) => {
      if (allSelected) {
        let next = prev.filter((slug) => !slugs.includes(slug));

        if (parentSubCategory) {
          const hasSiblingSelected = parentSubCategory.children.some((nested) =>
            next.includes(nested.id as ProductCategory),
          );

          if (!hasSiblingSelected) {
            next = next.filter(
              (slug) => slug !== (parentSubCategory.id as ProductCategory),
            );
          }
        }

        return next;
      }

      const next = new Set([...prev, ...slugs]);

      if (parentSubCategory) {
        next.add(parentSubCategory.id as ProductCategory);
      }

      return [...next];
    });
  };

  const toggleBrand = (brand: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brand)
        ? prev.filter((item) => item !== brand)
        : [...prev, brand],
    );
  };

  const toggleSize = (size: string) => {
    setSelectedSizes((prev) => (prev.includes(size) ? [] : [size]));
  };

  const toggleColor = (color: string) => {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color],
    );
  };

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nextQuery = String(formData.get("q") ?? "").trim();
    setQuery(nextQuery);
  };

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 border-b border-gray-200 pb-6 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between md:mb-10 lg:gap-6">
        <div className="min-w-0 -mt-2">
          <h1 className="font-headline text-2xl font-extrabold uppercase leading-tight text-on-surface md:text-3xl md:tracking-tight lg:text-4xl">
            {title}
          </h1>
          <p className="font-body text-xs leading-normal text-on-surface-variant sm:text-sm">
            Showing {sortedProducts.length}{" "}
            {sortedProducts.length === 1 ? "Product" : "Products"}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-3 sm:gap-4">
          {hasProducts ? (
            <button
              type="button"
              onClick={() => setMobileFiltersOpen((open) => !open)}
              className="font-label border border-primary px-4 py-2 text-xs font-bold uppercase leading-none tracking-[0.15em] text-primary lg:hidden"
            >
              {mobileFiltersOpen ? "Hide Filters" : "Filters"}
            </button>
          ) : null}

          {hasProducts ? (
            <label className="flex min-w-0 items-center gap-2 sm:gap-3">
              <span className="font-label text-xs font-bold uppercase leading-none tracking-[0.15em] text-on-surface">
                Sort by:
              </span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortOption)}
                className="font-body cursor-pointer border-b border-primary bg-transparent pb-1 text-base leading-normal text-on-surface outline-none"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>
      </div>

      {hasProducts ? (
        <form
          onSubmit={handleSearchSubmit}
          className="mb-8 flex items-center gap-3 border border-outline-variant bg-surface-container-lowest px-4 py-3 md:px-5"
        >
          <SearchIcon
            className="h-5 w-5 shrink-0 text-on-surface-variant"
            aria-hidden="true"
          />
          <input
            type="search"
            name="q"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search products, brands, or categories..."
            autoComplete="off"
            className="font-body min-w-0 flex-1 bg-transparent text-base leading-normal text-on-surface outline-none placeholder:text-on-surface-variant"
          />
          <button
            type="submit"
            className="font-label shrink-0 text-xs font-bold uppercase leading-none tracking-[0.15em] text-primary hover:opacity-70"
          >
            Search
          </button>
        </form>
      ) : null}

      {!hasProducts ? (
        <p className="font-body py-16 text-center text-lg leading-relaxed text-on-surface-variant">
          No products yet.
        </p>
      ) : (
        <div className="flex flex-col gap-8 lg:flex-row lg:gap-6 xl:gap-8">
          <div
            className={cn(
              "w-full shrink-0 lg:block lg:w-56 xl:w-64",
              mobileFiltersOpen ? "block" : "hidden",
            )}
          >
            <ShopFilters
              brands={brands}
              categories={categories}
              sizes={sizes}
              colors={colors}
              maxShopPrice={maxShopPrice}
              selectedBrands={selectedBrands}
              selectedCategories={selectedCategories}
              selectedSizes={selectedSizes}
              selectedColors={selectedColors}
              maxPrice={maxPrice}
              onBrandToggle={toggleBrand}
              onMainCategoryToggle={toggleMainCategory}
              onSubCategoryToggle={toggleSubCategory}
              onSizeToggle={toggleSize}
              onColorToggle={toggleColor}
              onMaxPriceChange={setMaxPrice}
            />
          </div>

          <div className="min-w-0 flex-1">
            {sortedProducts.length > 0 ? (
              <div className="grid grid-cols-2 gap-x-3 gap-y-6 lg:grid-cols-3 lg:gap-x-3 lg:gap-y-6 xl:grid-cols-4 xl:gap-x-4 xl:gap-y-7">
                {sortedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <p className="font-body py-16 text-center text-lg leading-relaxed text-on-surface-variant">
                No products match your filters.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { Pencil, SlidersHorizontal, Trash2, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { SearchIcon } from "@/components/icons";
import {
  createBrand,
  createColor,
  createProduct,
  createSize,
  deleteProduct,
  deleteProductImage,
  fetchAllBrands,
  fetchAllColors,
  fetchAllSizes,
  repairProductsSchema,
  updateProduct,
} from "@/app/admin/(dashboard)/products/actions";
import { Button, Popup } from "@/components/ui";
import { useProductImageUploader } from "@/hooks/useProductImageUploader";
import type { CategoryTreeNode } from "@/lib/category-types";
import { normalizeHexColor } from "@/lib/color-utils";
import { flattenCategoryTreeOptions } from "@/lib/category-tree";
import { getProductStockState, LOW_STOCK_THRESHOLD } from "@/lib/inventory";
import type {
  Brand,
  Color,
  Size,
  StoreProductWithRelations,
} from "@/lib/product-types";
import type { ProductsSchemaStatus } from "@/lib/products-schema-types";
import { computeFinalPrice } from "@/lib/pricing";
import type { DiscountType } from "@/lib/types";
import { cn, formatPrice } from "@/lib/utils";
import { isManagedProductImageUrl } from "@/lib/product-image-validation";

type ProductsAdminProps = {
  products: StoreProductWithRelations[];
  categoryTree: CategoryTreeNode[];
  schemaStatus: ProductsSchemaStatus;
  allColors: Color[];
  allSizes: Size[];
  allBrands: Brand[];
};

type ImageEntry = { url: string; alt: string; colorId: string };
type ColorDraft = { name: string; hex: string };
type VariantEntry = { colorId: string; sizeId: string; inventory: number };
type ProductStatusFilter = "all" | "active" | "draft";
type ProductStockFilter = "all" | "in-stock" | "low-stock" | "out-of-stock";
type ProductSortOption = "newest" | "oldest" | "price-asc" | "price-desc";

const PRODUCTS_PER_PAGE = 15;

const PRODUCT_BADGE_OPTIONS = [
  { value: "", label: "None" },
  { value: "NEW", label: "NEW" },
  { value: "PRE ORDER", label: "PRE ORDER" },
] as const;

function getCategoryLabel(
  categoryTree: CategoryTreeNode[],
  categoryId: string | undefined,
): string {
  if (!categoryId) {
    return "Uncategorized";
  }

  const options = flattenCategoryTreeOptions(categoryTree);
  return (
    options.find((option) => option.id === categoryId)?.label ?? "Uncategorized"
  );
}

function getProductStockSummary(product: StoreProductWithRelations) {
  const stockState = getProductStockState(product.variants ?? []);

  if (stockState.isOutOfStock) {
    return {
      label: "Out of stock",
      className: "border-error/30 bg-error/10 text-error",
    };
  }

  if (stockState.isLowStock) {
    return {
      label: "Low stock",
      className: "border-orange-400/30 bg-orange-400/10 text-orange-400",
    };
  }

  return {
    label: "In stock",
    className: "border-green-600/30 bg-green-600/10 text-green-600",
  };
}

function matchesProductSearch(
  product: StoreProductWithRelations,
  query: string,
  categoryTree: CategoryTreeNode[],
): boolean {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return true;
  }

  const categoryLabel = getCategoryLabel(categoryTree, product.category_id);

  return [
    product.name,
    product.brand,
    product.slug,
    categoryLabel,
    product.category?.name ?? "",
  ].some((value) => value.toLowerCase().includes(normalizedQuery));
}

function matchesProductStatusFilter(
  product: StoreProductWithRelations,
  statusFilter: ProductStatusFilter,
): boolean {
  if (statusFilter === "active") {
    return product.is_published;
  }

  if (statusFilter === "draft") {
    return !product.is_published;
  }

  return true;
}

function matchesProductStockFilter(
  product: StoreProductWithRelations,
  stockFilter: ProductStockFilter,
): boolean {
  const stockState = getProductStockState(product.variants ?? []);

  if (stockFilter === "in-stock") {
    return !stockState.isOutOfStock && !stockState.isLowStock;
  }

  if (stockFilter === "low-stock") {
    return stockState.isLowStock;
  }

  if (stockFilter === "out-of-stock") {
    return stockState.isOutOfStock;
  }

  return true;
}

function sortAdminProducts(
  products: StoreProductWithRelations[],
  sort: ProductSortOption,
): StoreProductWithRelations[] {
  const sorted = [...products];

  switch (sort) {
    case "oldest":
      return sorted.sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );
    case "price-asc":
      return sorted.sort((a, b) => Number(a.price) - Number(b.price));
    case "price-desc":
      return sorted.sort((a, b) => Number(b.price) - Number(a.price));
    case "newest":
    default:
      return sorted.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
  }
}

function buildVariantGrid(
  colors: Color[],
  sizes: Size[],
  existing: VariantEntry[],
): VariantEntry[] {
  const inventoryByKey = new Map(
    existing.map((variant) => [
      `${variant.colorId}:${variant.sizeId}`,
      variant.inventory,
    ]),
  );

  if (colors.length > 0 && sizes.length > 0) {
    return colors.flatMap((color) =>
      sizes.map((size) => ({
        colorId: color.id,
        sizeId: size.id,
        inventory: inventoryByKey.get(`${color.id}:${size.id}`) ?? 0,
      })),
    );
  }

  if (colors.length > 0) {
    return colors.map((color) => ({
      colorId: color.id,
      sizeId: "",
      inventory: inventoryByKey.get(`${color.id}:`) ?? 0,
    }));
  }

  if (sizes.length > 0) {
    return sizes.map((size) => ({
      colorId: "",
      sizeId: size.id,
      inventory: inventoryByKey.get(`:${size.id}`) ?? 0,
    }));
  }

  return [];
}

function getVariantInventoryStatus(inventory: number) {
  if (inventory <= 0) {
    return { label: "Out", className: "text-error" };
  }

  if (inventory <= 10) {
    return { label: "Low", className: "text-orange-400" };
  }

  return { label: "In stock", className: "text-on-surface-variant" };
}

function ProductVariantInventoryEditor({
  colors,
  sizes,
  variants,
  onChange,
}: {
  colors: Color[];
  sizes: Size[];
  variants: VariantEntry[];
  onChange: (variants: VariantEntry[]) => void;
}) {
  if (colors.length === 0 && sizes.length === 0) {
    return (
      <p className="font-body text-sm text-on-surface-variant">
        Add colors and/or sizes above to manage variant inventory.
      </p>
    );
  }

  const updateVariantInventory = (
    colorId: string,
    sizeId: string,
    inventory: number,
  ) => {
    onChange(
      variants.map((variant) =>
        variant.colorId === colorId && variant.sizeId === sizeId
          ? { ...variant, inventory }
          : variant,
      ),
    );
  };

  const renderInventoryInput = (colorId: string, sizeId: string) => {
    const variant = variants.find(
      (entry) => entry.colorId === colorId && entry.sizeId === sizeId,
    );
    const inventory = variant?.inventory ?? 0;
    const status = getVariantInventoryStatus(inventory);

    return (
      <>
        <input
          type="number"
          min="0"
          step="1"
          value={inventory}
          onChange={(event) =>
            updateVariantInventory(
              colorId,
              sizeId,
              Math.max(0, Math.floor(Number(event.target.value) || 0)),
            )
          }
          className="font-body w-20 border border-outline-variant px-2 py-1.5 text-sm"
        />
        <p className={cn("font-body mt-1 text-[11px]", status.className)}>
          {status.label}
        </p>
      </>
    );
  };

  if (colors.length > 0 && sizes.length === 0) {
    return (
      <div className="overflow-x-auto border border-outline-variant">
        <table className="min-w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-outline-variant bg-surface-container-low">
              <th className="font-label px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">
                Color
              </th>
              <th className="font-label px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">
                Inventory
              </th>
            </tr>
          </thead>
          <tbody>
            {colors.map((color) => (
              <tr
                key={color.id}
                className="border-b border-outline-variant last:border-b-0"
              >
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-4 w-4 border border-outline-variant"
                      style={{ backgroundColor: color.hex }}
                    />
                    <span className="font-body text-sm text-on-surface">
                      {color.name}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-3 align-top">
                  {renderInventoryInput(color.id, "")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (sizes.length > 0 && colors.length === 0) {
    return (
      <div className="overflow-x-auto border border-outline-variant">
        <table className="min-w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-outline-variant bg-surface-container-low">
              <th className="font-label px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">
                Size
              </th>
              <th className="font-label px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">
                Inventory
              </th>
            </tr>
          </thead>
          <tbody>
            {sizes.map((size) => (
              <tr
                key={size.id}
                className="border-b border-outline-variant last:border-b-0"
              >
                <td className="px-3 py-3">
                  <span className="font-body text-sm text-on-surface">
                    {size.label}
                  </span>
                </td>
                <td className="px-3 py-3 align-top">
                  {renderInventoryInput("", size.id)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-outline-variant">
      <table className="min-w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-outline-variant bg-surface-container-low">
            <th className="font-label px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">
              Color / Size
            </th>
            {sizes.map((size) => (
              <th
                key={size.id}
                className="font-label px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant"
              >
                {size.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {colors.map((color) => (
            <tr
              key={color.id}
              className="border-b border-outline-variant last:border-b-0"
            >
              <td className="px-3 py-3">
                <div className="flex items-center gap-2">
                  <span
                    className="h-4 w-4 border border-outline-variant"
                    style={{ backgroundColor: color.hex }}
                  />
                  <span className="font-body text-sm text-on-surface">
                    {color.name}
                  </span>
                </div>
              </td>
              {sizes.map((size) => (
                <td key={size.id} className="px-3 py-3 align-top">
                  {renderInventoryInput(color.id, size.id)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function resolveInitialBrand(
  initialBrand: string | undefined,
  allBrands: Brand[],
): Brand | null {
  if (initialBrand) {
    const match = allBrands.find(
      (brand) => brand.name.toLowerCase() === initialBrand.toLowerCase(),
    );
    if (match) {
      return match;
    }

    return { id: `legacy-${initialBrand}`, name: initialBrand };
  }

  return (
    allBrands.find((brand) => brand.name.toUpperCase() === "VELVORZ") ??
    allBrands[0] ??
    null
  );
}

function NewColorForm({ onAdded }: { onAdded: (color: Color) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState<ColorDraft>({ name: "", hex: "#000000" });
  const [hexDraft, setHexDraft] = useState("#000000");
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateHex = (value: string) => {
    setHexDraft(value);
    const normalized = normalizeHexColor(value);
    if (normalized) {
      setDraft((current) => ({ ...current, hex: normalized }));
    }
  };

  const handleHexBlur = () => {
    const normalized = normalizeHexColor(hexDraft);
    if (normalized) {
      setHexDraft(normalized);
      setDraft((current) => ({ ...current, hex: normalized }));
      return;
    }

    setHexDraft(draft.hex);
  };

  const handleAdd = async () => {
    setIsAdding(true);
    setError(null);

    const result = await createColor(draft.name, draft.hex);
    if (result.error || !result.color) {
      setError(result.error ?? "Unable to add color.");
      setIsAdding(false);
      return;
    }

    onAdded(result.color);
    setDraft({ name: "", hex: "#000000" });
    setHexDraft("#000000");
    setIsAdding(false);
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="font-label border border-outline-variant px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface"
      >
        Add New Color
      </button>
    );
  }

  return (
    <div className="space-y-2 border border-outline-variant p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="font-label text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">
          Add new color
        </p>
        <button
          type="button"
          onClick={() => {
            setIsOpen(false);
            setError(null);
          }}
          className="font-label text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant hover:text-on-surface"
        >
          Cancel
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={draft.name}
          onChange={(event) =>
            setDraft((current) => ({ ...current, name: event.target.value }))
          }
          placeholder="Color name"
          className="font-body min-w-[8rem] flex-1 border border-outline-variant px-3 py-2 text-sm"
        />
        <input
          type="color"
          value={normalizeHexColor(draft.hex) ?? "#000000"}
          onChange={(event) => {
            const nextHex = event.target.value.toLowerCase();
            setHexDraft(nextHex);
            setDraft((current) => ({ ...current, hex: nextHex }));
          }}
          className="h-10 w-12 cursor-pointer border border-outline-variant"
          aria-label="Pick new color"
        />
        <input
          type="text"
          value={hexDraft}
          onChange={(event) => updateHex(event.target.value)}
          onBlur={handleHexBlur}
          placeholder="#000000"
          spellCheck={false}
          className="font-body w-28 border border-outline-variant px-3 py-2 font-mono text-sm uppercase"
          aria-label="Hex code for new color"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={isAdding || !draft.name.trim()}
          className="font-label border border-primary bg-primary px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-on-primary disabled:opacity-60"
        >
          {isAdding ? "Adding..." : "Add"}
        </button>
      </div>
      {error ? <p className="font-body text-sm text-error">{error}</p> : null}
    </div>
  );
}

function ProductImagesEditor({
  images,
  colors,
  onChange,
}: {
  images: ImageEntry[];
  colors: Color[];
  onChange: (images: ImageEntry[]) => void;
}) {
  const [imagePendingRemoval, setImagePendingRemoval] = useState<{
    index: number;
    url: string;
  } | null>(null);
  const [isDeletingImage, setIsDeletingImage] = useState(false);
  const [removeImageError, setRemoveImageError] = useState<string | null>(null);
  const {
    inputRef,
    uploadError,
    uploadSuccess,
    isUploading,
    maxFileSizeLabel,
    openFilePicker,
    onFileChange,
  } = useProductImageUploader({
    onUploaded: (url) =>
      onChange([...images, { url, alt: "", colorId: colors[0]?.id ?? "" }]),
  });

  const moveImage = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= images.length) {
      return;
    }

    const next = [...images];
    const [moved] = next.splice(index, 1);
    next.splice(nextIndex, 0, moved);
    onChange(next);
  };

  async function handleConfirmRemoveImage() {
    if (!imagePendingRemoval) {
      return;
    }

    setIsDeletingImage(true);
    setRemoveImageError(null);

    const result = await deleteProductImage(imagePendingRemoval.url);
    if (result.error) {
      setRemoveImageError(result.error);
      setIsDeletingImage(false);
      return;
    }

    onChange(images.filter((_, index) => index !== imagePendingRemoval.index));
    setImagePendingRemoval(null);
    setIsDeletingImage(false);
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={onFileChange}
      />
      <p className="font-body mb-3 text-xs leading-normal text-on-surface-variant">
        Add multiple images and assign each to a color. Selecting that color on
        the product page shows its images. Images are compressed and converted
        to WebP on upload.
      </p>
      <div className="flex flex-wrap gap-3">
        {images.map((image, index) => (
          <div key={`${image.url}-${index}`} className="w-28 space-y-1.5">
            <div className="relative h-24 w-28 overflow-hidden border border-outline-variant">
              <Image
                src={image.url}
                alt=""
                fill
                sizes="112px"
                className="object-cover"
              />
              <span className="absolute left-0 top-0 bg-primary px-1.5 py-0.5 font-label text-[9px] font-bold uppercase tracking-[0.1em] text-on-primary">
                {index === 0 ? "Main" : index + 1}
              </span>
              <div className="absolute bottom-0 left-0 right-0 flex">
                <button
                  type="button"
                  onClick={() => moveImage(index, -1)}
                  disabled={index === 0}
                  className="flex-1 bg-on-surface/80 py-0.5 text-[10px] text-on-primary disabled:opacity-40"
                  aria-label="Move image left"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRemoveImageError(null);
                    setImagePendingRemoval({ index, url: image.url });
                  }}
                  className="flex-1 bg-error py-0.5 text-[10px] text-on-primary"
                  aria-label="Remove image"
                >
                  ×
                </button>
                <button
                  type="button"
                  onClick={() => moveImage(index, 1)}
                  disabled={index === images.length - 1}
                  className="flex-1 bg-on-surface/80 py-0.5 text-[10px] text-on-primary disabled:opacity-40"
                  aria-label="Move image right"
                >
                  →
                </button>
              </div>
            </div>
            <select
              value={image.colorId}
              onChange={(event) => {
                const next = [...images];
                next[index] = { ...next[index], colorId: event.target.value };
                onChange(next);
              }}
              className="font-body w-full border border-outline-variant px-1.5 py-1 text-[11px]"
              aria-label={`Color for image ${index + 1}`}
            >
              <option value="">All colors</option>
              {colors.map((color) => (
                <option key={color.id} value={color.id}>
                  {color.name}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={openFilePicker}
          disabled={isUploading}
          className="font-label border border-outline-variant px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] leading-none text-on-surface disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isUploading ? "Uploading..." : "Add Image"}
        </button>
        <span className="font-body text-xs text-on-surface-variant">
          Max {maxFileSizeLabel}
        </span>
      </div>
      {isUploading ? (
        <p className="font-body mt-2 text-sm text-on-surface-variant">
          Compressing image and uploading to storage...
        </p>
      ) : null}
      {uploadSuccess ? (
        <p className="font-body mt-2 text-sm text-green-600">{uploadSuccess}</p>
      ) : null}
      {uploadError ? (
        <p className="font-body mt-2 text-sm text-error">{uploadError}</p>
      ) : null}
      {removeImageError ? (
        <p className="font-body mt-2 text-sm text-error">{removeImageError}</p>
      ) : null}

      <Popup
        open={imagePendingRemoval !== null}
        onClose={() => {
          if (!isDeletingImage) {
            setImagePendingRemoval(null);
          }
        }}
        title="Delete Product Image"
        description={
          imagePendingRemoval &&
          isManagedProductImageUrl(imagePendingRemoval.url)
            ? "This image will be permanently deleted from storage. This action cannot be undone."
            : "Remove this image from the product? External images will only be removed from this product."
        }
        size="sm"
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              disabled={isDeletingImage}
              onClick={() => setImagePendingRemoval(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={isDeletingImage}
              onClick={handleConfirmRemoveImage}
            >
              {isDeletingImage ? "Deleting..." : "Delete Image"}
            </Button>
          </div>
        }
      />
    </div>
  );
}

function ProductColorsEditor({
  colors,
  onChange,
  initialAllColors,
}: {
  colors: Color[];
  onChange: (colors: Color[]) => void;
  initialAllColors: Color[];
}) {
  const [allColors, setAllColors] = useState(initialAllColors);
  const selectedIds = new Set(colors.map((color) => color.id));

  useEffect(() => {
    setAllColors(initialAllColors);
  }, [initialAllColors]);

  const toggleColor = (color: Color) => {
    if (selectedIds.has(color.id)) {
      onChange(colors.filter((entry) => entry.id !== color.id));
      return;
    }

    onChange([...colors, color]);
  };

  const handleColorAdded = async (color: Color) => {
    const refreshed = await fetchAllColors();
    setAllColors(refreshed);

    if (!colors.some((entry) => entry.id === color.id)) {
      onChange([...colors, color]);
    }
  };

  return (
    <div className="space-y-4">
      {allColors.length > 0 ? (
        <div>
          <p className="font-body mb-2 text-xs leading-normal text-on-surface-variant">
            Select colors for this product. Leave empty if this product has no
            color options.
          </p>
          <div className="flex flex-wrap gap-2">
            {allColors.map((color) => {
              const isSelected = selectedIds.has(color.id);

              return (
                <button
                  key={color.id}
                  type="button"
                  onClick={() => toggleColor(color)}
                  className={cn(
                    "flex items-center gap-2 border px-3 py-2 transition-colors",
                    isSelected
                      ? "border-primary bg-primary/10"
                      : "border-outline-variant bg-surface-container-lowest hover:border-primary",
                  )}
                  aria-pressed={isSelected}
                >
                  <span
                    className="h-5 w-5 shrink-0 border border-outline-variant"
                    style={{ backgroundColor: color.hex }}
                    aria-hidden="true"
                  />
                  <span className="font-body text-sm text-on-surface">
                    {color.name}
                  </span>
                  <span className="font-mono text-[11px] uppercase text-on-surface-variant">
                    {color.hex}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="font-body text-xs leading-normal text-on-surface-variant">
          No colors yet. Click &quot;Add New Color&quot; to create one.
        </p>
      )}

      <NewColorForm onAdded={handleColorAdded} />
    </div>
  );
}

function ProductSizesEditor({
  sizes,
  onChange,
  initialAllSizes,
}: {
  sizes: Size[];
  onChange: (sizes: Size[]) => void;
  initialAllSizes: Size[];
}) {
  const [allSizes, setAllSizes] = useState(initialAllSizes);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [newSizeLabel, setNewSizeLabel] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selectedIds = new Set(sizes.map((size) => size.id));

  useEffect(() => {
    setAllSizes(initialAllSizes);
  }, [initialAllSizes]);

  const toggleSize = (size: Size) => {
    if (selectedIds.has(size.id)) {
      onChange(sizes.filter((entry) => entry.id !== size.id));
      return;
    }

    onChange([...sizes, size]);
  };

  const handleAddSize = async () => {
    setIsAdding(true);
    setError(null);

    const result = await createSize(newSizeLabel);
    if (result.error || !result.size) {
      setError(result.error ?? "Unable to add size.");
      setIsAdding(false);
      return;
    }

    const refreshed = await fetchAllSizes();
    setAllSizes(refreshed);

    if (!sizes.some((entry) => entry.id === result.size!.id)) {
      onChange([...sizes, result.size!]);
    }

    setNewSizeLabel("");
    setIsAdding(false);
    setIsAddFormOpen(false);
  };

  return (
    <div className="space-y-4">
      {allSizes.length > 0 ? (
        <div>
          <p className="font-body mb-2 text-xs leading-normal text-on-surface-variant">
            Select sizes for this product. Leave empty if this product has no
            size options.
          </p>
          <div className="flex flex-wrap gap-2">
            {allSizes.map((size) => {
              const isSelected = selectedIds.has(size.id);

              return (
                <button
                  key={size.id}
                  type="button"
                  onClick={() => toggleSize(size)}
                  className={cn(
                    "font-label min-w-12 border px-4 py-2.5 text-xs font-bold uppercase tracking-[0.15em] leading-none transition-colors",
                    isSelected
                      ? "border-primary bg-primary text-on-primary"
                      : "border-outline-variant bg-surface-container-lowest text-on-surface hover:border-primary",
                  )}
                  aria-pressed={isSelected}
                >
                  {size.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="font-body text-xs leading-normal text-on-surface-variant">
          No sizes yet. Click &quot;Add New Size&quot; to create one.
        </p>
      )}

      {isAddFormOpen ? (
        <div className="space-y-2 border border-outline-variant p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="font-label text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">
              Add new size
            </p>
            <button
              type="button"
              onClick={() => {
                setIsAddFormOpen(false);
                setError(null);
              }}
              className="font-label text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant hover:text-on-surface"
            >
              Cancel
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={newSizeLabel}
              onChange={(event) =>
                setNewSizeLabel(event.target.value.toUpperCase())
              }
              placeholder="e.g. XL"
              className="font-body min-w-[8rem] flex-1 border border-outline-variant px-3 py-2 text-sm uppercase"
            />
            <button
              type="button"
              onClick={handleAddSize}
              disabled={isAdding || !newSizeLabel.trim()}
              className="font-label border border-primary bg-primary px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-on-primary disabled:opacity-60"
            >
              {isAdding ? "Adding..." : "Add"}
            </button>
          </div>
          {error ? (
            <p className="font-body text-sm text-error">{error}</p>
          ) : null}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsAddFormOpen(true)}
          className="font-label border border-outline-variant px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface"
        >
          Add New Size
        </button>
      )}
    </div>
  );
}

function ProductBrandsEditor({
  selectedBrand,
  onChange,
  initialAllBrands,
}: {
  selectedBrand: Brand | null;
  onChange: (brand: Brand) => void;
  initialAllBrands: Brand[];
}) {
  const [allBrands, setAllBrands] = useState(initialAllBrands);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAllBrands(initialAllBrands);
  }, [initialAllBrands]);

  const displayBrands =
    selectedBrand &&
    !allBrands.some(
      (brand) => brand.name.toLowerCase() === selectedBrand.name.toLowerCase(),
    )
      ? [...allBrands, selectedBrand]
      : allBrands;

  const handleAddBrand = async () => {
    setIsAdding(true);
    setError(null);

    const result = await createBrand(newBrandName);
    if (result.error || !result.brand) {
      setError(result.error ?? "Unable to add brand.");
      setIsAdding(false);
      return;
    }

    const refreshed = await fetchAllBrands();
    setAllBrands(refreshed);
    onChange(result.brand);
    setNewBrandName("");
    setIsAdding(false);
    setIsAddFormOpen(false);
  };

  return (
    <div className="space-y-4">
      {displayBrands.length > 0 ? (
        <div>
          <p className="font-body mb-2 text-xs leading-normal text-on-surface-variant">
            Select a brand for this product.
          </p>
          <div className="flex flex-wrap gap-2">
            {displayBrands.map((brand) => {
              const isSelected =
                selectedBrand?.name.toLowerCase() === brand.name.toLowerCase();

              return (
                <button
                  key={brand.id}
                  type="button"
                  onClick={() => onChange(brand)}
                  className={cn(
                    "font-label border px-4 py-2.5 text-xs font-bold uppercase tracking-[0.15em] leading-none transition-colors",
                    isSelected
                      ? "border-primary bg-primary text-on-primary"
                      : "border-outline-variant bg-surface-container-lowest text-on-surface hover:border-primary",
                  )}
                  aria-pressed={isSelected}
                >
                  {brand.name}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="font-body text-xs leading-normal text-on-surface-variant">
          No brands yet. Click &quot;Add New Brand&quot; to create one.
        </p>
      )}

      {isAddFormOpen ? (
        <div className="space-y-2 border border-outline-variant p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="font-label text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">
              Add new brand
            </p>
            <button
              type="button"
              onClick={() => {
                setIsAddFormOpen(false);
                setError(null);
              }}
              className="font-label text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant hover:text-on-surface"
            >
              Cancel
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={newBrandName}
              onChange={(event) => setNewBrandName(event.target.value)}
              placeholder="e.g. VELVORZ"
              className="font-body min-w-[8rem] flex-1 border border-outline-variant px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={handleAddBrand}
              disabled={isAdding || !newBrandName.trim()}
              className="font-label border border-primary bg-primary px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-on-primary disabled:opacity-60"
            >
              {isAdding ? "Adding..." : "Add"}
            </button>
          </div>
          {error ? (
            <p className="font-body text-sm text-error">{error}</p>
          ) : null}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsAddFormOpen(true)}
          className="font-label border border-outline-variant px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface"
        >
          Add New Brand
        </button>
      )}
    </div>
  );
}

export function ProductForm({
  categoryTree,
  allColors,
  allSizes,
  allBrands,
  initial,
  onCancel,
  onSuccess,
  redirectOnSuccess,
}: {
  categoryTree: CategoryTreeNode[];
  allColors: Color[];
  allSizes: Size[];
  allBrands: Brand[];
  initial?: StoreProductWithRelations;
  onCancel?: () => void;
  onSuccess?: () => void;
  redirectOnSuccess?: string;
}) {
  const router = useRouter();
  const action = initial ? updateProduct : createProduct;
  const [state, formAction, pending] = useActionState(action, null);
  const [images, setImages] = useState<ImageEntry[]>(
    initial?.images.map((image) => ({
      url: image.url,
      alt: image.alt,
      colorId: image.color_id ?? "",
    })) ?? [],
  );
  const [colors, setColors] = useState<Color[]>(
    initial?.colors.map((entry) => entry.color) ?? [],
  );
  const [sizes, setSizes] = useState<Size[]>(
    initial?.sizes.map((entry) => entry.size) ?? [],
  );
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(() =>
    resolveInitialBrand(initial?.brand, allBrands),
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    initial?.category_id ?? "",
  );
  const [discountType, setDiscountType] = useState<DiscountType | "none">(
    initial?.discount_type ?? "none",
  );
  const [publishStatus, setPublishStatus] = useState<"true" | "false">(
    initial?.is_published === false ? "false" : "true",
  );
  const [selectedBadge, setSelectedBadge] = useState(initial?.badge ?? "");
  const [paymentMethods, setPaymentMethods] = useState({
    card: true,
    cashOnDelivery: true,
  });
  const [variants, setVariants] = useState<VariantEntry[]>(() =>
    initial
      ? initial.variants.map((variant) => ({
          colorId: variant.color_id ?? "",
          sizeId: variant.size_id ?? "",
          inventory: variant.inventory,
        }))
      : [],
  );
  const categoryOptions = flattenCategoryTreeOptions(categoryTree);
  const badgeOptions =
    initial?.badge &&
    !PRODUCT_BADGE_OPTIONS.some((option) => option.value === initial.badge)
      ? [
          ...PRODUCT_BADGE_OPTIONS,
          { value: initial.badge, label: initial.badge },
        ]
      : PRODUCT_BADGE_OPTIONS;

  useEffect(() => {
    setVariants((current) => buildVariantGrid(colors, sizes, current));
  }, [colors, sizes]);

  useEffect(() => {
    if (!state?.success) {
      return;
    }

    if (initial) {
      router.refresh();
      onSuccess?.();
      return;
    }

    if (redirectOnSuccess) {
      router.push(redirectOnSuccess);
      return;
    }

    setImages([]);
    setColors([]);
    setSizes([]);
    setSelectedBrand(
      allBrands.find((brand) => brand.name.toUpperCase() === "VELVORZ") ??
        allBrands[0] ??
        null,
    );
    setSelectedCategoryId("");
    setDiscountType("none");
    setPublishStatus("true");
    setSelectedBadge("");
    setPaymentMethods({ card: true, cashOnDelivery: true });
    setVariants([]);
  }, [
    allBrands,
    initial,
    onSuccess,
    redirectOnSuccess,
    router,
    state?.success,
  ]);

  return (
    <form action={formAction} className="space-y-4">
      {initial ? <input type="hidden" name="id" value={initial.id} /> : null}
      <input type="hidden" name="category_id" value={selectedCategoryId} />
      <input type="hidden" name="images_json" value={JSON.stringify(images)} />
      <input
        type="hidden"
        name="colors_json"
        value={JSON.stringify(colors.map((color) => ({ id: color.id })))}
      />
      <input
        type="hidden"
        name="sizes_json"
        value={JSON.stringify(sizes.map((size) => ({ id: size.id })))}
      />
      <input
        type="hidden"
        name="variants_json"
        value={JSON.stringify(variants)}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block font-label text-xs font-bold uppercase tracking-[0.12em] text-on-surface-variant">
            Product Name
          </label>
          <input
            name="name"
            required
            defaultValue={initial?.name}
            className="font-body w-full border border-outline-variant px-3 py-2 text-sm"
          />
        </div>
        <div className="md:col-span-2">
          <label className="mb-2 block font-label text-xs font-bold uppercase tracking-[0.12em] text-on-surface-variant">
            Brand
          </label>
          <ProductBrandsEditor
            selectedBrand={selectedBrand}
            initialAllBrands={allBrands}
            onChange={setSelectedBrand}
          />
          <input type="hidden" name="brand" value={selectedBrand?.name ?? ""} />
        </div>
        <div className="md:col-span-2">
          <label className="mb-2 block font-label text-xs font-bold uppercase tracking-[0.12em] text-on-surface-variant">
            Category
          </label>
          <select
            required
            value={selectedCategoryId}
            onChange={(event) => setSelectedCategoryId(event.target.value)}
            className="font-body w-full border border-outline-variant px-3 py-2 text-sm"
          >
            <option value="" disabled>
              Select category
            </option>
            {categoryOptions.map((category) => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </select>
          <p className="font-body mt-2 text-xs leading-normal text-on-surface-variant">
            Choose any level, for example Men → Casual Wear → T Shirt.
          </p>
        </div>
        <div>
          <label className="mb-2 block font-label text-xs font-bold uppercase tracking-[0.12em] text-on-surface-variant">
            Base Price (Rs.)
          </label>
          <input
            name="base_price"
            type="number"
            min="0"
            step="0.01"
            required
            defaultValue={initial?.base_price ?? initial?.price}
            className="font-body w-full border border-outline-variant px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-2 block font-label text-xs font-bold uppercase tracking-[0.12em] text-on-surface-variant">
            Discount Type
          </label>
          <select
            name="discount_type"
            value={discountType}
            onChange={(event) =>
              setDiscountType(event.target.value as DiscountType | "none")
            }
            className="font-body w-full border border-outline-variant px-3 py-2 text-sm"
          >
            <option value="none">None</option>
            <option value="percentage">Percentage (%)</option>
            <option value="fixed">Fixed Amount (Rs.)</option>
          </select>
        </div>
        {discountType !== "none" ? (
          <div>
            <label className="mb-2 block font-label text-xs font-bold uppercase tracking-[0.12em] text-on-surface-variant">
              Discount Value
            </label>
            <input
              name="discount_value"
              type="number"
              min="0"
              step="0.01"
              defaultValue={initial?.discount_value ?? 0}
              className="font-body w-full border border-outline-variant px-3 py-2 text-sm"
            />
          </div>
        ) : null}
      </div>

      <div>
        <label className="mb-2 block font-label text-xs font-bold uppercase tracking-[0.12em] text-on-surface-variant">
          Colors <span className="font-normal normal-case">(optional)</span>
        </label>
        <ProductColorsEditor
          colors={colors}
          initialAllColors={allColors}
          onChange={setColors}
        />
      </div>

      <div>
        <label className="mb-2 block font-label text-xs font-bold uppercase tracking-[0.12em] text-on-surface-variant">
          Sizes <span className="font-normal normal-case">(optional)</span>
        </label>
        <ProductSizesEditor
          sizes={sizes}
          initialAllSizes={allSizes}
          onChange={setSizes}
        />
      </div>

      <div>
        <label className="mb-2 block font-label text-xs font-bold uppercase tracking-[0.12em] text-on-surface-variant">
          Product Images
        </label>
        <ProductImagesEditor
          images={images}
          colors={colors}
          onChange={setImages}
        />
      </div>

      <div>
        <label className="mb-2 block font-label text-xs font-bold uppercase tracking-[0.12em] text-on-surface-variant">
          Description
        </label>
        <textarea
          name="description"
          rows={4}
          defaultValue={initial?.description}
          className="font-body w-full border border-outline-variant px-3 py-2 text-sm"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block font-label text-xs font-bold uppercase tracking-[0.12em] text-on-surface-variant">
            Materials & Care
          </label>
          <textarea
            name="materials_care"
            rows={4}
            defaultValue={initial?.materials_care}
            className="font-body w-full border border-outline-variant px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-2 block font-label text-xs font-bold uppercase tracking-[0.12em] text-on-surface-variant">
            Shipping & Returns
          </label>
          <textarea
            name="shipping_returns"
            rows={4}
            defaultValue={initial?.shipping_returns}
            className="font-body w-full border border-outline-variant px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block font-label text-xs font-bold uppercase tracking-[0.12em] text-on-surface-variant">
          Badge (optional)
        </label>
        <select
          name="badge"
          value={selectedBadge}
          onChange={(event) => setSelectedBadge(event.target.value)}
          className="font-body w-full border border-outline-variant px-3 py-2 text-sm"
        >
          {badgeOptions.map((option) => (
            <option key={option.value || "none"} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <p className="mb-2 font-label text-xs font-bold uppercase tracking-[0.12em] text-on-surface-variant">
          Payment Options
        </p>
        <div className="flex flex-wrap gap-6 border border-outline-variant px-4 py-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={paymentMethods.card}
              onChange={(event) =>
                setPaymentMethods((current) => ({
                  ...current,
                  card: event.target.checked,
                }))
              }
            />
            <span className="font-body text-sm text-on-surface">Card</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={paymentMethods.cashOnDelivery}
              onChange={(event) =>
                setPaymentMethods((current) => ({
                  ...current,
                  cashOnDelivery: event.target.checked,
                }))
              }
            />
            <span className="font-body text-sm text-on-surface">
              Cash on Delivery
            </span>
          </label>
        </div>
        <p className="font-body mt-2 text-xs leading-normal text-on-surface-variant">
          Selection only for now — not saved yet.
        </p>
      </div>

      <div>
        <label className="mb-2 block font-label text-xs font-bold uppercase tracking-[0.12em] text-on-surface-variant">
          Variant Inventory
        </label>
        <ProductVariantInventoryEditor
          colors={colors}
          sizes={sizes}
          variants={variants}
          onChange={setVariants}
        />
        <p className="font-body mt-2 text-xs leading-normal text-on-surface-variant">
          Set stock per color, per size, or per color and size combination.
          Variants at 10 or less show &quot;Low Stock&quot; on the storefront.
          At 0, that variant is out of stock.
        </p>
      </div>

      {state?.error ? (
        <p className="font-body text-sm text-error">{state.error}</p>
      ) : null}
      {state?.success ? (
        <p className="font-body text-sm text-primary">{state.success}</p>
      ) : null}

      <div>
        <p className="mb-2 font-label text-xs font-bold uppercase tracking-[0.12em] text-on-surface-variant">
          Status
        </p>
        <input type="hidden" name="is_published" value={publishStatus} />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setPublishStatus("true")}
            className={cn(
              "font-label border px-4 py-2.5 text-xs font-bold uppercase tracking-[0.15em] leading-none transition-colors",
              publishStatus === "true"
                ? "border-green-600/30 bg-green-600/10 text-green-600"
                : "border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:border-green-600/30",
            )}
            aria-pressed={publishStatus === "true"}
          >
            Active
          </button>
          <button
            type="button"
            onClick={() => setPublishStatus("false")}
            className={cn(
              "font-label border px-4 py-2.5 text-xs font-bold uppercase tracking-[0.15em] leading-none transition-colors",
              publishStatus === "false"
                ? "border-blue-600/30 bg-blue-600/10 text-blue-600"
                : "border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:border-blue-600/30",
            )}
            aria-pressed={publishStatus === "false"}
          >
            Draft
          </button>
        </div>
        <p className="font-body mt-2 text-xs leading-normal text-on-surface-variant">
          Draft products are hidden from the shop until set to Active.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={pending}
          className="font-label border border-primary bg-primary px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-on-primary disabled:opacity-60"
        >
          {pending ? "Saving..." : initial ? "Save Product" : "Create Product"}
        </button>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="font-label border border-outline-variant px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-on-surface"
          >
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}

function ProductRow({
  product,
  categoryTree,
  allColors,
  allSizes,
  allBrands,
}: {
  product: StoreProductWithRelations;
  categoryTree: CategoryTreeNode[];
  allColors: Color[];
  allSizes: Size[];
  allBrands: Brand[];
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const deleteFormRef = useRef<HTMLFormElement>(null);
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteProduct,
    null,
  );
  const image = product.images[0]?.url;
  const pricing = computeFinalPrice(
    product.base_price ?? product.price,
    product.discount_type,
    product.discount_value ?? 0,
  );
  const stockState = getProductStockState(product.variants ?? []);
  const stockSummary = getProductStockSummary(product);
  const categoryLabel = getCategoryLabel(categoryTree, product.category_id);

  useEffect(() => {
    if (deleteState?.success) {
      setShowDeleteConfirm(false);
    }
  }, [deleteState?.success]);

  function handleConfirmDelete() {
    deleteFormRef.current?.requestSubmit();
  }

  return (
    <li className="rounded-sm border border-outline-variant p-3 md:p-3">
      <div className="flex items-start gap-3 md:items-center md:gap-4">
        {image ? (
          <div className="relative h-14 w-14 shrink-0 overflow-hidden border border-outline-variant md:h-12 md:w-12">
            <Image
              src={image}
              alt={product.name}
              fill
              sizes="56px"
              className="object-cover"
            />
          </div>
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center border border-outline-variant bg-surface-container-low md:h-12 md:w-12">
            <span className="font-label text-[8px] font-bold uppercase tracking-[0.1em] text-on-surface-variant">
              No image
            </span>
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3 md:items-center">
            <div className="min-w-0 flex-1 space-y-1.5 md:space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-label text-sm font-bold uppercase text-on-surface">
                  {product.name}
                </p>
                {product.badge ? (
                  <span className="font-label border border-primary/30 bg-primary/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-primary">
                    {product.badge}
                  </span>
                ) : null}
                <span
                  className={cn(
                    "font-label border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em]",
                    product.is_published
                      ? "border-green-600/30 bg-green-600/10 text-green-600"
                      : "border-blue-600/30 bg-blue-600/10 text-blue-600",
                  )}
                >
                  {product.is_published ? "Active" : "Draft"}
                </span>
                <span
                  className={cn(
                    "font-label border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em]",
                    stockSummary.className,
                  )}
                >
                  {stockSummary.label}
                </span>
              </div>

              <div className="grid gap-x-4 gap-y-0.5 text-xs md:grid-cols-2 lg:grid-cols-4">
                <p className="font-body text-on-surface-variant">
                  <span className="text-on-surface">Category:</span>{" "}
                  {categoryLabel}
                </p>
                <p className="font-body text-on-surface-variant">
                  <span className="text-on-surface">Brand:</span>{" "}
                  {product.brand || "—"}
                </p>
                <p className="font-body text-on-surface-variant">
                  <span className="text-on-surface">Inventory:</span>{" "}
                  {stockState.totalInventory} unit
                  {stockState.totalInventory === 1 ? "" : "s"}
                  {product.variants.length > 0
                    ? ` · ${product.variants.length} variant${
                        product.variants.length === 1 ? "" : "s"
                      }`
                    : ""}
                </p>
                <p className="font-body text-on-surface">
                  <span className="text-on-surface-variant">Price:</span>{" "}
                  {pricing.hasDiscount ? (
                    <>
                      <span className="line-through text-on-surface-variant">
                        {formatPrice(product.base_price)}
                      </span>{" "}
                      {formatPrice(product.price)}
                    </>
                  ) : (
                    formatPrice(product.price)
                  )}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditing((open) => !open)}
                aria-label={
                  isEditing
                    ? `Close ${product.name} editor`
                    : `Edit ${product.name}`
                }
                className="inline-flex h-7 w-7 items-center justify-center text-on-surface transition-opacity hover:opacity-70"
              >
                {isEditing ? (
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                aria-label={`Delete ${product.name}`}
                className="inline-flex h-7 w-7 items-center justify-center text-error transition-opacity hover:opacity-70"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <form ref={deleteFormRef} action={deleteAction} className="hidden">
        <input type="hidden" name="id" value={product.id} />
      </form>

      <Popup
        open={showDeleteConfirm}
        onClose={() => {
          if (!deletePending) {
            setShowDeleteConfirm(false);
          }
        }}
        title="Delete Product"
        description={`Are you sure you want to delete "${product.name}"? This will permanently delete the product and all uploaded images from storage. This action cannot be undone.`}
        size="sm"
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              disabled={deletePending}
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={deletePending}
              onClick={handleConfirmDelete}
            >
              {deletePending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        }
      />

      {deleteState?.error ? (
        <p className="font-body mt-2 text-sm text-error">{deleteState.error}</p>
      ) : null}

      {isEditing ? (
        <div className="mt-4 border-t border-outline-variant pt-4">
          <ProductForm
            categoryTree={categoryTree}
            allColors={allColors}
            allSizes={allSizes}
            allBrands={allBrands}
            initial={product}
            onCancel={() => setIsEditing(false)}
            onSuccess={() => setIsEditing(false)}
          />
        </div>
      ) : null}
    </li>
  );
}

function ProductsSchemaBanner() {
  const [state, formAction, isPending] = useActionState(
    repairProductsSchema,
    null,
  );

  return (
    <section className="rounded-sm border border-error/30 bg-error/5 p-5 md:p-6">
      <h2 className="font-label text-xs font-bold uppercase tracking-[0.15em] text-error">
        Database update required
      </h2>
      <p className="font-body mt-2 text-sm text-on-surface">
        Your Supabase products tables are missing columns the admin form needs
        (for example <code className="text-xs">price</code>). Run the migration
        in the Supabase SQL editor, or add{" "}
        <code className="text-xs">SUPABASE_DB_PASSWORD</code> to{" "}
        <code className="text-xs">.env.local</code> and apply it from here.
      </p>
      <form action={formAction} className="mt-4">
        <button
          type="submit"
          disabled={isPending}
          className="font-label border border-error px-4 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-error disabled:opacity-60"
        >
          {isPending ? "Applying..." : "Apply database fix"}
        </button>
      </form>
      {state?.error ? (
        <p className="font-body mt-3 text-sm text-error" role="alert">
          {state.error}
        </p>
      ) : null}
      {state?.success ? (
        <p className="font-body mt-3 text-sm text-on-surface" role="status">
          {state.success}
        </p>
      ) : null}
    </section>
  );
}

export function ProductsAdmin({
  products,
  categoryTree,
  schemaStatus,
  allColors,
  allSizes,
  allBrands,
}: ProductsAdminProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<ProductStatusFilter>("all");
  const [stockFilter, setStockFilter] = useState<ProductStockFilter>("all");
  const [sortFilter, setSortFilter] = useState<ProductSortOption>("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const categoryOptions = useMemo(
    () => flattenCategoryTreeOptions(categoryTree),
    [categoryTree],
  );

  const filteredProducts = useMemo(() => {
    const filtered = products.filter((product) => {
      if (!matchesProductSearch(product, searchQuery, categoryTree)) {
        return false;
      }

      if (categoryFilter !== "all" && product.category_id !== categoryFilter) {
        return false;
      }

      if (!matchesProductStatusFilter(product, statusFilter)) {
        return false;
      }

      if (!matchesProductStockFilter(product, stockFilter)) {
        return false;
      }

      return true;
    });

    return sortAdminProducts(filtered, sortFilter);
  }, [
    products,
    searchQuery,
    categoryTree,
    categoryFilter,
    statusFilter,
    stockFilter,
    sortFilter,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE),
  );

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * PRODUCTS_PER_PAGE;
    return filteredProducts.slice(start, start + PRODUCTS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const rangeStart =
    filteredProducts.length === 0
      ? 0
      : (currentPage - 1) * PRODUCTS_PER_PAGE + 1;
  const rangeEnd = Math.min(
    currentPage * PRODUCTS_PER_PAGE,
    filteredProducts.length,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter, statusFilter, stockFilter, sortFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    categoryFilter !== "all" ||
    statusFilter !== "all" ||
    stockFilter !== "all";

  function clearFilters() {
    setSearchQuery("");
    setCategoryFilter("all");
    setStatusFilter("all");
    setStockFilter("all");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-label text-xs font-bold uppercase tracking-[0.15em] leading-none text-on-surface-variant">
            Admin
          </p>
          <h1 className="font-headline mt-2 text-2xl font-extrabold uppercase leading-tight tracking-tight text-on-surface md:text-3xl">
            Products
          </h1>
        </div>
        {schemaStatus.ready ? (
          <Link
            href="/admin/products/new"
            className="font-label border border-primary bg-primary px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-on-primary"
          >
            Add Product
          </Link>
        ) : null}
      </div>

      {!schemaStatus.ready ? <ProductsSchemaBanner /> : null}

      <section>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-label text-xs font-bold uppercase tracking-[0.15em] text-on-surface">
            All Products
          </h2>
          <p className="font-body text-xs text-on-surface-variant">
            {filteredProducts.length === 0
              ? `0 of ${products.length} product${products.length === 1 ? "" : "s"}`
              : `Showing ${rangeStart}-${rangeEnd} of ${filteredProducts.length} product${
                  filteredProducts.length === 1 ? "" : "s"
                }`}
          </p>
        </div>

        {products.length > 0 ? (
          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap items-end gap-2 md:grid md:grid-cols-2 md:gap-3 xl:grid-cols-6">
              <label className="block min-w-0 flex-1 md:col-span-2 xl:col-span-2">
                <span className="mb-2 block font-label text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">
                  Search
                </span>
                <div className="flex items-center gap-2 border border-outline-variant/50 px-3 py-2">
                  <SearchIcon
                    className="h-4 w-4 shrink-0 text-on-surface-variant"
                    aria-hidden="true"
                  />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search by name, brand, or category..."
                    className="font-body min-w-0 flex-1 bg-transparent text-sm text-on-surface outline-none placeholder:text-on-surface-variant"
                  />
                </div>
              </label>

              <button
                type="button"
                onClick={() => setShowMobileFilters((open) => !open)}
                aria-expanded={showMobileFilters}
                className="inline-flex shrink-0 items-center gap-2 border border-outline-variant/50 px-3 py-2 font-label text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface md:hidden"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
                Filters
                {hasActiveFilters ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
                ) : null}
              </button>

              <div
                className={cn(
                  "grid w-full basis-full gap-3",
                  showMobileFilters ? "grid" : "hidden",
                  "md:contents",
                )}
              >
                <label className="block">
                  <span className="mb-2 block font-label text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">
                    Category
                  </span>
                  <select
                    value={categoryFilter}
                    onChange={(event) => setCategoryFilter(event.target.value)}
                    className="font-body w-full border border-outline-variant/50 px-3 py-2 text-sm"
                  >
                    <option value="all">All categories</option>
                    {categoryOptions.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block font-label text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">
                    Status
                  </span>
                  <select
                    value={statusFilter}
                    onChange={(event) =>
                      setStatusFilter(event.target.value as ProductStatusFilter)
                    }
                    className="font-body w-full border border-outline-variant/50 px-3 py-2 text-sm"
                  >
                    <option value="all">All statuses</option>
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block font-label text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">
                    Stock
                  </span>
                  <select
                    value={stockFilter}
                    onChange={(event) =>
                      setStockFilter(event.target.value as ProductStockFilter)
                    }
                    className="font-body w-full border border-outline-variant/50 px-3 py-2 text-sm"
                  >
                    <option value="all">All stock levels</option>
                    <option value="in-stock">In stock</option>
                    <option value="low-stock">Low stock</option>
                    <option value="out-of-stock">Out of stock</option>
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block font-label text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">
                    Sort by
                  </span>
                  <select
                    value={sortFilter}
                    onChange={(event) =>
                      setSortFilter(event.target.value as ProductSortOption)
                    }
                    className="font-body w-full border border-outline-variant/50 px-3 py-2 text-sm"
                  >
                    <option value="newest">Newest</option>
                    <option value="oldest">Oldest</option>
                    <option value="price-asc">Lowest price</option>
                    <option value="price-desc">Highest price</option>
                  </select>
                </label>
              </div>
            </div>

            {hasActiveFilters ? (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="font-label text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant hover:text-on-surface"
                >
                  Clear filters
                </button>
              </div>
            ) : null}
          </div>
        ) : null}

        {products.length === 0 ? (
          <p className="font-body mt-4 text-sm text-on-surface-variant">
            No products yet.
          </p>
        ) : filteredProducts.length === 0 ? (
          <p className="font-body mt-4 text-sm text-on-surface-variant">
            No products match your search or filters.
          </p>
        ) : (
          <>
            <ul className="mt-6 space-y-4">
              {paginatedProducts.map((product) => (
                <ProductRow
                  key={product.id}
                  product={product}
                  categoryTree={categoryTree}
                  allColors={allColors}
                  allSizes={allSizes}
                  allBrands={allBrands}
                />
              ))}
            </ul>

            {totalPages > 1 ? (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="font-body text-xs text-on-surface-variant">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((page) => Math.max(1, page - 1))
                    }
                    disabled={currentPage === 1}
                    className="font-label border border-outline-variant px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((page) => Math.min(totalPages, page + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="font-label border border-outline-variant px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}

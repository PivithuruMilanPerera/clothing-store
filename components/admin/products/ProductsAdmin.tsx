"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import {
  createProduct,
  deleteProduct,
  repairProductsSchema,
  updateProduct,
} from "@/app/admin/(dashboard)/products/actions";
import { useAdminImageUploader } from "@/hooks/useAdminImageUploader";
import type { CategoryTreeNode } from "@/lib/category-types";
import { flattenCategoryTreeOptions } from "@/lib/category-tree";
import type { StoreProductWithRelations } from "@/lib/product-types";
import type { ProductsSchemaStatus } from "@/lib/products-schema-types";
import { computeFinalPrice } from "@/lib/pricing";
import type { DiscountType } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

type ProductsAdminProps = {
  products: StoreProductWithRelations[];
  categoryTree: CategoryTreeNode[];
  schemaStatus: ProductsSchemaStatus;
};

type ImageEntry = { url: string; alt: string; colorName: string };
type ColorEntry = { name: string; hex: string };
type SizeEntry = { label: string };

function ProductImagesEditor({
  images,
  colors,
  onChange,
}: {
  images: ImageEntry[];
  colors: ColorEntry[];
  onChange: (images: ImageEntry[]) => void;
}) {
  const { inputRef, uploadError, isUploading, openFilePicker, onFileChange } =
    useAdminImageUploader({
      onUploaded: (url) =>
        onChange([...images, { url, alt: "", colorName: colors[0]?.name ?? "" }]),
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
        the product page shows its images.
      </p>
      <div className="flex flex-wrap gap-3">
        {images.map((image, index) => (
          <div
            key={`${image.url}-${index}`}
            className="w-28 space-y-1.5"
          >
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
                  onClick={() => onChange(images.filter((_, i) => i !== index))}
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
              value={image.colorName}
              onChange={(event) => {
                const next = [...images];
                next[index] = { ...next[index], colorName: event.target.value };
                onChange(next);
              }}
              className="font-body w-full border border-outline-variant px-1.5 py-1 text-[11px]"
              aria-label={`Color for image ${index + 1}`}
            >
              <option value="">All colors</option>
              {colors
                .filter((color) => color.name.trim())
                .map((color) => (
                  <option key={`${color.name}-${color.hex}`} value={color.name}>
                    {color.name}
                  </option>
                ))}
            </select>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={openFilePicker}
        disabled={isUploading}
        className="font-label mt-3 border border-outline-variant px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] leading-none text-on-surface"
      >
        {isUploading ? "Uploading..." : "Add Image"}
      </button>
      {uploadError ? (
        <p className="font-body mt-2 text-sm text-error">{uploadError}</p>
      ) : null}
    </div>
  );
}

function ProductColorsEditor({
  colors,
  onChange,
}: {
  colors: ColorEntry[];
  onChange: (colors: ColorEntry[]) => void;
}) {
  return (
    <div className="space-y-3">
      {colors.map((color, index) => (
        <div key={index} className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={color.name}
            onChange={(event) => {
              const next = [...colors];
              next[index] = { ...next[index], name: event.target.value };
              onChange(next);
            }}
            placeholder="Color name"
            className="font-body min-w-[8rem] flex-1 border border-outline-variant px-3 py-2 text-sm"
          />
          <input
            type="color"
            value={color.hex}
            onChange={(event) => {
              const next = [...colors];
              next[index] = { ...next[index], hex: event.target.value };
              onChange(next);
            }}
            className="h-10 w-12 cursor-pointer border border-outline-variant"
          />
          <button
            type="button"
            onClick={() => onChange(colors.filter((_, i) => i !== index))}
            className="font-label border border-error px-2 py-2 text-[10px] font-bold uppercase text-error"
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...colors, { name: "", hex: "#000000" }])}
        className="font-label border border-outline-variant px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface"
      >
        Add Color
      </button>
    </div>
  );
}

function ProductSizesEditor({
  sizes,
  onChange,
}: {
  sizes: SizeEntry[];
  onChange: (sizes: SizeEntry[]) => void;
}) {
  return (
    <div className="space-y-3">
      {sizes.map((size, index) => (
        <div key={index} className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={size.label}
            onChange={(event) => {
              const next = [...sizes];
              next[index] = { label: event.target.value.toUpperCase() };
              onChange(next);
            }}
            placeholder="e.g. XL"
            className="font-body min-w-[8rem] flex-1 border border-outline-variant px-3 py-2 text-sm uppercase"
          />
          <button
            type="button"
            onClick={() => onChange(sizes.filter((_, i) => i !== index))}
            className="font-label border border-error px-2 py-2 text-[10px] font-bold uppercase text-error"
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...sizes, { label: "" }])}
        className="font-label border border-outline-variant px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface"
      >
        Add Size
      </button>
    </div>
  );
}

export function ProductForm({
  categoryTree,
  initial,
  onCancel,
  redirectOnSuccess,
}: {
  categoryTree: CategoryTreeNode[];
  initial?: StoreProductWithRelations;
  onCancel?: () => void;
  redirectOnSuccess?: string;
}) {
  const router = useRouter();
  const action = initial ? updateProduct : createProduct;
  const [state, formAction, pending] = useActionState(action, null);
  const [images, setImages] = useState<ImageEntry[]>(
    initial?.images.map((image) => ({
      url: image.url,
      alt: image.alt,
      colorName: image.color_name ?? "",
    })) ?? [],
  );
  const [colors, setColors] = useState<ColorEntry[]>(
    initial?.colors.map((color) => ({ name: color.name, hex: color.hex })) ??
      [{ name: "Black", hex: "#000000" }],
  );
  const [sizes, setSizes] = useState<SizeEntry[]>(
    initial?.sizes.map((size) => ({ label: size.label })) ?? [
      { label: "S" },
      { label: "M" },
      { label: "L" },
      { label: "XL" },
    ],
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    initial?.category_id ?? "",
  );
  const [discountType, setDiscountType] = useState<DiscountType | "none">(
    initial?.discount_type ?? "none",
  );
  const [paymentMethods, setPaymentMethods] = useState({
    card: true,
    cashOnDelivery: true,
  });
  const [inventory, setInventory] = useState(initial?.inventory ?? 0);
  const categoryOptions = flattenCategoryTreeOptions(categoryTree);

  useEffect(() => {
    if (state?.success && !initial) {
      if (redirectOnSuccess) {
        router.push(redirectOnSuccess);
        return;
      }

      setImages([]);
      setColors([{ name: "Black", hex: "#000000" }]);
      setSizes([
        { label: "S" },
        { label: "M" },
        { label: "L" },
        { label: "XL" },
      ]);
      setSelectedCategoryId("");
      setDiscountType("none");
      setPaymentMethods({ card: true, cashOnDelivery: true });
      setInventory(0);
    }
  }, [initial, redirectOnSuccess, router, state?.success]);

  return (
    <form action={formAction} className="space-y-4">
      {initial ? <input type="hidden" name="id" value={initial.id} /> : null}
      <input type="hidden" name="category_id" value={selectedCategoryId} />
      <input type="hidden" name="images_json" value={JSON.stringify(images)} />
      <input type="hidden" name="colors_json" value={JSON.stringify(colors)} />
      <input type="hidden" name="sizes_json" value={JSON.stringify(sizes)} />

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
        <div>
          <label className="mb-2 block font-label text-xs font-bold uppercase tracking-[0.12em] text-on-surface-variant">
            Brand
          </label>
          <input
            name="brand"
            defaultValue={initial?.brand ?? "VELVORZ"}
            className="font-body w-full border border-outline-variant px-3 py-2 text-sm"
          />
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
            disabled={discountType === "none"}
            className="font-body w-full border border-outline-variant px-3 py-2 text-sm disabled:opacity-60"
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block font-label text-xs font-bold uppercase tracking-[0.12em] text-on-surface-variant">
          Product Images
        </label>
        <ProductImagesEditor images={images} colors={colors} onChange={setImages} />
      </div>

      <div>
        <label className="mb-2 block font-label text-xs font-bold uppercase tracking-[0.12em] text-on-surface-variant">
          Colors
        </label>
        <ProductColorsEditor colors={colors} onChange={setColors} />
      </div>

      <div>
        <label className="mb-2 block font-label text-xs font-bold uppercase tracking-[0.12em] text-on-surface-variant">
          Sizes
        </label>
        <ProductSizesEditor sizes={sizes} onChange={setSizes} />
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

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block font-label text-xs font-bold uppercase tracking-[0.12em] text-on-surface-variant">
            Badge (optional)
          </label>
          <input
            name="badge"
            placeholder="e.g. NEW or PRE ORDER"
            defaultValue={initial?.badge ?? ""}
            className="font-body w-full border border-outline-variant px-3 py-2 text-sm"
          />
        </div>
        <label className="flex items-center gap-2 self-end pb-2">
          <input
            type="checkbox"
            name="is_published"
            defaultChecked={initial?.is_published ?? true}
          />
          <span className="font-body text-sm text-on-surface">Published</span>
        </label>
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
          Inventory
        </label>
        <input
          type="number"
          name="inventory"
          min="0"
          step="1"
          required
          value={inventory}
          onChange={(event) =>
            setInventory(Math.max(0, Math.floor(Number(event.target.value) || 0)))
          }
          className="font-body w-full max-w-xs border border-outline-variant px-3 py-2 text-sm"
        />
        <p className="font-body mt-2 text-xs leading-normal text-on-surface-variant">
          When stock is 10 or less, the store shows &quot;Low Stock&quot;.
          At 0, Add to Cart is disabled.
        </p>
      </div>

      {state?.error ? (
        <p className="font-body text-sm text-error">{state.error}</p>
      ) : null}
      {state?.success ? (
        <p className="font-body text-sm text-primary">{state.success}</p>
      ) : null}

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
}: {
  product: StoreProductWithRelations;
  categoryTree: CategoryTreeNode[];
}) {
  const [isEditing, setIsEditing] = useState(false);
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

  return (
    <li className="rounded-sm border border-outline-variant p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          {image ? (
            <div className="relative h-16 w-16 shrink-0 overflow-hidden border border-outline-variant">
              <Image
                src={image}
                alt={product.name}
                fill
                sizes="64px"
                className="object-cover"
              />
            </div>
          ) : null}
          <div>
            <p className="font-label text-sm font-bold uppercase text-on-surface">
              {product.name}
            </p>
            <p className="font-body mt-1 text-xs text-on-surface-variant">
              {product.category?.name ?? "Uncategorized"} ·{" "}
              {pricing.hasDiscount ? (
                <>
                  <span className="line-through">{formatPrice(product.base_price)}</span>{" "}
                  {formatPrice(product.price)}
                </>
              ) : (
                formatPrice(product.price)
              )}
              {!product.is_published ? " · Draft" : ""}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setIsEditing((open) => !open)}
            className="font-label border border-outline-variant px-3 py-1.5 text-[10px] font-bold uppercase text-on-surface"
          >
            {isEditing ? "Close" : "Edit"}
          </button>
          <form action={deleteAction}>
            <input type="hidden" name="id" value={product.id} />
            <button
              type="submit"
              disabled={deletePending}
              onClick={(event) => {
                if (!window.confirm(`Delete "${product.name}"?`)) {
                  event.preventDefault();
                }
              }}
              className="font-label border border-error px-3 py-1.5 text-[10px] font-bold uppercase text-error"
            >
              Delete
            </button>
          </form>
        </div>
      </div>

      {deleteState?.error ? (
        <p className="font-body mt-2 text-sm text-error">{deleteState.error}</p>
      ) : null}

      {isEditing ? (
        <div className="mt-4 border-t border-outline-variant pt-4">
          <ProductForm
            categoryTree={categoryTree}
            initial={product}
            onCancel={() => setIsEditing(false)}
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
}: ProductsAdminProps) {
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
        <h2 className="font-label text-xs font-bold uppercase tracking-[0.15em] text-on-surface">
          All Products
        </h2>
        {products.length === 0 ? (
          <p className="font-body mt-4 text-sm text-on-surface-variant">
            No products yet.
          </p>
        ) : (
          <ul className="mt-4 space-y-4">
            {products.map((product) => (
              <ProductRow
                key={product.id}
                product={product}
                categoryTree={categoryTree}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CategoryTreeNode } from "@/lib/category-types";
import type { ProductsSchemaStatus } from "@/lib/products-schema-types";
import { ProductForm } from "./ProductsAdmin";

type ProductCreateAdminProps = {
  categoryTree: CategoryTreeNode[];
  schemaStatus: ProductsSchemaStatus;
};

export function ProductCreateAdmin({
  categoryTree,
  schemaStatus,
}: ProductCreateAdminProps) {
  const router = useRouter();
  if (!schemaStatus.ready) {
    return (
      <div className="space-y-6">
        <div>
          <Link
            href="/admin/products"
            className="font-label text-xs font-bold uppercase tracking-[0.12em] text-on-surface-variant hover:text-on-surface"
          >
            ← Back to Products
          </Link>
          <h1 className="font-headline mt-2 text-2xl font-extrabold uppercase leading-tight tracking-tight text-on-surface md:text-3xl">
            Add Product
          </h1>
        </div>
        <p className="font-body text-sm text-on-surface-variant">
          The database needs to be updated before you can create products. Go
          back to the products page and apply the database fix first.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/products"
          className="font-label text-xs font-bold uppercase tracking-[0.12em] text-on-surface-variant hover:text-on-surface"
        >
          ← Back to Products
        </Link>
        <p className="font-label mt-4 text-xs font-bold uppercase tracking-[0.15em] leading-none text-on-surface-variant">
          Admin
        </p>
        <h1 className="font-headline mt-2 text-2xl font-extrabold uppercase leading-tight tracking-tight text-on-surface md:text-3xl">
          Add Product
        </h1>
        <p className="font-body mt-2 text-sm text-on-surface-variant">
          First select a main category, then choose one of its sub-categories
          (optional). Products can be assigned to either main or sub-categories.
        </p>
      </div>

      <section className="rounded-sm border border-outline-variant bg-surface-container-lowest p-5 md:p-6">
        <ProductForm
          categoryTree={categoryTree}
          redirectOnSuccess="/admin/products"
          onCancel={() => router.push("/admin/products")}
        />
      </section>
    </div>
  );
}

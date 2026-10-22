"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  createBrandAction,
  deleteBrandAction,
  renameBrandAction,
} from "@/app/admin/(dashboard)/brands/actions";
import {
  AdminEmptyState,
  AdminPageHeader,
  AdminPanel,
  adminInputClass,
  adminPrimaryButtonClass,
  adminSecondaryButtonClass,
} from "@/components/admin/AdminUi";

type BrandWithCount = { id: string; name: string; productCount: number };

function BrandRow({ brand }: { brand: BrandWithCount }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(brand.name);
  const [error, setError] = useState<string | null>(null);

  function run(action: () => Promise<{ success: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.success) {
        setError(result.error || "Action failed.");
        return;
      }
      setIsEditing(false);
      router.refresh();
    });
  }

  return (
    <li className="py-3">
      <div className="flex flex-wrap items-center gap-3">
        {isEditing ? (
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={`${adminInputClass} max-w-xs`}
            autoFocus
          />
        ) : (
          <p className="font-body min-w-0 flex-1 text-sm font-medium text-on-surface">
            {brand.name}
          </p>
        )}
        <Link
          href={`/admin/products?q=${encodeURIComponent(brand.name)}`}
          className="font-body text-xs text-on-surface-variant hover:underline"
        >
          {brand.productCount} product{brand.productCount === 1 ? "" : "s"}
        </Link>
        <div className="ml-auto flex gap-2">
          {isEditing ? (
            <>
              <button
                type="button"
                disabled={isPending}
                onClick={() => run(() => renameBrandAction(brand.id, name))}
                className={adminPrimaryButtonClass}
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setName(brand.name);
                }}
                className={adminSecondaryButtonClass}
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className={adminSecondaryButtonClass}
              >
                Rename
              </button>
              <button
                type="button"
                disabled={isPending || brand.productCount > 0}
                title={brand.productCount > 0 ? "Reassign products before deleting" : undefined}
                onClick={() => run(() => deleteBrandAction(brand.id))}
                className="font-label px-2 text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant hover:text-error disabled:opacity-40"
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>
      {isEditing && brand.productCount > 0 ? (
        <p className="font-body mt-1 text-xs text-on-surface-variant">
          Renaming updates all {brand.productCount} products using this brand.
        </p>
      ) : null}
      {error ? <p className="font-body mt-1 text-xs text-error">{error}</p> : null}
    </li>
  );
}

export function BrandsAdmin({ brands }: { brands: BrandWithCount[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createBrandAction(newName);
      if (!result.success) {
        setError(result.error || "Unable to create brand.");
        return;
      }
      setNewName("");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Brands"
        description="Brands appear in the product form and on product cards across the store."
      />

      <AdminPanel title="Add brand">
        <form onSubmit={handleCreate} className="flex flex-wrap gap-2">
          <input
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            placeholder="Brand name"
            className={`${adminInputClass} max-w-sm`}
          />
          <button
            type="submit"
            disabled={isPending || !newName.trim()}
            className={adminPrimaryButtonClass}
          >
            {isPending ? "Adding..." : "Add brand"}
          </button>
        </form>
        {error ? <p className="font-body mt-2 text-xs text-error">{error}</p> : null}
      </AdminPanel>

      <AdminPanel title={`All brands (${brands.length})`}>
        {brands.length === 0 ? (
          <AdminEmptyState>No brands yet.</AdminEmptyState>
        ) : (
          <ul className="divide-y divide-outline-variant">
            {brands.map((brand) => (
              <BrandRow key={brand.id} brand={brand} />
            ))}
          </ul>
        )}
      </AdminPanel>
    </div>
  );
}

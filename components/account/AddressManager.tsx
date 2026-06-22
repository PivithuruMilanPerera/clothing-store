"use client";

import { useActionState, useEffect, useState } from "react";
import {
  deleteAddressFromForm,
  saveAddress,
  type ActionState,
} from "@/app/account/actions";
import { Button, Input } from "@/components/ui";
import type { Address } from "@/lib/types";
import { cn } from "@/lib/utils";

const initialState: ActionState | null = null;

type AddressManagerProps = {
  addresses: Address[];
};

function formatAddress(address: Address) {
  const lines = [
    address.full_name,
    address.line1,
    address.line2,
    `${address.city}, ${address.state} ${address.postal_code}`,
    address.country,
  ].filter(Boolean);

  return lines;
}

export function AddressManager({ addresses }: AddressManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(addresses.length === 0);
  const [state, formAction, isPending] = useActionState(
    saveAddress,
    initialState,
  );

  const editingAddress = addresses.find((address) => address.id === editingId);

  function openNewForm() {
    setEditingId(null);
    setShowForm(true);
  }

  function openEditForm(addressId: string) {
    setEditingId(addressId);
    setShowForm(true);
  }

  function closeForm() {
    setEditingId(null);
    setShowForm(false);
  }

  useEffect(() => {
    if (state?.success) {
      closeForm();
    }
  }, [state?.success]);

  return (
    <div className="space-y-8">
      {addresses.length > 0 ? (
        <ul className="grid gap-4 md:grid-cols-2">
          {addresses.map((address) => (
            <li
              key={address.id}
              className={cn(
                "border p-5",
                address.is_default
                  ? "border-primary bg-surface-container-low"
                  : "border-outline-variant bg-surface-container-lowest",
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-label text-xs font-bold uppercase tracking-[0.15em] leading-none text-on-surface">
                    {address.label}
                    {address.is_default ? (
                      <span className="ml-2 text-on-surface-variant">
                        Default
                      </span>
                    ) : null}
                  </p>
                  <div className="font-body text-base leading-normal mt-3 space-y-1 text-on-surface-variant">
                    {formatAddress(address).map((line) => (
                      <p key={line}>{line}</p>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  className="px-4 py-2"
                  onClick={() => openEditForm(address.id)}
                >
                  Edit
                </Button>
                <form action={deleteAddressFromForm}>
                  <input type="hidden" name="addressId" value={address.id} />
                  <Button
                    type="submit"
                    variant="secondary"
                    className="px-4 py-2"
                  >
                    Remove
                  </Button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {!showForm ? (
        <Button type="button" onClick={openNewForm}>
          Add Address
        </Button>
      ) : (
        <div className="border border-outline-variant bg-surface-container-lowest p-6 md:p-8">
          <h3 className="font-headline text-lg font-bold leading-tight md:text-2xl text-on-surface">
            {editingAddress ? "Edit Address" : "Add Address"}
          </h3>

          <form action={formAction} className="mt-6 grid gap-6 md:grid-cols-2">
            {editingAddress ? (
              <input type="hidden" name="addressId" value={editingAddress.id} />
            ) : null}

            <Input
              label="Label"
              type="text"
              name="label"
              defaultValue={editingAddress?.label ?? "Home"}
              required
              disabled={isPending}
            />
            <Input
              label="Full Name"
              type="text"
              name="fullName"
              defaultValue={editingAddress?.full_name ?? ""}
              autoComplete="name"
              required
              disabled={isPending}
            />
            <Input
              label="Address Line 1"
              type="text"
              name="line1"
              defaultValue={editingAddress?.line1 ?? ""}
              autoComplete="address-line1"
              required
              disabled={isPending}
              className="md:col-span-2"
            />
            <Input
              label="Address Line 2"
              type="text"
              name="line2"
              defaultValue={editingAddress?.line2 ?? ""}
              autoComplete="address-line2"
              disabled={isPending}
              className="md:col-span-2"
            />
            <Input
              label="City"
              type="text"
              name="city"
              defaultValue={editingAddress?.city ?? ""}
              autoComplete="address-level2"
              required
              disabled={isPending}
            />
            <Input
              label="State"
              type="text"
              name="state"
              defaultValue={editingAddress?.state ?? ""}
              autoComplete="address-level1"
              required
              disabled={isPending}
            />
            <Input
              label="Postal Code"
              type="text"
              name="postalCode"
              defaultValue={editingAddress?.postal_code ?? ""}
              autoComplete="postal-code"
              required
              disabled={isPending}
            />
            <Input
              label="Country"
              type="text"
              name="country"
              defaultValue={editingAddress?.country ?? "Sri Lanka"}
              autoComplete="country-name"
              required
              disabled={isPending}
            />

            <label className="font-body text-base leading-normal flex items-center gap-3 text-on-surface md:col-span-2">
              <input
                type="checkbox"
                name="isDefault"
                defaultChecked={editingAddress?.is_default ?? addresses.length === 0}
                disabled={isPending}
                className="h-4 w-4 accent-primary"
              />
              Set as default address
            </label>

            {state?.error ? (
              <p className="font-body text-base leading-normal text-error md:col-span-2" role="alert">
                {state.error}
              </p>
            ) : null}

            <div className="flex flex-wrap gap-3 md:col-span-2">
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : "Save Address"}
              </Button>
              <Button type="button" variant="secondary" onClick={closeForm}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

"use client";

import { ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { SearchIcon } from "@/components/icons";
import { Popup } from "@/components/ui";
import type { Address } from "@/lib/types";
import type { AdminUser, AdminUserKind } from "@/lib/users";
import { cn } from "@/lib/utils";

type UsersAdminProps = {
  users: AdminUser[];
};

type KindFilter = "all" | AdminUserKind;

const KIND_FILTERS: { value: KindFilter; label: string }[] = [
  { value: "all", label: "All users" },
  { value: "registered", label: "Registered" },
  { value: "guest", label: "Guest" },
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatAddress(address: Address) {
  const lines = [
    address.full_name,
    address.line1,
    address.line2,
    [address.city, address.state, address.postal_code].filter(Boolean).join(", "),
    address.country,
  ].filter((line) => Boolean(line?.trim()));

  return lines;
}

function formatShippingAddress(address: AdminUser["shipping_address"]) {
  if (!address) {
    return null;
  }

  const lines = [
    address.fullName || [address.firstName, address.lastName].filter(Boolean).join(" "),
    address.company,
    address.line1,
    address.line2,
    [address.city, address.state, address.postalCode].filter(Boolean).join(", "),
    address.country,
  ].filter((line) => Boolean(line?.trim()));

  return lines.length > 0 ? lines : null;
}

function matchesUserSearch(user: AdminUser, query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return true;
  }

  const addressText = user.addresses
    .map((address) =>
      [
        address.label,
        address.full_name,
        address.line1,
        address.line2,
        address.city,
        address.state,
        address.postal_code,
        address.country,
      ].join(" "),
    )
    .join(" ");

  const shippingText = user.shipping_address
    ? Object.values(user.shipping_address).join(" ")
    : "";

  return [
    user.id,
    user.full_name,
    user.email,
    user.phone,
    user.kind,
    addressText,
    shippingText,
  ]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(normalizedQuery));
}

function KindBadge({ kind }: { kind: AdminUserKind }) {
  const isRegistered = kind === "registered";

  return (
    <span
      className={cn(
        "font-label inline-block border px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] leading-none",
        isRegistered
          ? "border-green-600/30 bg-green-600/10 text-green-600"
          : "border-outline-variant bg-surface-container-low text-on-surface-variant",
      )}
    >
      {isRegistered ? "Registered" : "Guest"}
    </span>
  );
}

function UserRow({ user }: { user: AdminUser }) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const isGuest = user.kind === "guest";
  const addressCount = user.addresses.length;
  const defaultAddress =
    user.addresses.find((address) => address.is_default) ?? user.addresses[0];
  const shippingLines = formatShippingAddress(user.shipping_address);

  return (
    <li className="border border-outline-variant bg-surface-container-lowest">
      <button
        type="button"
        onClick={() => setDetailsOpen(true)}
        className="w-full px-5 py-4 text-left md:px-6"
      >
        <div className="flex w-full flex-wrap items-start gap-x-3 gap-y-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-label text-xs font-bold uppercase tracking-[0.15em] leading-none text-on-surface">
                {user.full_name || (isGuest ? "Guest customer" : "Unnamed user")}
              </p>
              <KindBadge kind={user.kind} />
            </div>
            <p className="font-body mt-2 text-sm text-on-surface">{user.email}</p>
            <p className="font-body mt-1 text-sm text-on-surface-variant">
              {user.phone || "No phone"}
            </p>
            <p className="font-body mt-1 text-xs text-on-surface-variant">
              {isGuest ? "First order" : "Joined"} {formatDate(user.created_at)}
            </p>
          </div>

          <ChevronRight
            className="mt-1 h-4 w-4 shrink-0 text-on-surface-variant sm:order-3"
            aria-hidden="true"
          />

          <div className="flex w-full justify-end sm:order-2 sm:w-auto">
            <div className="flex flex-col items-end text-right">
              {isGuest ? (
                <>
                  <p className="font-body text-sm text-on-surface">
                    {user.order_count} order{user.order_count === 1 ? "" : "s"}
                  </p>
                  {shippingLines?.[0] ? (
                    <p className="font-body mt-1 max-w-48 truncate text-xs text-on-surface-variant">
                      {user.shipping_address?.city
                        ? `${user.shipping_address.city}, ${user.shipping_address.country || ""}`.trim()
                        : shippingLines[0]}
                    </p>
                  ) : (
                    <p className="font-body mt-1 text-xs text-on-surface-variant">
                      No shipping address
                    </p>
                  )}
                </>
              ) : (
                <>
                  <p className="font-body text-sm text-on-surface">
                    {addressCount} address{addressCount === 1 ? "" : "es"}
                  </p>
                  {defaultAddress ? (
                    <p className="font-body mt-1 max-w-48 truncate text-xs text-on-surface-variant">
                      {defaultAddress.city}, {defaultAddress.country}
                    </p>
                  ) : (
                    <p className="font-body mt-1 text-xs text-on-surface-variant">
                      No saved addresses
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </button>

      <Popup
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        title={user.full_name || (isGuest ? "Guest details" : "User details")}
        description={`${isGuest ? "Guest" : "Registered"} · ${user.email}`}
        size="lg"
      >
        <div className="space-y-6">
          <div>
            <p className="font-label text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">
              {isGuest ? "Guest checkout" : "Account"}
            </p>
            <dl className="mt-3 space-y-3">
              <div>
                <dt className="font-label text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">
                  Type
                </dt>
                <dd className="mt-1">
                  <KindBadge kind={user.kind} />
                </dd>
              </div>
              <div>
                <dt className="font-label text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">
                  Full name
                </dt>
                <dd className="font-body mt-1 text-sm text-on-surface">
                  {user.full_name || "—"}
                </dd>
              </div>
              <div>
                <dt className="font-label text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">
                  Email
                </dt>
                <dd className="font-body mt-1 text-sm text-on-surface">
                  {user.email}
                </dd>
              </div>
              <div>
                <dt className="font-label text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">
                  Phone
                </dt>
                <dd className="font-body mt-1 text-sm text-on-surface">
                  {user.phone || "—"}
                </dd>
              </div>
              {!isGuest ? (
                <div>
                  <dt className="font-label text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">
                    User ID
                  </dt>
                  <dd className="font-body mt-1 break-all text-sm text-on-surface">
                    {user.id}
                  </dd>
                </div>
              ) : (
                <div>
                  <dt className="font-label text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">
                    Orders
                  </dt>
                  <dd className="font-body mt-1 text-sm text-on-surface">
                    {user.order_count} guest order
                    {user.order_count === 1 ? "" : "s"}
                  </dd>
                </div>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="font-label text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">
                    {isGuest ? "First order" : "Created"}
                  </dt>
                  <dd className="font-body mt-1 text-sm text-on-surface">
                    {formatDate(user.created_at)}
                  </dd>
                </div>
                <div>
                  <dt className="font-label text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">
                    {isGuest ? "Latest order" : "Updated"}
                  </dt>
                  <dd className="font-body mt-1 text-sm text-on-surface">
                    {formatDate(user.updated_at)}
                  </dd>
                </div>
              </div>
            </dl>
          </div>

          {isGuest ? (
            <div>
              <p className="font-label text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">
                Latest shipping address
              </p>
              {shippingLines ? (
                <div className="font-body mt-3 space-y-0.5 text-sm text-on-surface">
                  {shippingLines.map((line) => (
                    <p key={`${user.id}-${line}`}>{line}</p>
                  ))}
                </div>
              ) : (
                <p className="font-body mt-3 text-sm text-on-surface-variant">
                  No shipping address.
                </p>
              )}
            </div>
          ) : (
            <div>
              <p className="font-label text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">
                Addresses
              </p>
              {user.addresses.length === 0 ? (
                <p className="font-body mt-3 text-sm text-on-surface-variant">
                  No saved addresses.
                </p>
              ) : (
                <ul className="mt-3 divide-y divide-outline-variant border-t border-outline-variant">
                  {user.addresses.map((address) => {
                    const lines = formatAddress(address);

                    return (
                      <li key={address.id} className="py-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-label text-xs font-bold uppercase tracking-[0.12em] text-on-surface">
                            {address.label}
                          </p>
                          {address.is_default ? (
                            <span className="font-label border border-outline-variant px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">
                              Default
                            </span>
                          ) : null}
                        </div>
                        <div className="font-body mt-2 space-y-0.5 text-sm text-on-surface">
                          {lines.map((line) => (
                            <p key={`${address.id}-${line}`}>{line}</p>
                          ))}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </div>
      </Popup>
    </li>
  );
}

export function UsersAdmin({ users }: UsersAdminProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [kindFilter, setKindFilter] = useState<KindFilter>("all");

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      if (kindFilter !== "all" && user.kind !== kindFilter) {
        return false;
      }

      return matchesUserSearch(user, searchQuery);
    });
  }, [users, searchQuery, kindFilter]);

  const registeredCount = users.filter((user) => user.kind === "registered").length;
  const guestCount = users.filter((user) => user.kind === "guest").length;
  const hasActiveFilters = searchQuery.trim().length > 0 || kindFilter !== "all";

  return (
    <div className="space-y-6">
      <div>
        <p className="font-label text-xs font-bold uppercase tracking-[0.15em] leading-none text-on-surface-variant">
          Admin
        </p>
        <h1 className="font-headline mt-2 text-2xl font-extrabold uppercase leading-tight tracking-tight text-on-surface md:text-3xl">
          Users
        </h1>
      </div>

      <section>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-label text-xs font-bold uppercase tracking-[0.15em] text-on-surface">
            All Users
          </h2>
          <p className="font-body text-xs text-on-surface-variant">
            {filteredUsers.length === users.length
              ? `${users.length} user${users.length === 1 ? "" : "s"} · ${registeredCount} registered · ${guestCount} guest`
              : `${filteredUsers.length} of ${users.length} · ${registeredCount} registered · ${guestCount} guest`}
          </p>
        </div>

        {users.length > 0 ? (
          <div className="mt-4 flex flex-wrap items-end gap-3 md:grid md:grid-cols-3">
            <label className="block min-w-0 flex-1 md:col-span-2">
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
                  placeholder="Search by name, email, phone, or address..."
                  className="font-body min-w-0 flex-1 bg-transparent text-sm text-on-surface outline-none placeholder:text-on-surface-variant"
                />
              </div>
            </label>

            <label className="block min-w-48 flex-1">
              <span className="mb-2 block font-label text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">
                User type
              </span>
              <select
                value={kindFilter}
                onChange={(event) =>
                  setKindFilter(event.target.value as KindFilter)
                }
                className="font-body w-full border border-outline-variant/50 px-3 py-2 text-sm"
              >
                {KIND_FILTERS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : null}

        {hasActiveFilters ? (
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setKindFilter("all");
              }}
              className="font-label text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant hover:text-on-surface"
            >
              Clear filters
            </button>
          </div>
        ) : null}

        {users.length === 0 ? (
          <p className="font-body mt-4 text-sm text-on-surface-variant">
            No registered or guest users yet.
          </p>
        ) : filteredUsers.length === 0 ? (
          <p className="font-body mt-4 text-sm text-on-surface-variant">
            No users match your search or filters.
          </p>
        ) : (
          <ul className="mt-6 space-y-4">
            {filteredUsers.map((user) => (
              <UserRow key={user.id} user={user} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

import { requireAdmin } from "@/lib/auth";
import { createAdminClient, hasAdminCredentials } from "@/lib/supabase/admin";
import type { Address, Profile } from "@/lib/types";

const ADMIN_USERS_PAGE_SIZE = 1000;

export type AdminUserKind = "registered" | "guest";

export type AdminUser = {
  id: string;
  kind: AdminUserKind;
  full_name: string;
  email: string;
  phone: string | null;
  created_at: string;
  updated_at: string;
  addresses: Address[];
  order_count: number;
  shipping_address: Record<string, string> | null;
};

type GuestOrderRow = {
  id: string;
  customer_email: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  shipping_address: Record<string, string> | null;
  created_at: string;
  updated_at: string;
};

function normalizeEmail(email: string | null | undefined) {
  return email?.trim().toLowerCase() ?? "";
}

export async function getAllUsersForAdmin(): Promise<AdminUser[]> {
  await requireAdmin();

  if (!hasAdminCredentials()) {
    console.error("Failed to load admin users: missing Supabase admin credentials.");
    return [];
  }

  const supabase = createAdminClient();
  const profiles: Profile[] = [];

  for (let from = 0; ; from += ADMIN_USERS_PAGE_SIZE) {
    const to = from + ADMIN_USERS_PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, phone, created_at, updated_at")
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Failed to load admin users:", error.message);
      return [];
    }

    const page = (data ?? []) as Profile[];
    profiles.push(...page);

    if (page.length < ADMIN_USERS_PAGE_SIZE) {
      break;
    }
  }

  const addressesByUserId = new Map<string, Address[]>();

  for (let from = 0; ; from += ADMIN_USERS_PAGE_SIZE) {
    const to = from + ADMIN_USERS_PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from("addresses")
      .select(
        "id, user_id, label, full_name, line1, line2, city, state, postal_code, country, is_default, created_at, updated_at",
      )
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Failed to load admin user addresses:", error.message);
      break;
    }

    const page = (data ?? []) as Address[];
    for (const address of page) {
      const existing = addressesByUserId.get(address.user_id) ?? [];
      existing.push(address);
      addressesByUserId.set(address.user_id, existing);
    }

    if (page.length < ADMIN_USERS_PAGE_SIZE) {
      break;
    }
  }

  const registeredEmails = new Set(
    profiles.map((profile) => normalizeEmail(profile.email)).filter(Boolean),
  );

  const registeredUsers: AdminUser[] = profiles.map((profile) => ({
    id: profile.id,
    kind: "registered",
    full_name: profile.full_name,
    email: profile.email,
    phone: profile.phone,
    created_at: profile.created_at,
    updated_at: profile.updated_at,
    addresses: addressesByUserId.get(profile.id) ?? [],
    order_count: 0,
    shipping_address: null,
  }));

  const guestOrders: GuestOrderRow[] = [];

  for (let from = 0; ; from += ADMIN_USERS_PAGE_SIZE) {
    const to = from + ADMIN_USERS_PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from("orders")
      .select(
        "id, customer_email, customer_name, customer_phone, shipping_address, created_at, updated_at",
      )
      .eq("is_guest", true)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Failed to load guest orders for users:", error.message);
      break;
    }

    const page = (data ?? []) as GuestOrderRow[];
    guestOrders.push(...page);

    if (page.length < ADMIN_USERS_PAGE_SIZE) {
      break;
    }
  }

  const guestsByEmail = new Map<string, AdminUser>();

  for (const order of guestOrders) {
    const email = normalizeEmail(order.customer_email);
    if (!email || registeredEmails.has(email)) {
      continue;
    }

    const existing = guestsByEmail.get(email);
    if (existing) {
      existing.order_count += 1;
      if (order.created_at < existing.created_at) {
        existing.created_at = order.created_at;
      }
      if (order.updated_at > existing.updated_at) {
        existing.updated_at = order.updated_at;
        existing.full_name = order.customer_name?.trim() || existing.full_name;
        existing.phone = order.customer_phone?.trim() || existing.phone;
        existing.shipping_address =
          order.shipping_address ?? existing.shipping_address;
      }
      continue;
    }

    guestsByEmail.set(email, {
      id: `guest:${email}`,
      kind: "guest",
      full_name: order.customer_name?.trim() || "Guest customer",
      email: order.customer_email?.trim() || email,
      phone: order.customer_phone?.trim() || null,
      created_at: order.created_at,
      updated_at: order.updated_at,
      addresses: [],
      order_count: 1,
      shipping_address: order.shipping_address,
    });
  }

  return [...registeredUsers, ...guestsByEmail.values()].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

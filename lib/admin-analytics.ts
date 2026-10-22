import "server-only";

import { requireAdmin, requireSuperAdmin } from "@/lib/auth";
import {
  isLowStock,
  isOutOfStock,
  resolveLowStockThreshold,
} from "@/lib/inventory";
import { fetchAllOrders } from "@/lib/orders";
import type { StoreProductWithRelations } from "@/lib/product-types";
import { getAllProductsForAdmin } from "@/lib/products";
import { createAdminClient, hasAdminCredentials } from "@/lib/supabase/admin";
import type { Order } from "@/lib/types";

export const STORE_TIME_ZONE = "Asia/Colombo";

export type ReportPeriod = "day" | "month" | "year";

/** Orders that count toward revenue and sales: not cancelled and not failed payment. */
export function isRevenueOrder(order: Order): boolean {
  return order.status !== "cancelled" && order.payment_status !== "failed";
}

const dateKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: STORE_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** YYYY-MM-DD in store time. */
export function toStoreDateKey(value: string | Date): string {
  return dateKeyFormatter.format(new Date(value));
}

function bucketKey(dateKey: string, period: ReportPeriod): string {
  if (period === "year") return dateKey.slice(0, 4);
  if (period === "month") return dateKey.slice(0, 7);
  return dateKey;
}

function addToDateKey(dateKey: string, period: ReportPeriod, amount: number): string {
  const [y, m, d] = dateKey.split("-").map(Number) as [number, number, number];
  const date = new Date(Date.UTC(y, m - 1, d));
  if (period === "day") date.setUTCDate(date.getUTCDate() + amount);
  if (period === "month") date.setUTCMonth(date.getUTCMonth() + amount, 1);
  if (period === "year") date.setUTCFullYear(date.getUTCFullYear() + amount, 0, 1);
  return date.toISOString().slice(0, 10);
}

function enumerateBuckets(fromKey: string, toKey: string, period: ReportPeriod) {
  const buckets: string[] = [];
  let cursor =
    period === "day"
      ? fromKey
      : period === "month"
        ? `${fromKey.slice(0, 7)}-01`
        : `${fromKey.slice(0, 4)}-01-01`;
  const end = bucketKey(toKey, period);

  for (let guard = 0; guard < 2000; guard += 1) {
    const key = bucketKey(cursor, period);
    buckets.push(key);
    if (key >= end) break;
    cursor = addToDateKey(cursor, period, 1);
  }

  return buckets;
}

export function formatBucketLabel(key: string, period: ReportPeriod): string {
  if (period === "year") return key;
  const [y, m, d] = key.split("-").map(Number) as [number, number, number?];
  const date = new Date(Date.UTC(y, m - 1, d ?? 1));
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    ...(period === "month"
      ? { month: "short", year: "numeric" }
      : { month: "short", day: "numeric" }),
  }).format(date);
}

function productKey(item: { product_slug: string | null; product_name: string }) {
  return item.product_slug || `name:${item.product_name.trim().toLowerCase()}`;
}

function customerKey(order: Order): string | null {
  if (order.user_id) return order.user_id;
  const email = order.customer_email?.trim().toLowerCase();
  return email ? `guest:${email}` : null;
}

export type BestSeller = {
  key: string;
  slug: string | null;
  name: string;
  image: string | null;
  units: number;
  revenue: number;
  orders: number;
  lastSoldAt: string;
};

function aggregateBestSellers(orders: Order[]): BestSeller[] {
  const map = new Map<string, BestSeller & { orderIds: Set<string> }>();

  for (const order of orders) {
    if (!isRevenueOrder(order)) continue;

    for (const item of order.order_items ?? []) {
      const key = productKey(item);
      const entry =
        map.get(key) ??
        {
          key,
          slug: item.product_slug,
          name: item.product_name,
          image: item.image,
          units: 0,
          revenue: 0,
          orders: 0,
          lastSoldAt: order.created_at,
          orderIds: new Set<string>(),
        };

      entry.units += item.quantity;
      entry.revenue += Number(item.unit_price) * item.quantity;
      entry.orderIds.add(order.id);
      entry.orders = entry.orderIds.size;
      if (order.created_at > entry.lastSoldAt) entry.lastSoldAt = order.created_at;
      if (!entry.image && item.image) entry.image = item.image;
      map.set(key, entry);
    }
  }

  return [...map.values()]
    .map(({ orderIds, ...rest }) => ({ ...rest, orders: orderIds.size }))
    .sort((a, b) => b.units - a.units || b.revenue - a.revenue);
}

export type StockAlert = {
  productId: string;
  productName: string;
  slug: string;
  image: string | null;
  isPublished: boolean;
  variantLabel: string | null;
  inventory: number;
  threshold: number;
  state: "low" | "out";
};

export function collectStockAlerts(products: StoreProductWithRelations[]): StockAlert[] {
  const alerts: StockAlert[] = [];

  for (const product of products) {
    const threshold = resolveLowStockThreshold(product.low_stock_threshold);
    const base = {
      productId: product.id,
      productName: product.name,
      slug: product.slug,
      image: product.images[0]?.url ?? null,
      isPublished: product.is_published,
      threshold,
    };
    const variants = product.variants ?? [];

    if (variants.length === 0) {
      const inventory = Number(product.inventory ?? 0);
      if (isOutOfStock(inventory) || isLowStock(inventory, threshold)) {
        alerts.push({
          ...base,
          variantLabel: null,
          inventory,
          state: isOutOfStock(inventory) ? "out" : "low",
        });
      }
      continue;
    }

    for (const variant of variants) {
      if (!isOutOfStock(variant.inventory) && !isLowStock(variant.inventory, threshold)) {
        continue;
      }

      alerts.push({
        ...base,
        variantLabel:
          [variant.color?.name, variant.size?.label].filter(Boolean).join(" / ") || null,
        inventory: variant.inventory,
        state: isOutOfStock(variant.inventory) ? "out" : "low",
      });
    }
  }

  return alerts.sort(
    (a, b) =>
      (a.state === "out" ? 0 : 1) - (b.state === "out" ? 0 : 1) ||
      a.inventory - b.inventory ||
      a.productName.localeCompare(b.productName),
  );
}

async function countPendingReturns(): Promise<number> {
  if (!hasAdminCredentials()) return 0;
  const { count, error } = await createAdminClient()
    .from("return_requests")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");
  return error ? 0 : (count ?? 0);
}

export type DashboardData = {
  ordersToday: number;
  ordersThisMonth: number;
  awaitingFulfillment: number;
  shippedInTransit: number;
  pendingReturns: number;
  recentOrders: Order[];
  bestSellers: BestSeller[];
  stockAlerts: StockAlert[];
  lowStockProducts: number;
  outOfStockProducts: number;
};

export async function getDashboardData(): Promise<DashboardData> {
  await requireAdmin();

  const [orders, products, pendingReturns] = await Promise.all([
    fetchAllOrders(),
    getAllProductsForAdmin(),
    countPendingReturns(),
  ]);

  const todayKey = toStoreDateKey(new Date());
  const monthKey = todayKey.slice(0, 7);
  const stockAlerts = collectStockAlerts(products);
  const outProductIds = new Set(
    products
      .filter((product) => {
        const total = (product.variants ?? []).length
          ? product.variants.reduce((sum, v) => sum + v.inventory, 0)
          : Number(product.inventory ?? 0);
        return total <= 0;
      })
      .map((product) => product.id),
  );
  const lowProductIds = new Set(
    stockAlerts
      .filter((alert) => !outProductIds.has(alert.productId))
      .map((alert) => alert.productId),
  );

  return {
    ordersToday: orders.filter((o) => toStoreDateKey(o.created_at) === todayKey).length,
    ordersThisMonth: orders.filter((o) => toStoreDateKey(o.created_at).startsWith(monthKey))
      .length,
    awaitingFulfillment: orders.filter((o) =>
      ["pending", "processing"].includes(o.status),
    ).length,
    shippedInTransit: orders.filter((o) => o.status === "shipped").length,
    pendingReturns,
    recentOrders: orders.slice(0, 8),
    bestSellers: aggregateBestSellers(orders).slice(0, 10),
    stockAlerts,
    lowStockProducts: lowProductIds.size,
    outOfStockProducts: outProductIds.size,
  };
}

export type RevenueBucket = {
  key: string;
  label: string;
  gross: number;
  orders: number;
  discount: number;
  shipping: number;
  returned: number;
};

export type TopCustomer = {
  key: string;
  name: string;
  email: string;
  isGuest: boolean;
  orders: number;
  totalSpent: number;
  lastOrderAt: string;
};

export type MostSoldItem = BestSeller & {
  allTimeUnits: number;
  trend: number[];
};

export type ReportsData = {
  period: ReportPeriod;
  from: string;
  to: string;
  buckets: RevenueBucket[];
  totals: {
    gross: number;
    net: number;
    orders: number;
    averageOrderValue: number;
    collected: number;
    discount: number;
    returned: number;
    cancelledOrders: number;
    unitsSold: number;
  };
  previousGross: number;
  mostSold: MostSoldItem[];
  topCustomers: TopCustomer[];
  stockAlerts: StockAlert[];
};

function defaultRange(period: ReportPeriod, earliestKey: string | null, todayKey: string) {
  if (period === "day") return { from: addToDateKey(todayKey, "day", -29), to: todayKey };
  if (period === "month") {
    return { from: `${addToDateKey(todayKey, "month", -11).slice(0, 7)}-01`, to: todayKey };
  }
  const firstYear = earliestKey ? earliestKey.slice(0, 4) : todayKey.slice(0, 4);
  return { from: `${firstYear}-01-01`, to: todayKey };
}

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export async function getReportsData(params: {
  period?: string;
  from?: string;
  to?: string;
}): Promise<ReportsData> {
  await requireSuperAdmin();

  const period: ReportPeriod =
    params.period === "month" || params.period === "year" ? params.period : "day";

  const [orders, products] = await Promise.all([
    fetchAllOrders(),
    getAllProductsForAdmin(),
  ]);

  const todayKey = toStoreDateKey(new Date());
  const earliestKey = orders.length
    ? toStoreDateKey(orders[orders.length - 1]!.created_at)
    : null;
  const fallback = defaultRange(period, earliestKey, todayKey);
  let from = params.from && DATE_KEY_PATTERN.test(params.from) ? params.from : fallback.from;
  let to = params.to && DATE_KEY_PATTERN.test(params.to) ? params.to : fallback.to;
  if (from > to) [from, to] = [to, from];

  const bucketKeys = enumerateBuckets(from, to, period);
  const buckets = new Map<string, RevenueBucket>(
    bucketKeys.map((key) => [
      key,
      {
        key,
        label: formatBucketLabel(key, period),
        gross: 0,
        orders: 0,
        discount: 0,
        shipping: 0,
        returned: 0,
      },
    ]),
  );

  const inRange: Order[] = [];
  let previousGross = 0;
  const spanDays =
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000 + 1;
  const previousFrom = addToDateKey(from, "day", -spanDays);

  for (const order of orders) {
    const dateKey = toStoreDateKey(order.created_at);

    if (dateKey >= previousFrom && dateKey < from && isRevenueOrder(order)) {
      previousGross += Number(order.total);
    }

    if (dateKey < from || dateKey > to) continue;
    inRange.push(order);

    if (!isRevenueOrder(order)) continue;
    const bucket = buckets.get(bucketKey(dateKey, period));
    if (!bucket) continue;

    bucket.gross += Number(order.total);
    bucket.orders += 1;
    bucket.discount += Number(order.discount ?? 0);
    bucket.shipping += Number(order.shipping);
    if (order.status === "returned") bucket.returned += Number(order.total);
  }

  const revenueOrders = inRange.filter(isRevenueOrder);
  const gross = revenueOrders.reduce((sum, o) => sum + Number(o.total), 0);
  const returned = revenueOrders
    .filter((o) => o.status === "returned")
    .reduce((sum, o) => sum + Number(o.total), 0);

  const periodSellers = aggregateBestSellers(inRange);
  const allTimeUnits = new Map(
    aggregateBestSellers(orders).map((item) => [item.key, item.units]),
  );

  const mostSold: MostSoldItem[] = periodSellers.slice(0, 20).map((item) => {
    const trend = new Map(bucketKeys.map((key) => [key, 0]));
    for (const order of revenueOrders) {
      const key = bucketKey(toStoreDateKey(order.created_at), period);
      for (const line of order.order_items ?? []) {
        if (productKey(line) === item.key) {
          trend.set(key, (trend.get(key) ?? 0) + line.quantity);
        }
      }
    }
    return {
      ...item,
      allTimeUnits: allTimeUnits.get(item.key) ?? item.units,
      trend: [...trend.values()],
    };
  });

  const customers = new Map<string, TopCustomer>();
  for (const order of revenueOrders) {
    if (order.status === "returned") continue;
    const key = customerKey(order);
    if (!key) continue;

    const entry =
      customers.get(key) ??
      {
        key,
        name: order.customer_name?.trim() || "Customer",
        email: order.customer_email?.trim() || "",
        isGuest: !order.user_id,
        orders: 0,
        totalSpent: 0,
        lastOrderAt: order.created_at,
      };
    entry.orders += 1;
    entry.totalSpent += Number(order.total);
    if (order.created_at > entry.lastOrderAt) entry.lastOrderAt = order.created_at;
    customers.set(key, entry);
  }

  return {
    period,
    from,
    to,
    buckets: [...buckets.values()],
    totals: {
      gross,
      net: gross - returned,
      orders: revenueOrders.length,
      averageOrderValue: revenueOrders.length ? gross / revenueOrders.length : 0,
      collected: revenueOrders
        .filter((o) => o.payment_status === "paid")
        .reduce((sum, o) => sum + Number(o.total), 0),
      discount: revenueOrders.reduce((sum, o) => sum + Number(o.discount ?? 0), 0),
      returned,
      cancelledOrders: inRange.filter((o) => o.status === "cancelled").length,
      unitsSold: periodSellers.reduce((sum, item) => sum + item.units, 0),
    },
    previousGross,
    mostSold,
    topCustomers: [...customers.values()]
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10),
    stockAlerts: collectStockAlerts(products),
  };
}

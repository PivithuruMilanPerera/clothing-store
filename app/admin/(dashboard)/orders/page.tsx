import type { Metadata } from "next";
import {
  OrdersAdmin,
  type OrderStatusFilter,
  type PaymentStatusFilter,
} from "@/components/admin/orders/OrdersAdmin";
import { getAllOrdersForAdmin } from "@/lib/orders";

export const metadata: Metadata = {
  title: "Orders | Admin | VELVORZ",
  description: "View and manage customer orders.",
};

const ORDER_STATUSES: OrderStatusFilter[] = [
  "all",
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
];
const PAYMENT_STATUSES: PaymentStatusFilter[] = ["all", "pending", "paid", "failed"];
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

type OrdersSearchParams = Record<string, string | string[] | undefined>;

function readParam(params: OrdersSearchParams, key: string) {
  const value = params[key];
  return typeof value === "string" ? value : undefined;
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<OrdersSearchParams>;
}) {
  const [orders, params] = await Promise.all([getAllOrdersForAdmin(), searchParams]);
  const status = readParam(params, "status");
  const payment = readParam(params, "payment");
  const from = readParam(params, "from");
  const to = readParam(params, "to");

  return (
    <OrdersAdmin
      orders={orders}
      initialFilters={{
        query: readParam(params, "q") ?? "",
        status: ORDER_STATUSES.find((value) => value === status) ?? "all",
        payment: PAYMENT_STATUSES.find((value) => value === payment) ?? "all",
        from: from && DATE_PATTERN.test(from) ? from : "",
        to: to && DATE_PATTERN.test(to) ? to : "",
        product: readParam(params, "product") ?? "all",
      }}
    />
  );
}

import type { Metadata } from "next";
import { OrdersAdmin } from "@/components/admin/orders/OrdersAdmin";
import { getAllOrdersForAdmin } from "@/lib/orders";

export const metadata: Metadata = {
  title: "Orders | Admin | VELVORZ",
  description: "View and manage customer orders.",
};

export default async function AdminOrdersPage() {
  const orders = await getAllOrdersForAdmin();

  return <OrdersAdmin orders={orders} />;
}

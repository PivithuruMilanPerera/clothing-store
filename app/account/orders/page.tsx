import type { Metadata } from "next";
import { getOrders } from "@/app/account/actions";
import { OrderHistory } from "@/components/account";

export const metadata: Metadata = {
  title: "Order History | VELVORZ",
  description: "View your VELVORZ order history.",
};

export default async function OrdersPage() {
  const orders = await getOrders();

  return (
    <div>
      <h2 className="type-headline-md text-on-surface">Order History</h2>
      <p className="type-body-md mt-2 text-on-surface-variant">
        Track purchases and review order details.
      </p>
      <div className="mt-8">
        <OrderHistory orders={orders} />
      </div>
    </div>
  );
}

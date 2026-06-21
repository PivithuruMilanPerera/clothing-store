import type { Metadata } from "next";
import {
  getEligibleReturnOrders,
  getReturnRequests,
} from "@/app/account/actions";
import { ReturnRequests } from "@/components/account";

export const metadata: Metadata = {
  title: "Return Requests | VELVORZ",
  description: "Submit and track your return requests.",
};

export default async function ReturnsPage() {
  const [requests, eligibleOrders] = await Promise.all([
    getReturnRequests(),
    getEligibleReturnOrders(),
  ]);

  return (
    <div>
      <h2 className="font-headline text-lg font-bold leading-tight md:text-2xl text-on-surface">Return Requests</h2>
      <p className="font-body text-base leading-normal mt-2 text-on-surface-variant">
        Request a return for eligible orders and track existing requests.
      </p>
      <div className="mt-8">
        <ReturnRequests requests={requests} eligibleOrders={eligibleOrders} />
      </div>
    </div>
  );
}

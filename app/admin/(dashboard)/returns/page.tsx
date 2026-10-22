import type { Metadata } from "next";
import { ReturnsAdmin } from "@/components/admin/returns/ReturnsAdmin";
import { getReturnRequestsForAdmin } from "@/lib/returns";

export const metadata: Metadata = {
  title: "Returns | Admin | VELVORZ",
  description: "Review and resolve customer return requests.",
};

export default async function AdminReturnsPage() {
  const requests = await getReturnRequestsForAdmin();

  return <ReturnsAdmin requests={requests} />;
}

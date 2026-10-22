import type { Metadata } from "next";
import { CouponsAdmin } from "@/components/admin/coupons/CouponsAdmin";
import { getCouponsForAdmin } from "@/lib/coupon-admin";

export const metadata: Metadata = {
  title: "Coupons | Admin | VELVORZ",
  description: "Create, deactivate, and monitor coupon codes.",
};

export default async function AdminCouponsPage() {
  const { coupons, tableMissing } = await getCouponsForAdmin();

  return <CouponsAdmin coupons={coupons} tableMissing={tableMissing} />;
}

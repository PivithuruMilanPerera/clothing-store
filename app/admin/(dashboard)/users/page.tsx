import type { Metadata } from "next";
import { UsersAdmin } from "@/components/admin/users/UsersAdmin";
import { getAllUsersForAdmin } from "@/lib/users";

export const metadata: Metadata = {
  title: "Users | Admin | VELVORZ",
  description: "View registered and guest customers.",
};

export default async function AdminUsersPage() {
  const users = await getAllUsersForAdmin();

  return <UsersAdmin users={users} />;
}

import type { Metadata } from "next";
import { CategoriesAdmin } from "@/components/admin/categories/CategoriesAdmin";
import { getCategoryTree } from "@/lib/categories";

export const metadata: Metadata = {
  title: "Categories | Admin | VELVORZ",
  description: "Create main categories and nested sub-categories.",
};

export default async function AdminCategoriesPage() {
  const tree = await getCategoryTree();

  return <CategoriesAdmin categoryTree={tree} />;
}

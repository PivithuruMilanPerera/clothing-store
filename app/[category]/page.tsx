import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getCategoryBySlug } from "@/lib/categories";
import { getShopCategoryHref } from "@/lib/category-tree";

type CategoryPageProps = {
  params: Promise<{ category: string }>;
};

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { category } = await params;
  const dbCategory = await getCategoryBySlug(category);

  if (!dbCategory) {
    return { title: "VELVORZ" };
  }

  return {
    title: `${dbCategory.name} | VELVORZ`,
    description: `Shop ${dbCategory.name.toLowerCase()} products.`,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category } = await params;
  const dbCategory = await getCategoryBySlug(category);

  if (!dbCategory) {
    notFound();
  }

  redirect(getShopCategoryHref(dbCategory.slug));
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShopContent } from "@/components/shop";
import { SiteFooter, SiteHeader } from "@/components/layout";
import { Container } from "@/components/ui";
import type { ProductCategory } from "@/lib/types";

const categoryMeta: Record<
  ProductCategory,
  { title: string; description: string; label: string }
> = {
  men: {
    title: "Men | VELVORZ",
    description: "Shop men's clothing and essentials.",
    label: "Men",
  },
  women: {
    title: "Women | VELVORZ",
    description: "Shop women's clothing and essentials.",
    label: "Women",
  },
  kids: {
    title: "Kids | VELVORZ",
    description: "Shop kids clothing and essentials.",
    label: "Kids",
  },
  accessories: {
    title: "Accessories | VELVORZ",
    description: "Shop accessories.",
    label: "Accessories",
  },
};

const validCategories = ["men", "women", "kids", "accessories"] as const;

export function generateStaticParams() {
  return validCategories.map((category) => ({ category }));
}

type CategoryPageProps = {
  params: Promise<{ category: string }>;
};

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { category } = await params;
  const meta = categoryMeta[category as ProductCategory];

  if (!meta) {
    return { title: "VELVORZ" };
  }

  return {
    title: meta.title,
    description: meta.description,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category } = await params;
  const meta = categoryMeta[category as ProductCategory];

  if (!meta || !validCategories.includes(category as (typeof validCategories)[number])) {
    notFound();
  }

  return (
    <>
      <SiteHeader />
      <main className="bg-background py-10 md:py-14">
        <Container>
          <ShopContent
            title={meta.label}
            defaultCategories={[category as ProductCategory]}
          />
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}

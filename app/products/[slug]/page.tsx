import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetailContent } from "@/components/product";
import { SiteFooter, SiteHeader } from "@/components/layout";
import { Container } from "@/components/ui";
import { getAllProductSlugs, getProductBySlug } from "@/lib/product";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getAllProductSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    return { title: "VELVORZ" };
  }

  return {
    title: `${product.name} | VELVORZ`,
    description: product.description,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return (
    <>
      <SiteHeader />
      <main className="bg-surface-container-lowest py-10 md:py-14">
        <Container>
          <ProductDetailContent product={product} />
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}

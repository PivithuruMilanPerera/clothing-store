import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetailContent } from "@/components/product";
import { Container } from "@/components/ui";
import { getPublishedProductDetail } from "@/lib/products";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getPublishedProductDetail(slug);

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
  const product = await getPublishedProductDetail(slug);

  if (!product) {
    notFound();
  }

  return (
    <main className="bg-surface-container-lowest pt-4 pb-10 md:pt-6 md:pb-14">
      <Container>
        <ProductDetailContent product={product} />
      </Container>
    </main>
  );
}

import { ProductCard } from "@/components/product";
import { Container, SectionHeader } from "@/components/ui";
import { preOrderProducts } from "@/data/landing";
import { getPublishedShopProducts } from "@/lib/products";
import type { Product } from "@/lib/types";

type PreOrderProductsSectionProps = {
  products?: Product[];
};

export async function PreOrderProductsSection({
  products: productsProp,
}: PreOrderProductsSectionProps) {
  const dbProducts = productsProp ?? (await getPublishedShopProducts());
  const preOrderFromDb = dbProducts.filter(
    (product) => product.badge?.toUpperCase() === "PRE ORDER",
  );
  const products =
    preOrderFromDb.length > 0 ? preOrderFromDb.slice(0, 4) : preOrderProducts;

  return (
    <section className="section-py bg-surface-container-lowest">
      <Container>
        <SectionHeader
          title="Coming Soon"
          subtitle="Enjoy up to 25% off"
          action={{ label: "View All", href: "/shop" }}
        />

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
          {products.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              className={index >= 3 ? "md:hidden lg:block" : undefined}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}

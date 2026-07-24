import { ProductCard } from "@/components/product";
import { Container, SectionHeader } from "@/components/ui";
import { newArrivals } from "@/data/landing";
import { getPublishedShopProducts } from "@/lib/products";
import type { Product } from "@/lib/types";

type NewArrivalsSectionProps = {
  products?: Product[];
};

export async function NewArrivalsSection({
  products: productsProp,
}: NewArrivalsSectionProps) {
  const dbProducts = productsProp ?? (await getPublishedShopProducts());
  const products =
    dbProducts.length > 0
      ? dbProducts.slice(0, 4)
      : newArrivals;

  return (
    <section className="section-py bg-surface-container-lowest">
      <Container>
        <SectionHeader
          title="New Arrivals"
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

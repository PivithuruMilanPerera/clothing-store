import { ProductCard } from "@/components/product";
import { Container, SectionHeader } from "@/components/ui";
import { newArrivals } from "@/data/landing";

export function NewArrivalsSection() {
  return (
    <section className="bg-surface-container-lowest py-12 md:py-[var(--section-gap)]">
      <Container>
        <SectionHeader
          title="New Arrivals"
          action={{ label: "View All", href: "/shop" }}
        />

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-6">
          {newArrivals.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </Container>
    </section>
  );
}

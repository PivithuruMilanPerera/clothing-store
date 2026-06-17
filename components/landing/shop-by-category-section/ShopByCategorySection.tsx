import { CategoryCard } from "@/components/category";
import { Container, SectionHeader } from "@/components/ui";
import { categories } from "@/data/landing";

export function ShopByCategorySection() {
  return (
    <section className="bg-surface-container-lowest pb-12 md:pb-[var(--section-gap)]">
      <Container>
        <SectionHeader title="Shop By Category" />

        <div className="grid gap-3 md:grid-cols-3 md:gap-6">
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </Container>
    </section>
  );
}

import { CategoryCard } from "@/components/category";
import { Container, SectionHeader } from "@/components/ui";
import { categories } from "@/data/landing";

export function ShopByCategorySection() {
  return (
    <section className="bg-surface-container-lowest pb-12 md:pb-[var(--section-gap)]">
      <Container>
        <SectionHeader title="Shop By Category" />

        <div className="flex flex-nowrap gap-2 sm:gap-4 md:gap-5">
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              className="min-w-0 flex-1"
            />
          ))}
        </div>
      </Container>
    </section>
  );
}

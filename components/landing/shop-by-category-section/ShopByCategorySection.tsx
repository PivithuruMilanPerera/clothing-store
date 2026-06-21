import { CategoryCard } from "@/components/category";
import { Container, SectionHeader } from "@/components/ui";
import { categories } from "@/data/landing";

export function ShopByCategorySection() {
  return (
    <section className="section-py bg-surface-container-lowest">
      <Container>
        <SectionHeader title="Shop By Category" />

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} className="min-w-0" />
          ))}
        </div>
      </Container>
    </section>
  );
}

import { CategoryCard } from "@/components/category";
import { Container, SectionHeader } from "@/components/ui";
import { getMainCategoriesForDisplay } from "@/lib/categories";
import type { Category } from "@/lib/types";

type ShopByCategorySectionProps = {
  categories?: Category[];
};

export async function ShopByCategorySection({
  categories: categoriesProp,
}: ShopByCategorySectionProps) {
  const dbCategories = categoriesProp ?? (await getMainCategoriesForDisplay());
  const categories = dbCategories;

  if (categories.length === 0) {
    return null;
  }

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

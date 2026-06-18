import type { Metadata } from "next";
import { ShopContent } from "@/components/shop";
import { SiteFooter, SiteHeader } from "@/components/layout";
import { Container } from "@/components/ui";

export const metadata: Metadata = {
  title: "Shop All | VELVORZ",
  description: "Browse the full VELVORZ collection.",
};

export default function ShopPage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-background py-10 md:py-14">
        <Container>
          <ShopContent title="Shop All" />
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}

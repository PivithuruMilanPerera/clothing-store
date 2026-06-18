import type { Metadata } from "next";
import { CartContent } from "@/components/cart";
import { SiteFooter, SiteHeader } from "@/components/layout";
import { Container } from "@/components/ui";

export const metadata: Metadata = {
  title: "Your Bag | VELVORZ",
  description: "Review items in your shopping bag.",
};

export default function CartPage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-surface-container-lowest py-10 md:py-14">
        <Container>
          <CartContent />
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}

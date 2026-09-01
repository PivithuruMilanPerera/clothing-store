import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout";
import { SiteFooter, SiteHeader } from "@/components/layout";
import { Container } from "@/components/ui";

export const metadata: Metadata = {
  title: "Checkout | VELVORZ",
  description: "Complete your VELVORZ order with Cash on Delivery or registered account.",
};

export default function CheckoutPage() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-surface-container-lowest py-8 md:py-12">
        <Container>
          <div className="mb-6">
            <p className="font-label text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant">
              VELVORZ Official Store
            </p>
            <h1 className="font-headline text-2xl font-extrabold uppercase tracking-tight text-on-surface md:text-4xl">
              Checkout
            </h1>
          </div>
          <CheckoutForm />
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}

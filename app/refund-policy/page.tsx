import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/layout";
import { PolicyContent } from "@/components/policies";
import { Container } from "@/components/ui";
import { refundPolicy } from "@/data/policies";

export const metadata: Metadata = {
  title: "Refund Policy | VELVORZ",
  description:
    "How VELVORZ handles returns, exchanges, and refunds for online orders.",
};

export default function RefundPolicyPage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-surface-container-lowest py-10 md:py-14">
        <Container>
          <PolicyContent policy={refundPolicy} currentHref="/refund-policy" />
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}

import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/layout";
import { PolicyContent } from "@/components/policies";
import { Container } from "@/components/ui";
import { termsAndConditions } from "@/data/policies";

export const metadata: Metadata = {
  title: "Terms & Conditions | VELVORZ",
  description:
    "The terms and conditions that govern your use of the VELVORZ website and purchases.",
};

export default function TermsPage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-surface-container-lowest py-10 md:py-14">
        <Container>
          <PolicyContent policy={termsAndConditions} currentHref="/terms" />
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}

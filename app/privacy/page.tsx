import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/layout";
import { PolicyContent } from "@/components/policies";
import { Container } from "@/components/ui";
import { privacyPolicy } from "@/data/policies";

export const metadata: Metadata = {
  title: "Privacy Policy | VELVORZ",
  description:
    "How VELVORZ collects, uses, and protects your personal information.",
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-surface-container-lowest py-10 md:py-14">
        <Container>
          <PolicyContent policy={privacyPolicy} currentHref="/privacy" />
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}

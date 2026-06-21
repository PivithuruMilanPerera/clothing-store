import type { Metadata } from "next";
import { AboutContent } from "@/components/about";
import { SiteFooter, SiteHeader } from "@/components/layout";
import { Container } from "@/components/ui";

export const metadata: Metadata = {
  title: "About Us | VELVORZ",
  description:
    "Learn about VELVORZ — refined essentials, honest materials, and clothing designed to last.",
};

export default function AboutPage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-surface-container-lowest py-10 md:py-14">
        <Container>
          <AboutContent />
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}

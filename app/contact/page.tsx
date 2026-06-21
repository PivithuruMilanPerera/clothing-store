import type { Metadata } from "next";
import { ContactContent } from "@/components/contact";
import { SiteFooter, SiteHeader } from "@/components/layout";
import { Container } from "@/components/ui";

export const metadata: Metadata = {
  title: "Contact | VELVORZ",
  description: "Get in touch with the VELVORZ customer care team.",
};

export default function ContactPage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-surface-container-lowest py-10 md:py-14">
        <Container>
          <ContactContent />
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}

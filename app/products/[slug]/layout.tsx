import { Suspense, type ReactNode } from "react";
import { SiteFooter, SiteHeader } from "@/components/layout";
import { Container } from "@/components/ui";

function HeaderFallback() {
  return (
    <header className="bg-surface-container-lowest">
      <Container className="h-16 md:h-20">{null}</Container>
    </header>
  );
}

export default function ProductLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Suspense fallback={<HeaderFallback />}>
        <SiteHeader />
      </Suspense>
      {children}
      <SiteFooter />
    </>
  );
}

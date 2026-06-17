import {
  HeroSection,
  NewArrivalsSection,
  ShopByCategorySection,
} from "@/components/landing";
import { SiteFooter, SiteHeader } from "@/components/layout";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <HeroSection />

      <main>
        <NewArrivalsSection />
        <ShopByCategorySection />
      </main>

      <SiteFooter />
    </>
  );
}

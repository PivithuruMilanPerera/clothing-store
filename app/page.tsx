import {
  CodBannerSection,
  HeroSection,
  LogoCarouselSection,
  NewArrivalsSection,
  PreOrderProductsSection,
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
        <CodBannerSection />
        <ShopByCategorySection />
        <LogoCarouselSection />
        <PreOrderProductsSection />
      </main>

      <SiteFooter />
    </>
  );
}

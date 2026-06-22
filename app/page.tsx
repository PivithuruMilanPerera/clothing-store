import {
  CodBannerSection,
  HeroSection,
  LogoCarouselSection,
  NewArrivalsSection,
  PreOrderProductsSection,
  ShopByCategorySection,
} from "@/components/landing";
import { SiteFooter, SiteHeader } from "@/components/layout";
import { getLandingContent } from "@/lib/landing-content";

export default async function Home() {
  const { heroSlides, brandLogos } = await getLandingContent();

  return (
    <>
      <SiteHeader />
      <HeroSection slides={heroSlides} />

      <main>
     
        <NewArrivalsSection />
        <CodBannerSection />
        <ShopByCategorySection />
        <LogoCarouselSection logos={brandLogos} />
        <PreOrderProductsSection />
      </main>

      <SiteFooter />
    </>
  );
}

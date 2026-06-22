import Image from "next/image";
import type { BrandLogo } from "@/lib/types";

type LogoCarouselSectionProps = {
  logos: BrandLogo[];
};

export function LogoCarouselSection({ logos }: LogoCarouselSectionProps) {
  const marqueeLogos = [...logos, ...logos];

  return (
    <section
      className="section-py overflow-hidden bg-surface-container-lowest"
      aria-label="Featured brands"
    >
      <div className="logo-carousel">
        <div className="logo-carousel-track flex w-max items-center gap-10 md:gap-14">
          {marqueeLogos.map((brand, index) => (
            <div key={`${brand.id}-${index}`} className="shrink-0">
              <Image
                src={brand.image}
                alt={brand.name}
                width={160}
                height={100}
                className="h-14 w-24 object-contain opacity-70 transition duration-300 hover:opacity-100 md:h-16 md:w-28"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

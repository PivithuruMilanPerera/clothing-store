import Image from "next/image";
import type { BrandLogo } from "@/lib/types";

type LogoCarouselSectionProps = {
  logos: BrandLogo[];
};

function LogoGroup({
  logos,
  groupId,
  ariaHidden = false,
}: {
  logos: BrandLogo[];
  groupId: string;
  ariaHidden?: boolean;
}) {
  return (
    <div
      className="logo-carousel-group flex shrink-0 items-center gap-10 md:gap-14"
      aria-hidden={ariaHidden || undefined}
    >
      {logos.map((brand, index) => (
        <div key={`${groupId}-${brand.id}-${index}`} className="shrink-0">
          <Image
            src={brand.image}
            alt={ariaHidden ? "" : brand.name}
            width={160}
            height={100}
            className="h-14 w-24 object-contain opacity-70 transition duration-300 hover:opacity-100 md:h-16 md:w-28"
          />
        </div>
      ))}
    </div>
  );
}

export function LogoCarouselSection({ logos }: LogoCarouselSectionProps) {
  if (logos.length === 0) {
    return null;
  }

  // Repeat logos within each group so the track always fills wide viewports.
  const groupLogos = Array.from(
    { length: Math.max(2, Math.ceil(12 / logos.length)) },
    () => logos,
  ).flat();

  return (
    <section
      className="section-py overflow-hidden bg-surface-container-lowest"
      aria-label="Featured brands"
    >
      <div className="logo-carousel">
        <div className="logo-carousel-track flex w-max">
          <LogoGroup logos={groupLogos} groupId="a" />
          <LogoGroup logos={groupLogos} groupId="b" ariaHidden />
        </div>
      </div>
    </section>
  );
}

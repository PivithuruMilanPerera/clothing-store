import Image from "next/image";
import Link from "next/link";
import { ShopByCategorySection } from "@/components/landing";
import { Button } from "@/components/ui";
import {
  aboutCraft,
  aboutHeroImage,
  aboutIntro,
  aboutMilestones,
  aboutStory,
  aboutStoryImage,
  aboutValues,
} from "@/data/about";

export function AboutContent() {
  return (
    <div className="space-y-16 md:space-y-24">
      <section className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-surface-container-low sm:aspect-[16/9] md:aspect-[21/9] -mt-5 sm:-mt-10">
        <Image
          src={aboutHeroImage.src}
          alt={aboutHeroImage.alt}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 100rem"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-linear-to-t from-primary/80 via-primary/30 to-primary/10" />

        <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10">
          <p className="font-label text-xs font-bold uppercase tracking-[0.15em] leading-none text-on-primary/80">
            {aboutIntro.title}
          </p>
          <h1 className="font-headline text-[2rem] font-extrabold leading-tight uppercase md:text-[clamp(2rem,6vw,5rem)] md:font-black md:leading-none md:tracking-tighter mt-3 max-w-2xl text-balance text-on-primary">
            {aboutIntro.tagline}
          </h1>
          <p className="font-body text-base leading-normal mt-4 max-w-xl text-on-primary/90">
            {aboutIntro.description}
          </p>
        </div>
      </section>

     

      <section>
        <p className="font-label text-xs font-bold uppercase tracking-[0.15em] leading-none text-on-surface-variant">
          The Collection
        </p>
        <h2 className="font-headline text-lg font-bold leading-tight md:text-2xl mt-2 text-on-surface">
          What We Stand For
        </h2>
        <ul className="mt-8 grid gap-6 md:grid-cols-3">
          {aboutValues.map((value) => (
            <li
              key={value.title}
              className="border border-outline-variant bg-surface-container-lowest p-6"
            >
              <h3 className="font-label text-xs font-bold uppercase tracking-[0.15em] leading-none text-on-surface">
                {value.title}
              </h3>
              <p className="font-body text-base leading-normal mt-4 text-on-surface-variant">
                {value.description}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <ShopByCategorySection />

   

      <section className="grid gap-6 rounded-2xl border border-outline-variant bg-surface-container-low p-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:gap-12 md:p-10">
        <div className="max-w-2xl">
          <h2 className="font-headline text-lg font-bold leading-tight md:text-2xl text-on-surface">
            {aboutCraft.title}
          </h2>
          <p className="font-body text-base leading-normal mt-4 text-on-surface-variant">
            {aboutCraft.description}
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          <Button href="/shop">Shop Collection</Button>
          <Link
            href="/contact"
            className="font-label text-xs font-bold uppercase tracking-[0.15em] leading-none inline-flex items-center justify-center border border-primary px-6 py-3 text-primary hover:bg-primary hover:text-on-primary"
          >
            Contact Us
          </Link>
        </div>
      </section>
    </div>
  );
}

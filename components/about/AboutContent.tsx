import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui";
import {
  aboutCraft,
  aboutGalleryImages,
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
      <section className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-surface-container-low sm:aspect-[16/9] md:aspect-[21/9]">
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
          <p className="type-label-uppercase text-on-primary/80">
            {aboutIntro.title}
          </p>
          <h1 className="type-headline-lg-mobile md:type-display-xl mt-3 max-w-2xl text-balance text-on-primary">
            {aboutIntro.tagline}
          </h1>
          <p className="type-body-md mt-4 max-w-xl text-on-primary/90">
            {aboutIntro.description}
          </p>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-16">
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-surface-container-low lg:aspect-[3/4]">
          <Image
            src={aboutStoryImage.src}
            alt={aboutStoryImage.alt}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover object-center"
          />
        </div>

        <div>
          <h2 className="type-headline-md text-on-surface">{aboutStory.title}</h2>
          <div className="mt-6 space-y-5">
            {aboutStory.paragraphs.map((paragraph) => (
              <p
                key={paragraph}
                className="type-body-md text-on-surface-variant"
              >
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </section>

      <section>
        <p className="type-label-uppercase text-on-surface-variant">
          The Collection
        </p>
        <h2 className="type-headline-md mt-2 text-on-surface">
          What We Stand For
        </h2>
        <ul className="mt-8 grid gap-6 md:grid-cols-3">
          {aboutValues.map((value) => (
            <li
              key={value.title}
              className="border border-outline-variant bg-surface-container-lowest p-6"
            >
              <h3 className="type-label-uppercase text-on-surface">
                {value.title}
              </h3>
              <p className="type-body-md mt-4 text-on-surface-variant">
                {value.description}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <p className="type-label-uppercase text-on-surface-variant">
          Inside VELVORZ
        </p>
        <h2 className="type-headline-md mt-2 text-on-surface">
          Pieces From the Shop
        </h2>
        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
          {aboutGalleryImages.map((image) => (
            <div
              key={image.src}
              className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-surface-container-low"
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover object-center transition-transform duration-700 ease-out hover:scale-[1.03]"
              />
            </div>
          ))}
        </div>
      </section>

      <section className="border border-outline-variant bg-surface-container-low p-6 md:p-10">
        <h2 className="type-headline-md text-on-surface">Our Journey</h2>
        <ol className="mt-8 divide-y divide-outline-variant">
          {aboutMilestones.map((milestone) => (
            <li
              key={milestone.year}
              className="grid gap-4 py-6 first:pt-0 last:pb-0 md:grid-cols-[6rem_minmax(0,1fr)] md:gap-8"
            >
              <p className="type-label-uppercase text-on-surface-variant">
                {milestone.year}
              </p>
              <div>
                <h3 className="type-headline-md text-base text-on-surface">
                  {milestone.title}
                </h3>
                <p className="type-body-md mt-2 text-on-surface-variant">
                  {milestone.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="grid gap-6 rounded-2xl border border-outline-variant bg-surface-container-low p-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:gap-12 md:p-10">
        <div className="max-w-2xl">
          <h2 className="type-headline-md text-on-surface">
            {aboutCraft.title}
          </h2>
          <p className="type-body-md mt-4 text-on-surface-variant">
            {aboutCraft.description}
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          <Button href="/shop">Shop Collection</Button>
          <Link
            href="/contact"
            className="type-label-uppercase inline-flex items-center justify-center border border-primary px-6 py-3 text-primary hover:bg-primary hover:text-on-primary"
          >
            Contact Us
          </Link>
        </div>
      </section>
    </div>
  );
}

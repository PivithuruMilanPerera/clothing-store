"use client";

import Image from "next/image";
import { useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import { Button, IconButton } from "@/components/ui";
import { heroSlides } from "@/data/landing";
import { cn } from "@/lib/utils";

export function HeroSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const slideCount = heroSlides.length;
  const heroHeightClass = "min-h-[64svh] md:min-h-[74svh]";
  const activeSlide = heroSlides[activeIndex];
  const prevSlide = heroSlides[(activeIndex - 1 + slideCount) % slideCount];
  const nextSlide = heroSlides[(activeIndex + 1) % slideCount];

  const goTo = (index: number) => {
    setActiveIndex((index + slideCount) % slideCount);
  };

  return (
    <section className="w-full bg-surface-container-lowest pt-4 md:pt-6">
      <div className="w-full">
        <div
          className={cn(
            "grid grid-cols-[5%_90%_5%] items-stretch gap-3 md:grid-cols-[5%_90%_5%] md:gap-4",
            heroHeightClass,
          )}
        >
          <article className="relative overflow-hidden rounded-r-2xl">
            <Image
              src={prevSlide.image}
              alt=""
              fill
              sizes="(max-width: 768px) 30vw, 22vw"
              className="object-cover object-center opacity-90"
            />
            <div className="absolute inset-0 bg-black/25" />
          </article>

          <article className="relative overflow-hidden rounded-2xl">
            <Image
              src={activeSlide.image}
              alt=""
              fill
              loading="eager"
              sizes="(max-width: 768px) 70vw, 56vw"
              className="object-cover object-center transition-all duration-500"
            />
            <div className="absolute inset-0 bg-primary/25" />

            <div className="relative flex h-full flex-col justify-end p-5 md:p-8">
              <p className="type-label-uppercase mb-3 text-on-primary/80 md:mb-4">
                New Collection
              </p>
              <h1 className="type-display-xl max-w-xs text-on-primary sm:max-w-lg md:max-w-3xl">
                {activeSlide.headline}
              </h1>
              <div className="mt-5 md:mt-7">
                <Button variant="inverted" href={activeSlide.cta.href}>
                  {activeSlide.cta.label}
                </Button>
              </div>
            </div>
          </article>

          <article className="relative overflow-hidden rounded-2xl">
            <Image
              src={nextSlide.image}
              alt=""
              fill
              sizes="(max-width: 768px) 30vw, 22vw"
              className="object-cover object-center opacity-90"
            />
            <div className="absolute inset-0 bg-black/25" />
          </article>
        </div>

        <div className="relative mt-5 flex items-center justify-end pb-6 md:mt-6 md:pb-8">
          <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-2">
            {heroSlides.map((item, index) => (
              <button
                key={item.id}
                type="button"
                aria-label={`Go to slide ${index + 1}`}
                onClick={() => setActiveIndex(index)}
                className={cn(
                  "h-0.5 transition-[width] duration-300 ease-out",
                  index === activeIndex
                    ? "w-8 bg-on-surface"
                    : "w-4 bg-outline/60 hover:bg-outline",
                )}
              />
            ))}
          </div>

          {slideCount > 1 ? (
            <div className="flex gap-2">
              <IconButton
                label="Previous slide"
                variant="light"
                onClick={() => goTo(activeIndex - 1)}
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </IconButton>
              <IconButton
                label="Next slide"
                variant="light"
                onClick={() => goTo(activeIndex + 1)}
              >
                <ChevronRightIcon className="h-4 w-4" />
              </IconButton>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

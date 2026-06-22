"use client";

import Image from "next/image";
import { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { A11y, Autoplay, Pagination } from "swiper/modules";
import type { Swiper as SwiperInstance } from "swiper";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import { Button, IconButton } from "@/components/ui";
import type { HeroSlide } from "@/lib/types";
import { cn } from "@/lib/utils";
import "swiper/css";

const HERO_SLIDE_DURATION_MS = 6000;

type HeroSectionProps = {
  slides: HeroSlide[];
};

export function HeroSection({ slides }: HeroSectionProps) {
  const [swiper, setSwiper] = useState<SwiperInstance | null>(null);
  const heroHeightClass = "h-[68svh] md:h-[78svh]";
  const hasMultipleSlides = slides.length > 1;
  return (
    <section
      className="w-full bg-surface-container-lowest pt-4"
      style={
        {
          "--hero-slide-duration": `${HERO_SLIDE_DURATION_MS}ms`,
        } as React.CSSProperties
      }
    >
      <div className="w-full">
        <div className={heroHeightClass}>
          <Swiper
            modules={[A11y, Autoplay, Pagination]}
            loop={hasMultipleSlides}
            speed={900}
            centeredSlides={hasMultipleSlides}
            slidesPerView={hasMultipleSlides ? 1.12 : 1}
            spaceBetween={12}
            autoHeight={false}
            watchSlidesProgress
            onSwiper={setSwiper}
            className="hero-swiper h-full"
            breakpoints={
              hasMultipleSlides
                ? {
                    768: {
                      slidesPerView: 1.15,
                      spaceBetween: 16,
                    },
                  }
                : undefined
            }
            autoplay={
              hasMultipleSlides
                ? {
                    delay: HERO_SLIDE_DURATION_MS,
                    disableOnInteraction: false,
                    pauseOnMouseEnter: true,
                  }
                : false
            }
            pagination={
              hasMultipleSlides
                ? {
                    el: ".hero-swiper-pagination",
                    clickable: true,
                    bulletClass: "hero-swiper-cutoff",
                    bulletActiveClass: "hero-swiper-cutoff-active",
                    renderBullet: (index, className) =>
                      `<button type="button" class="${className}" aria-label="Go to slide ${index + 1}"></button>`,
                  }
                : false
            }
          >
            {slides.map((slide, index) => (              <SwiperSlide key={slide.id} className="!h-full">
                <article className="hero-slide-card relative h-full overflow-hidden rounded-2xl">
                  <Image
                    src={slide.image}
                    alt={slide.headline}
                    fill
                    loading={index === 0 ? "eager" : "lazy"}
                    sizes="(max-width: 768px) 85vw, 56vw"
                    className={cn(
                      "hero-slide-image object-cover object-center will-change-transform",
                      index % 2 === 0
                        ? "hero-slide-image--in"
                        : "hero-slide-image--out",
                    )}
                    priority={index === 0}
                  />
                  <div className="hero-slide-overlay absolute inset-0 bg-primary/25" />

                  <div className="hero-slide-content relative flex h-full flex-col items-start justify-end p-5 md:p-8">
                    <p className="font-label text-xs font-bold uppercase tracking-[0.15em] leading-none mb-2 text-on-primary/80 md:mb-3">
                      New Collection
                    </p>
                    <h1 className="font-headline text-[clamp(2rem,6vw,5rem)] font-black leading-none tracking-tighter uppercase max-w-[11rem] text-balance text-on-primary sm:max-w-[13rem] md:max-w-[16rem]">
                      {slide.headline}
                    </h1>
                    <div className="mt-4 md:mt-5">
                      <Button variant="inverted" href={slide.cta.href}>
                        {slide.cta.label}
                      </Button>
                    </div>
                  </div>
                </article>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {hasMultipleSlides ? (
          <div className="relative mt-1 flex min-h-8 items-center justify-center pb-0 md:mt-2 md:pb-1">
            <div
              className="hero-swiper-pagination"
              aria-label="Hero slide pagination"
            />

            <div className="absolute right-0 flex gap-2">
              <IconButton
                label="Previous slide"
                variant="light"
                onClick={() => swiper?.slidePrev()}
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </IconButton>
              <IconButton
                label="Next slide"
                variant="light"
                onClick={() => swiper?.slideNext()}
              >
                <ChevronRightIcon className="h-4 w-4" />
              </IconButton>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

"use client";

import Image from "next/image";
import { useActionState, useEffect, useRef } from "react";
import {
  saveBannerLogoContent,
  uploadLandingImage,
  type BannerLogoActionState,
} from "@/app/admin/(dashboard)/banner-logo/actions";
import { Button, Input } from "@/components/ui";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import {
  addBrandLogo,
  addHeroSlide,
  clearSaveResult,
  initializeContent,
  removeBrandLogo,
  removeHeroSlide,
  setActiveTab,
  setSaveResult,
  setSaving,
  updateBrandLogo,
  updateHeroSlide,
} from "@/lib/store/slices/bannerLogoSlice";
import type { LandingContent } from "@/lib/types";
import { cn } from "@/lib/utils";

type BannerLogoAdminProps = {
  initialContent: LandingContent;
};

type ImageUploadFieldProps = {
  label: string;
  imageUrl: string;
  onUploaded: (url: string) => void;
};

function ImageUploadField({ label, imageUrl, onUploaded }: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadState, uploadAction, isUploading] = useActionState<
    BannerLogoActionState | null,
    FormData
  >(uploadLandingImage, null);

  useEffect(() => {
    if (uploadState?.imageUrl) {
      onUploaded(uploadState.imageUrl);
    }
  }, [onUploaded, uploadState?.imageUrl]);

  return (
    <div className="flex flex-col gap-3">
      <p className="font-label text-xs font-bold uppercase tracking-[0.15em] leading-none text-on-surface">
        {label}
      </p>

      <div className="relative h-36 w-full overflow-hidden rounded-lg border border-outline-variant bg-surface-container-low">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 320px"
          />
        ) : (
          <div className="flex h-full items-center justify-center font-body text-sm text-on-surface-variant">
            No image selected
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) return;

          const formData = new FormData();
          formData.set("file", file);
          uploadAction(formData);
          event.target.value = "";
        }}
      />

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={isUploading}
          onClick={() => inputRef.current?.click()}
        >
          {isUploading ? "Uploading..." : "Upload Image"}
        </Button>
      </div>

      {uploadState?.error ? (
        <p className="font-body text-sm text-error">{uploadState.error}</p>
      ) : null}
    </div>
  );
}

export function BannerLogoAdmin({ initialContent }: BannerLogoAdminProps) {
  const dispatch = useAppDispatch();
  const {
    heroSlides,
    brandLogos,
    activeTab,
    isSaving,
    saveMessage,
    saveError,
  } = useAppSelector((state) => state.bannerLogo);

  useEffect(() => {
    dispatch(initializeContent(initialContent));
  }, [dispatch, initialContent]);

  async function handleSave() {
    dispatch(clearSaveResult());
    dispatch(setSaving(true));

    const result = await saveBannerLogoContent({ heroSlides, brandLogos });

    dispatch(
      setSaveResult({
        success: result.success,
        error: result.error,
      }),
    );
    dispatch(setSaving(false));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-outline-variant pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="font-headline text-lg font-bold leading-tight md:text-2xl text-on-surface">
            Banner & Logo
          </h2>
          <p className="font-body text-base leading-normal mt-2 text-on-surface-variant">
            Manage hero banners and brand logos shown on the homepage.
          </p>
        </div>

        <Button type="button" disabled={isSaving} onClick={handleSave}>
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {saveMessage ? (
        <p className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 font-body text-sm text-on-surface">
          {saveMessage}
        </p>
      ) : null}

      {saveError ? (
        <p className="rounded-lg border border-error/30 bg-error/5 px-4 py-3 font-body text-sm text-error">
          {saveError}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => dispatch(setActiveTab("banners"))}
          className={cn(
            "font-label text-xs font-bold uppercase tracking-[0.15em] leading-none border px-4 py-2",
            activeTab === "banners"
              ? "border-primary bg-primary text-on-primary"
              : "border-outline-variant text-on-surface-variant",
          )}
        >
          Hero Banners ({heroSlides.length})
        </button>
        <button
          type="button"
          onClick={() => dispatch(setActiveTab("logos"))}
          className={cn(
            "font-label text-xs font-bold uppercase tracking-[0.15em] leading-none border px-4 py-2",
            activeTab === "logos"
              ? "border-primary bg-primary text-on-primary"
              : "border-outline-variant text-on-surface-variant",
          )}
        >
          Brand Logos ({brandLogos.length})
        </button>
      </div>

      {activeTab === "banners" ? (
        <div className="space-y-6">
          <div className="flex justify-end">
            <Button type="button" variant="ghost" onClick={() => dispatch(addHeroSlide())}>
              Add Banner
            </Button>
          </div>

          {heroSlides.map((slide, index) => (
            <article
              key={slide.id}
              className="rounded-lg border border-outline-variant bg-surface-container-lowest p-5 md:p-6"
            >
              <div className="mb-4 flex items-center justify-between gap-4">
                <h3 className="font-headline text-base font-bold uppercase text-on-surface">
                  Banner {index + 1}
                </h3>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => dispatch(removeHeroSlide(slide.id))}
                >
                  Remove
                </Button>
              </div>

              <div className="grid gap-6 md:grid-cols-[240px_1fr]">
                <ImageUploadField
                  label="Banner Image"
                  imageUrl={slide.image}
                  onUploaded={(url) =>
                    dispatch(updateHeroSlide({ id: slide.id, changes: { image: url } }))
                  }
                />

                <div className="grid gap-4">
                  <Input
                    label="Headline"
                    value={slide.headline}
                    onChange={(event) =>
                      dispatch(
                        updateHeroSlide({
                          id: slide.id,
                          changes: { headline: event.target.value },
                        }),
                      )
                    }
                  />
                  <Input
                    label="CTA Label"
                    value={slide.cta.label}
                    onChange={(event) =>
                      dispatch(
                        updateHeroSlide({
                          id: slide.id,
                          changes: { cta: { label: event.target.value } },
                        }),
                      )
                    }
                  />
                  <Input
                    label="CTA Link"
                    value={slide.cta.href}
                    onChange={(event) =>
                      dispatch(
                        updateHeroSlide({
                          id: slide.id,
                          changes: { cta: { href: event.target.value } },
                        }),
                      )
                    }
                  />
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-end">
            <Button type="button" variant="ghost" onClick={() => dispatch(addBrandLogo())}>
              Add Logo
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {brandLogos.map((logo, index) => (
              <article
                key={logo.id}
                className="rounded-lg border border-outline-variant bg-surface-container-lowest p-5"
              >
                <div className="mb-4 flex items-center justify-between gap-4">
                  <h3 className="font-headline text-base font-bold uppercase text-on-surface">
                    Logo {index + 1}
                  </h3>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => dispatch(removeBrandLogo(logo.id))}
                  >
                    Remove
                  </Button>
                </div>

                <div className="grid gap-4">
                  <Input
                    label="Brand Name"
                    value={logo.name}
                    onChange={(event) =>
                      dispatch(
                        updateBrandLogo({
                          id: logo.id,
                          changes: { name: event.target.value },
                        }),
                      )
                    }
                  />
                  <ImageUploadField
                    label="Logo Image"
                    imageUrl={logo.image}
                    onUploaded={(url) =>
                      dispatch(updateBrandLogo({ id: logo.id, changes: { image: url } }))
                    }
                  />
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

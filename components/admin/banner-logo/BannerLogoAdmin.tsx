"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { saveBannerLogoContent } from "@/app/admin/(dashboard)/banner-logo/actions";
import { Button, Input, Popup } from "@/components/ui";
import { useLandingImageUploader } from "@/hooks/useLandingImageUploader";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import {
  addBrandLogo,
  addHeroSlide,
  clearSaveResult,
  initializeContent,
  removeBrandLogo,
  removeHeroSlide,
  setActiveTab,
  setEditingBrandLogo,
  setEditingHeroSlide,
  setSaveResult,
  setSaving,
  updateBrandLogo,
  updateHeroSlide,
} from "@/lib/store/slices/bannerLogoSlice";
import type { BrandLogo, HeroSlide, LandingContent } from "@/lib/types";
import { cn } from "@/lib/utils";

type BannerLogoAdminProps = {
  initialContent: LandingContent;
};

type ImageUploadFieldProps = {
  label: string;
  imageUrl: string;
  required?: boolean;
  variant?: "desktop" | "mobile";
  onUploaded: (url: string) => void;
};

function ImageUploadField({
  label,
  imageUrl,
  required = false,
  variant = "desktop",
  onUploaded,
}: ImageUploadFieldProps) {
  const { inputRef, uploadError, isUploading, onFileChange, openFilePicker } =
    useLandingImageUploader({ onUploaded });

  return (
    <div className="flex flex-col gap-3">
      <p className="font-label text-xs font-bold uppercase tracking-[0.15em] leading-none text-on-surface">
        {label}
        {required ? <span className="text-error"> *</span> : null}
      </p>

      <div
        className={cn(
          "relative w-full overflow-hidden rounded-lg border border-outline-variant bg-surface-container-low",
          variant === "mobile" ? "mx-auto aspect-[9/16] max-w-[180px]" : "h-36",
        )}
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt=""
            fill
            className={cn("object-cover", isUploading && "opacity-40")}
            sizes="(max-width: 768px) 100vw, 320px"
          />
        ) : (
          <div
            className={cn(
              "flex h-full items-center justify-center font-body text-sm text-on-surface-variant",
              isUploading && "opacity-40",
            )}
          >
            No image selected
          </div>
        )}

        {isUploading ? (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-surface-container-lowest/70"
            role="status"
            aria-live="polite"
            aria-label="Uploading image"
          >
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-outline-variant border-t-primary" />
            <span className="font-label text-[10px] font-bold uppercase tracking-[0.15em] leading-none text-on-surface">
              Uploading...
            </span>
          </div>
        ) : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={onFileChange}
      />

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={isUploading}
          onClick={openFilePicker}
        >
          {isUploading ? "Uploading..." : "Upload Image"}
        </Button>
      </div>

      {uploadError ? (
        <p className="font-body text-sm text-error">{uploadError}</p>
      ) : null}
    </div>
  );
}

type BannerPreviewProps = {
  slide: HeroSlide;
  index: number;
  onEdit: () => void;
  onRemove: () => void;
};

function BannerPreview({ slide, index, onEdit, onRemove }: BannerPreviewProps) {
  return (
    <article className="rounded-lg border border-outline-variant bg-surface-container-lowest p-5 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-4 md:flex-row">
          <div className="flex shrink-0 gap-2">
            <div className="space-y-1">
              <p className="font-label text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">
                Desktop
              </p>
              <div className="relative h-20 w-28 overflow-hidden rounded-lg border border-outline-variant bg-surface-container-low">
                {slide.image ? (
                  <Image
                    src={slide.image}
                    alt={slide.headline ?? `Banner ${index + 1} desktop`}
                    fill
                    className="object-cover"
                    sizes="112px"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center px-2 text-center font-body text-xs text-on-surface-variant">
                    No image
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <p className="font-label text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">
                Mobile
              </p>
              <div className="relative h-20 w-16 overflow-hidden rounded-lg border border-outline-variant bg-surface-container-low">
                {slide.mobileImage ? (
                  <Image
                    src={slide.mobileImage}
                    alt={slide.headline ?? `Banner ${index + 1} mobile`}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center px-2 text-center font-body text-xs text-on-surface-variant">
                    No image
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="min-w-0 space-y-1">
            <p className="font-label text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant">
              Banner {index + 1}
            </p>
            {slide.keyTag ? (
              <p className="font-label text-xs font-bold uppercase tracking-[0.15em] text-primary">
                {slide.keyTag}
              </p>
            ) : null}
            <p className="font-headline text-base font-bold uppercase text-on-surface">
              {slide.headline || "No headline"}
            </p>
            {slide.cta?.label || slide.cta?.href ? (
              <p className="font-body text-sm text-on-surface-variant">
                CTA: {slide.cta?.label || "—"} → {slide.cta?.href || "—"}
              </p>
            ) : (
              <p className="font-body text-sm text-on-surface-variant">
                No CTA
              </p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 gap-2">
          <Button type="button" variant="ghost" onClick={onEdit}>
            Edit
          </Button>
          <Button type="button" variant="ghost" onClick={onRemove}>
            Remove
          </Button>
        </div>
      </div>
    </article>
  );
}

type BannerEditFormProps = {
  slide: HeroSlide;
};

function BannerEditForm({ slide }: BannerEditFormProps) {
  const dispatch = useAppDispatch();

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <ImageUploadField
          label="Desktop Banner Image"
          imageUrl={slide.image}
          required
          onUploaded={(url) =>
            dispatch(updateHeroSlide({ id: slide.id, changes: { image: url } }))
          }
        />
        <ImageUploadField
          label="Mobile Banner Image"
          imageUrl={slide.mobileImage}
          required
          variant="mobile"
          onUploaded={(url) =>
            dispatch(
              updateHeroSlide({ id: slide.id, changes: { mobileImage: url } }),
            )
          }
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label="Key Tag (optional)"
          placeholder="e.g. New"
          value={slide.keyTag ?? ""}
          onChange={(event) =>
            dispatch(
              updateHeroSlide({
                id: slide.id,
                changes: { keyTag: event.target.value },
              }),
            )
          }
        />
        <Input
          label="Headline (optional)"
          placeholder="e.g. Uncompromising Precision."
          value={slide.headline ?? ""}
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
          label="CTA (optional)"
          placeholder="e.g. Shop Now"
          value={slide.cta?.label ?? ""}
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
          label="CTA Link (optional)"
          placeholder="e.g. /shop"
          value={slide.cta?.href ?? ""}
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
  );
}

type LogoPreviewProps = {
  logo: BrandLogo;
  index: number;
  onEdit: () => void;
  onRemove: () => void;
};

function LogoPreview({ logo, index, onEdit, onRemove }: LogoPreviewProps) {
  return (
    <article className="rounded-lg border border-outline-variant bg-surface-container-lowest p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border border-outline-variant bg-surface-container-low">
            {logo.image ? (
              <Image
                src={logo.image}
                alt={logo.name || `Logo ${index + 1}`}
                fill
                className="object-contain p-2"
                sizes="96px"
              />
            ) : (
              <div className="flex h-full items-center justify-center px-2 text-center font-body text-xs text-on-surface-variant">
                No image
              </div>
            )}
          </div>

          <div className="min-w-0">
            <p className="font-label text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant">
              Logo {index + 1}
            </p>
            <p className="font-headline text-base font-bold uppercase text-on-surface">
              {logo.name || "No brand name"}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 gap-2">
          <Button type="button" variant="ghost" onClick={onEdit}>
            Edit
          </Button>
          <Button type="button" variant="ghost" onClick={onRemove}>
            Remove
          </Button>
        </div>
      </div>
    </article>
  );
}

type LogoEditFormProps = {
  logo: BrandLogo;
};

function LogoEditForm({ logo }: LogoEditFormProps) {
  const dispatch = useAppDispatch();

  return (
    <div className="space-y-4">
      <Input
        label="Brand Name"
        placeholder="e.g. Nike"
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
        required
        onUploaded={(url) =>
          dispatch(updateBrandLogo({ id: logo.id, changes: { image: url } }))
        }
      />
    </div>
  );
}

function isEmptyHeroSlide(slide: HeroSlide) {
  return (
    !slide.image &&
    !slide.mobileImage &&
    !slide.headline &&
    !slide.keyTag &&
    !slide.cta?.label &&
    !slide.cta?.href
  );
}

function isEmptyBrandLogo(logo: BrandLogo) {
  return !logo.name && !logo.image;
}

type PendingRemove =
  | { type: "banner"; id: string; label: string }
  | { type: "logo"; id: string; label: string };

export function BannerLogoAdmin({ initialContent }: BannerLogoAdminProps) {
  const dispatch = useAppDispatch();
  const [pendingRemove, setPendingRemove] = useState<PendingRemove | null>(
    null,
  );
  const {
    heroSlides,
    brandLogos,
    activeTab,
    editingHeroSlideId,
    editingBrandLogoId,
    isSaving,
    saveMessage,
    saveError,
  } = useAppSelector((state) => state.bannerLogo);

  useEffect(() => {
    dispatch(initializeContent(initialContent));
  }, [dispatch, initialContent]);

  const editingHeroSlide = heroSlides.find(
    (slide) => slide.id === editingHeroSlideId,
  );
  const editingBrandLogo = brandLogos.find(
    (logo) => logo.id === editingBrandLogoId,
  );

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

    if (result.success) {
      dispatch(setEditingHeroSlide(null));
      dispatch(setEditingBrandLogo(null));
    }
  }

  function handleCancelEdit() {
    dispatch(clearSaveResult());

    if (editingHeroSlideId) {
      const slide = heroSlides.find((item) => item.id === editingHeroSlideId);
      if (slide && isEmptyHeroSlide(slide)) {
        dispatch(removeHeroSlide(editingHeroSlideId));
      }
    }

    if (editingBrandLogoId) {
      const logo = brandLogos.find((item) => item.id === editingBrandLogoId);
      if (logo && isEmptyBrandLogo(logo)) {
        dispatch(removeBrandLogo(editingBrandLogoId));
      }
    }

    dispatch(setEditingHeroSlide(null));
    dispatch(setEditingBrandLogo(null));
  }

  function handleConfirmRemove() {
    if (!pendingRemove) return;

    if (pendingRemove.type === "banner") {
      dispatch(removeHeroSlide(pendingRemove.id));
    } else {
      dispatch(removeBrandLogo(pendingRemove.id));
    }

    setPendingRemove(null);
  }

  const bannerPopupTitle = editingHeroSlide
    ? isEmptyHeroSlide(editingHeroSlide)
      ? "Add Banner"
      : "Edit Banner"
    : "Banner";

  const logoPopupTitle = editingBrandLogo
    ? isEmptyBrandLogo(editingBrandLogo)
      ? "Add Logo"
      : "Edit Logo"
    : "Logo";

  return (
    <div className="space-y-6">
      <div className="border-b border-outline-variant pb-6">
        <h2 className="font-headline text-lg font-bold leading-tight md:text-2xl text-on-surface">
          Banner & Logo
        </h2>
        <p className="font-body text-base leading-normal mt-2 text-on-surface-variant">
          Manage hero banners and brand logos shown on the homepage. Desktop and
          mobile banner images are required; key tag, headline, and CTA are
          optional.
        </p>
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

      <div className="flex flex-wrap gap-6 py-2">
        <button
          type="button"
          onClick={() => dispatch(setActiveTab("banners"))}
          className={cn(
            "font-label text-xs font-bold uppercase tracking-[0.15em] leading-none pb-1 transition-colors",
            activeTab === "banners"
              ? "border-b-2 border-primary text-on-surface"
              : "text-on-surface-variant hover:text-on-surface",
          )}
        >
          Hero Banners ({heroSlides.length})
        </button>
        <button
          type="button"
          onClick={() => dispatch(setActiveTab("logos"))}
          className={cn(
            "font-label text-xs font-bold uppercase tracking-[0.15em] leading-none pb-1 transition-colors",
            activeTab === "logos"
              ? "border-b-2 border-primary text-on-surface"
              : "text-on-surface-variant hover:text-on-surface",
          )}
        >
          Brand Logos ({brandLogos.length})
        </button>
      </div>

      {activeTab === "banners" ? (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button type="button" onClick={() => dispatch(addHeroSlide())}>
              Add Banner
            </Button>
          </div>

          {heroSlides.length === 0 ? (
            <p className="rounded-lg border border-outline-variant bg-surface-container-lowest p-6 font-body text-sm text-on-surface-variant">
              No banners yet. Click Add Banner to create one.
            </p>
          ) : null}

          {heroSlides.map((slide, index) => (
            <BannerPreview
              key={slide.id}
              slide={slide}
              index={index}
              onEdit={() => dispatch(setEditingHeroSlide(slide.id))}
              onRemove={() =>
                setPendingRemove({
                  type: "banner",
                  id: slide.id,
                  label: slide.headline || `Banner ${index + 1}`,
                })
              }
            />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button type="button" onClick={() => dispatch(addBrandLogo())}>
              Add Logo
            </Button>
          </div>

          {brandLogos.length === 0 ? (
            <p className="rounded-lg border border-outline-variant bg-surface-container-lowest p-6 font-body text-sm text-on-surface-variant">
              No logos yet. Click Add Logo to create one.
            </p>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            {brandLogos.map((logo, index) => (
              <LogoPreview
                key={logo.id}
                logo={logo}
                index={index}
                onEdit={() => dispatch(setEditingBrandLogo(logo.id))}
                onRemove={() =>
                  setPendingRemove({
                    type: "logo",
                    id: logo.id,
                    label: logo.name || `Logo ${index + 1}`,
                  })
                }
              />
            ))}
          </div>
        </div>
      )}

      <Popup
        open={Boolean(editingHeroSlide)}
        onClose={handleCancelEdit}
        title={bannerPopupTitle}
        description="Upload desktop and mobile images. Key tag, headline, and CTA are optional."
        size="lg"
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              disabled={isSaving}
              onClick={handleCancelEdit}
            >
              Cancel
            </Button>
            <Button type="button" disabled={isSaving} onClick={handleSave}>
              {isSaving ? "Saving..." : "Save Banner"}
            </Button>
          </div>
        }
      >
        {editingHeroSlide ? <BannerEditForm slide={editingHeroSlide} /> : null}
      </Popup>

      <Popup
        open={Boolean(editingBrandLogo)}
        onClose={handleCancelEdit}
        title={logoPopupTitle}
        description="Add a brand name and upload the logo image."
        size="md"
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              disabled={isSaving}
              onClick={handleCancelEdit}
            >
              Cancel
            </Button>
            <Button type="button" disabled={isSaving} onClick={handleSave}>
              {isSaving ? "Saving..." : "Save Logo"}
            </Button>
          </div>
        }
      >
        {editingBrandLogo ? <LogoEditForm logo={editingBrandLogo} /> : null}
      </Popup>

      <Popup
        open={Boolean(pendingRemove)}
        onClose={() => setPendingRemove(null)}
        title={
          pendingRemove?.type === "banner" ? "Remove Banner" : "Remove Logo"
        }
        description={
          pendingRemove
            ? `Are you sure you want to remove "${pendingRemove.label}"? This action cannot be undone.`
            : undefined
        }
        size="sm"
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setPendingRemove(null)}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleConfirmRemove}>
              Remove
            </Button>
          </div>
        }
      />
    </div>
  );
}

"use client";

import Image from "next/image";
import { useEffect } from "react";
import { saveBannerLogoContent } from "@/app/admin/(dashboard)/banner-logo/actions";
import { Button, Input } from "@/components/ui";
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
          variant === "mobile"
            ? "mx-auto aspect-[9/16] max-w-[180px]"
            : "h-36",
        )}
      >
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
  isEditing: boolean;
  onEdit: () => void;
  onRemove: () => void;
};

function BannerPreview({
  slide,
  index,
  isEditing,
  onEdit,
  onRemove,
}: BannerPreviewProps) {
  return (
    <article className="rounded-lg border border-outline-variant bg-surface-container-lowest p-5 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 flex-1 gap-4">
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
              <p className="font-body text-sm text-on-surface-variant">No CTA</p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 gap-2">
          <Button
            type="button"
            variant={isEditing ? "primary" : "ghost"}
            onClick={onEdit}
          >
            {isEditing ? "Cancel" : "Edit"}
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
  isSaving: boolean;
  onSave: () => void;
  onCancel: () => void;
};

function BannerEditForm({
  slide,
  isSaving,
  onSave,
  onCancel,
}: BannerEditFormProps) {
  const dispatch = useAppDispatch();

  return (
    <div className="mt-4 space-y-6 rounded-lg border border-outline-variant bg-surface-container-low p-5 md:p-6">
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

      <div className="flex flex-wrap justify-end gap-2 border-t border-outline-variant pt-4">
        <Button type="button" variant="ghost" disabled={isSaving} onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" disabled={isSaving} onClick={onSave}>
          {isSaving ? "Saving..." : "Save Banner"}
        </Button>
      </div>
    </div>
  );
}

type LogoPreviewProps = {
  logo: BrandLogo;
  index: number;
  isEditing: boolean;
  onEdit: () => void;
  onRemove: () => void;
};

function LogoPreview({
  logo,
  index,
  isEditing,
  onEdit,
  onRemove,
}: LogoPreviewProps) {
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
          <Button
            type="button"
            variant={isEditing ? "primary" : "ghost"}
            onClick={onEdit}
          >
            {isEditing ? "Cancel" : "Edit"}
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
  isSaving: boolean;
  onSave: () => void;
  onCancel: () => void;
};

function LogoEditForm({ logo, isSaving, onSave, onCancel }: LogoEditFormProps) {
  const dispatch = useAppDispatch();

  return (
    <div className="mt-4 space-y-4 rounded-lg border border-outline-variant bg-surface-container-low p-5">
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

      <div className="flex flex-wrap justify-end gap-2 border-t border-outline-variant pt-4">
        <Button type="button" variant="ghost" disabled={isSaving} onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" disabled={isSaving} onClick={onSave}>
          {isSaving ? "Saving..." : "Save Logo"}
        </Button>
      </div>
    </div>
  );
}

export function BannerLogoAdmin({ initialContent }: BannerLogoAdminProps) {
  const dispatch = useAppDispatch();
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
    dispatch(setEditingHeroSlide(null));
    dispatch(setEditingBrandLogo(null));
  }

  const isEditing = Boolean(editingHeroSlideId || editingBrandLogoId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-outline-variant pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="font-headline text-lg font-bold leading-tight md:text-2xl text-on-surface">
            Banner & Logo
          </h2>
          <p className="font-body text-base leading-normal mt-2 text-on-surface-variant">
            Manage hero banners and brand logos shown on the homepage. Desktop
            and mobile banner images are required; key tag, headline, and CTA
            are optional.
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
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button type="button" variant="ghost" onClick={() => dispatch(addHeroSlide())}>
              Add Banner
            </Button>
          </div>

          {heroSlides.length === 0 ? (
            <p className="rounded-lg border border-outline-variant bg-surface-container-lowest p-6 font-body text-sm text-on-surface-variant">
              No banners yet. Click Add Banner to create one.
            </p>
          ) : null}

          {heroSlides.map((slide, index) => {
            const isEditing = editingHeroSlideId === slide.id;

            return (
              <div key={slide.id}>
                <BannerPreview
                  slide={slide}
                  index={index}
                  isEditing={isEditing}
                  onEdit={() =>
                    dispatch(
                      setEditingHeroSlide(isEditing ? null : slide.id),
                    )
                  }
                  onRemove={() => dispatch(removeHeroSlide(slide.id))}
                />
                {isEditing ? (
                  <BannerEditForm
                    slide={slide}
                    isSaving={isSaving}
                    onSave={handleSave}
                    onCancel={handleCancelEdit}
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button type="button" variant="ghost" onClick={() => dispatch(addBrandLogo())}>
              Add Logo
            </Button>
          </div>

          {brandLogos.length === 0 ? (
            <p className="rounded-lg border border-outline-variant bg-surface-container-lowest p-6 font-body text-sm text-on-surface-variant">
              No logos yet. Click Add Logo to create one.
            </p>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            {brandLogos.map((logo, index) => {
              const isEditing = editingBrandLogoId === logo.id;

              return (
                <div key={logo.id}>
                  <LogoPreview
                    logo={logo}
                    index={index}
                    isEditing={isEditing}
                    onEdit={() =>
                      dispatch(
                        setEditingBrandLogo(isEditing ? null : logo.id),
                      )
                    }
                    onRemove={() => dispatch(removeBrandLogo(logo.id))}
                  />
                  {isEditing ? (
                    <LogoEditForm
                      logo={logo}
                      isSaving={isSaving}
                      onSave={handleSave}
                      onCancel={handleCancelEdit}
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {isEditing ? (
        <div className="sticky bottom-4 z-10 flex justify-end gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest p-4 shadow-sm">
          <Button type="button" variant="ghost" disabled={isSaving} onClick={handleCancelEdit}>
            Cancel
          </Button>
          <Button type="button" disabled={isSaving} onClick={handleSave}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

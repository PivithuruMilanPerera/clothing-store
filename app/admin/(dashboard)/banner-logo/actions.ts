"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { saveLandingContent } from "@/lib/landing-content";
import { hasAdminCredentials } from "@/lib/supabase/admin";
import {
  uploadLandingImageToStorage,
  validateLandingImageFile,
} from "@/lib/supabase/landing-storage";
import type { LandingContent } from "@/lib/types";

export type BannerLogoActionState = {
  error?: string;
  success?: string;
  imageUrl?: string;
};

export async function uploadLandingImage(
  _prevState: BannerLogoActionState | null,
  formData: FormData,
): Promise<BannerLogoActionState> {
  await requireAdmin();

  if (!hasAdminCredentials()) {
    return { error: "Supabase storage is not configured." };
  }

  const file = formData.get("file");

  if (!(file instanceof File)) {
    return { error: "Please choose an image file to upload." };
  }

  const validationError = validateLandingImageFile(file);
  if (validationError) {
    return { error: validationError };
  }

  try {
    const imageUrl = await uploadLandingImageToStorage(file);

    return {
      success: "Image uploaded.",
      imageUrl,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to upload image.";

    return { error: message };
  }
}

export async function saveBannerLogoContent(
  content: LandingContent,
): Promise<BannerLogoActionState> {
  await requireAdmin();

  const heroSlides = content.heroSlides.map((slide) => {
    const keyTag = slide.keyTag?.trim();
    const headline = slide.headline?.trim();
    const ctaLabel = slide.cta?.label?.trim();
    const ctaHref = slide.cta?.href?.trim();

    return {
      id: slide.id.trim(),
      image: slide.image.trim(),
      mobileImage: slide.mobileImage.trim(),
      ...(keyTag ? { keyTag } : {}),
      ...(headline ? { headline } : {}),
      ...(ctaLabel || ctaHref
        ? {
            cta: {
              ...(ctaLabel ? { label: ctaLabel } : {}),
              ...(ctaHref ? { href: ctaHref } : {}),
            },
          }
        : {}),
    };
  });

  const brandLogos = content.brandLogos.map((logo) => ({
    id: logo.id.trim(),
    name: logo.name.trim(),
    image: logo.image.trim(),
  }));

  if (heroSlides.some((slide) => !slide.image || !slide.mobileImage)) {
    return {
      error: "Each hero banner must have desktop and mobile images.",
    };
  }

  if (brandLogos.some((logo) => !logo.name || !logo.image)) {
    return { error: "Each brand logo needs a name and image." };
  }

  try {
    await saveLandingContent({ heroSlides, brandLogos });
    revalidatePath("/");
    revalidatePath("/admin/banner-logo");

    return { success: "Banner and logo content saved." };
  } catch {
    return { error: "Unable to save content. Please try again." };
  }
}

"use server";

import { revalidatePath } from "next/cache";
import { getSessionAdmin, requireAdmin } from "@/lib/auth";
import { saveLandingContent } from "@/lib/landing-content";
import { isManagedLandingImageUrl } from "@/lib/landing-image-validation";
import { hasAdminCredentials } from "@/lib/supabase/admin";
import {
  deleteLandingImagesFromStorage,
  uploadLandingImageToStorage,
} from "@/lib/supabase/landing-storage";
import { validateLandingImageFile } from "@/lib/landing-image-validation";
import type { LandingContent } from "@/lib/types";

export type BannerLogoActionState = {
  error?: string;
  success?: string;
  imageUrl?: string;
  originalSize?: number;
  compressedSize?: number;
};

export async function uploadLandingImage(
  _prevState: BannerLogoActionState | null,
  formData: FormData,
): Promise<BannerLogoActionState> {
  const admin = await getSessionAdmin();
  if (!admin) {
    return { error: "You must be signed in as an admin to upload images." };
  }

  if (!hasAdminCredentials()) {
    return { error: "Supabase storage is not configured." };
  }

  const file = formData.get("file");

  if (
    typeof File === "undefined" ||
    !(file instanceof File) ||
    typeof file.arrayBuffer !== "function" ||
    file.size === 0
  ) {
    return { error: "Please choose an image file to upload." };
  }

  const validationError = validateLandingImageFile(file);
  if (validationError) {
    return { error: validationError };
  }

  try {
    const { url, originalSize, compressedSize } =
      await uploadLandingImageToStorage(file);

    return {
      success: "Image uploaded successfully.",
      imageUrl: url,
      originalSize,
      compressedSize,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to upload image.";
    console.error("[admin-upload]", message, error);

    return { error: message };
  }
}

export async function deleteLandingImage(
  imageUrl: string,
): Promise<{ error?: string; success?: string }> {
  await requireAdmin();

  const trimmedUrl = imageUrl.trim();
  if (!trimmedUrl) {
    return { error: "Image URL is required." };
  }

  if (!isManagedLandingImageUrl(trimmedUrl)) {
    return { success: "Image removed." };
  }

  if (!hasAdminCredentials()) {
    return { error: "Supabase storage is not configured." };
  }

  try {
    await deleteLandingImagesFromStorage([trimmedUrl]);
    return { success: "Image deleted from storage." };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to delete image from storage.";
    return { error: message };
  }
}

export async function deleteLandingImages(
  imageUrls: string[],
): Promise<{ error?: string; success?: string }> {
  await requireAdmin();

  const trimmedUrls = imageUrls.map((url) => url.trim()).filter(Boolean);
  if (trimmedUrls.length === 0) {
    return { success: "Images removed." };
  }

  const managedUrls = trimmedUrls.filter(isManagedLandingImageUrl);
  if (managedUrls.length === 0) {
    return { success: "Images removed." };
  }

  if (!hasAdminCredentials()) {
    return { error: "Supabase storage is not configured." };
  }

  try {
    await deleteLandingImagesFromStorage(managedUrls);
    return { success: "Images deleted from storage." };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to delete images from storage.";
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

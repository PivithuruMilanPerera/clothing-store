"use server";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { saveLandingContent } from "@/lib/landing-content";
import type { LandingContent } from "@/lib/types";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "landing");
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export type BannerLogoActionState = {
  error?: string;
  success?: string;
  imageUrl?: string;
};

function getExtension(file: File) {
  const fromName = path.extname(file.name).toLowerCase();
  if (fromName) return fromName;

  switch (file.type) {
    case "image/jpeg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    case "image/gif":
      return ".gif";
    default:
      return ".png";
  }
}

export async function uploadLandingImage(
  _prevState: BannerLogoActionState | null,
  formData: FormData,
): Promise<BannerLogoActionState> {
  await requireAdmin();

  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Please choose an image file to upload." };
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return { error: "Only JPG, PNG, WebP, and GIF images are allowed." };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { error: "Image must be 5 MB or smaller." };
  }

  const filename = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}${getExtension(file)}`;
  const filePath = path.join(UPLOAD_DIR, filename);

  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(filePath, Buffer.from(await file.arrayBuffer()));

  return {
    success: "Image uploaded.",
    imageUrl: `/uploads/landing/${filename}`,
  };
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

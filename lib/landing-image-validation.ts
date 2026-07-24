export const LANDING_BUCKET = "landing";

export const MAX_LANDING_IMAGE_SIZE = 5 * 1024 * 1024;

const LANDING_IMAGE_PUBLIC_PATH = `/storage/v1/object/public/${LANDING_BUCKET}/`;

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export function getLandingImageStoragePath(url: string): string | null {
  try {
    const parsed = new URL(url);
    const index = parsed.pathname.indexOf(LANDING_IMAGE_PUBLIC_PATH);
    if (index === -1) {
      return null;
    }

    const storagePath = parsed.pathname.slice(
      index + LANDING_IMAGE_PUBLIC_PATH.length,
    );

    return storagePath ? decodeURIComponent(storagePath) : null;
  } catch {
    return null;
  }
}

export function isManagedLandingImageUrl(url: string): boolean {
  return getLandingImageStoragePath(url) !== null;
}

export function validateLandingImageFile(file: File): string | null {
  if (!(file instanceof File) || file.size === 0) {
    return "Please choose an image file to upload.";
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return "Only JPG, PNG, WebP, and GIF images are allowed.";
  }

  if (file.size > MAX_LANDING_IMAGE_SIZE) {
    return "Image must be 5 MB or smaller.";
  }

  return null;
}

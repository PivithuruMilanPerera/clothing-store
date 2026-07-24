export const PRODUCT_IMG_BUCKET = "product-img";

export const MAX_PRODUCT_IMAGE_SIZE = 5 * 1024 * 1024;

const PRODUCT_IMAGE_PUBLIC_PATH = `/storage/v1/object/public/${PRODUCT_IMG_BUCKET}/`;

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export function getProductImageStoragePath(url: string): string | null {
  try {
    const parsed = new URL(url);
    const index = parsed.pathname.indexOf(PRODUCT_IMAGE_PUBLIC_PATH);
    if (index === -1) {
      return null;
    }

    const storagePath = parsed.pathname.slice(
      index + PRODUCT_IMAGE_PUBLIC_PATH.length,
    );

    return storagePath ? decodeURIComponent(storagePath) : null;
  } catch {
    return null;
  }
}

export function isManagedProductImageUrl(url: string): boolean {
  return getProductImageStoragePath(url) !== null;
}

export function validateProductImageFile(file: File): string | null {
  if (!(file instanceof File) || file.size === 0) {
    return "Please choose an image file to upload.";
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return "Only JPG, PNG, WebP, and GIF images are allowed.";
  }

  if (file.size > MAX_PRODUCT_IMAGE_SIZE) {
    return "Image must be 5 MB or smaller.";
  }

  return null;
}

export const LANDING_BUCKET = "landing";

export const MAX_LANDING_IMAGE_SIZE = 5 * 1024 * 1024;

const LANDING_IMAGE_PUBLIC_PATH = `/storage/v1/object/public/${LANDING_BUCKET}/`;

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function getFileImageType(file: File): string | null {
  if (ALLOWED_TYPES.has(file.type)) {
    return file.type === "image/jpg" ? "image/jpeg" : file.type;
  }

  const extension = file.name.split(".").pop()?.toLowerCase();
  switch (extension) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    default:
      return null;
  }
}

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

  if (!getFileImageType(file)) {
    return "Only JPG, PNG, WebP, and GIF images are allowed.";
  }

  if (file.size > MAX_LANDING_IMAGE_SIZE) {
    return "Image must be 5 MB or smaller.";
  }

  return null;
}

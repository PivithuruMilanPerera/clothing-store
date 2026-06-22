import path from "node:path";
import { createAdminClient } from "@/lib/supabase/admin";

export const LANDING_BUCKET = "landing";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

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

export function validateLandingImageFile(file: File): string | null {
  if (!(file instanceof File) || file.size === 0) {
    return "Please choose an image file to upload.";
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return "Only JPG, PNG, WebP, and GIF images are allowed.";
  }

  if (file.size > MAX_FILE_SIZE) {
    return "Image must be 5 MB or smaller.";
  }

  return null;
}

export async function uploadLandingImageToStorage(file: File): Promise<string> {
  const validationError = validateLandingImageFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const filename = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}${getExtension(file)}`;

  return uploadLandingBufferToStorage(
    filename,
    Buffer.from(await file.arrayBuffer()),
    file.type,
  );
}

export async function uploadLandingBufferToStorage(
  filename: string,
  buffer: Buffer,
  contentType: string,
  options?: { upsert?: boolean },
): Promise<string> {
  const supabase = createAdminClient();

  const { error } = await supabase.storage
    .from(LANDING_BUCKET)
    .upload(filename, buffer, {
      contentType,
      cacheControl: "3600",
      upsert: options?.upsert ?? false,
    });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage.from(LANDING_BUCKET).getPublicUrl(filename);
  return data.publicUrl;
}

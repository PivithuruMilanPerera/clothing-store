import "server-only";

import {
  prepareImageForWebpUpload,
} from "@/lib/image/process-image";
import {
  LANDING_BUCKET,
  getLandingImageStoragePath,
  validateLandingImageFile,
} from "@/lib/landing-image-validation";
import { createAdminClient } from "@/lib/supabase/admin";

export { LANDING_BUCKET } from "@/lib/landing-image-validation";

export type LandingImageUploadResult = {
  url: string;
  originalSize: number;
  compressedSize: number;
};

export async function uploadLandingImageToStorage(
  file: File,
): Promise<LandingImageUploadResult> {
  const validationError = validateLandingImageFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const originalBuffer = Buffer.from(new Uint8Array(await file.arrayBuffer()));
  const webpBuffer = await prepareImageForWebpUpload(originalBuffer, {
    mimeType: file.type,
  });
  const filename = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.webp`;

  const url = await uploadLandingBufferToStorage(
    filename,
    webpBuffer,
    "image/webp",
  );

  return {
    url,
    originalSize: originalBuffer.length,
    compressedSize: webpBuffer.length,
  };
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

export async function deleteLandingImagesFromStorage(
  urls: string[],
): Promise<void> {
  const paths = [
    ...new Set(
      urls
        .map((url) => getLandingImageStoragePath(url))
        .filter((path): path is string => Boolean(path)),
    ),
  ];

  if (paths.length === 0) {
    return;
  }

  const supabase = createAdminClient();
  const { error } = await supabase.storage.from(LANDING_BUCKET).remove(paths);

  if (error) {
    throw new Error(error.message);
  }
}

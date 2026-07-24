import "server-only";

import { prepareImageForWebpUpload } from "@/lib/image/process-image";
import {
  PRODUCT_IMG_BUCKET,
  getProductImageStoragePath,
  validateProductImageFile,
} from "@/lib/product-image-validation";
import { createAdminClient } from "@/lib/supabase/admin";

export type ProductImageUploadResult = {
  url: string;
  originalSize: number;
  compressedSize: number;
};

export async function uploadProductImageToStorage(
  file: File,
): Promise<ProductImageUploadResult> {
  const validationError = validateProductImageFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const originalBuffer = Buffer.from(await file.arrayBuffer());
  const webpBuffer = await prepareImageForWebpUpload(originalBuffer, {
    mimeType: file.type,
  });
  const filename = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.webp`;

  const supabase = createAdminClient();

  const { error } = await supabase.storage
    .from(PRODUCT_IMG_BUCKET)
    .upload(filename, webpBuffer, {
      contentType: "image/webp",
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage
    .from(PRODUCT_IMG_BUCKET)
    .getPublicUrl(filename);

  return {
    url: data.publicUrl,
    originalSize: originalBuffer.length,
    compressedSize: webpBuffer.length,
  };
}

export async function deleteProductImagesFromStorage(
  urls: string[],
): Promise<void> {
  const paths = [
    ...new Set(
      urls
        .map((url) => getProductImageStoragePath(url))
        .filter((path): path is string => Boolean(path)),
    ),
  ];

  if (paths.length === 0) {
    return;
  }

  const supabase = createAdminClient();
  const { error } = await supabase.storage.from(PRODUCT_IMG_BUCKET).remove(paths);

  if (error) {
    throw new Error(error.message);
  }
}

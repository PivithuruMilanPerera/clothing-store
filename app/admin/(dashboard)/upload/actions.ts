"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { hasAdminCredentials } from "@/lib/supabase/admin";
import {
  uploadLandingImageToStorage,
} from "@/lib/supabase/landing-storage";
import { validateLandingImageFile } from "@/lib/landing-image-validation";
import { uploadProductImageToStorage } from "@/lib/supabase/product-storage";
import { validateProductImageFile } from "@/lib/product-image-validation";

export type UploadActionState = {
  error?: string;
  success?: string;
  imageUrl?: string;
};

export type ProductUploadActionState = UploadActionState & {
  originalSize?: number;
  compressedSize?: number;
};

export async function uploadAdminImage(
  _prevState: UploadActionState | null,
  formData: FormData,
): Promise<UploadActionState> {
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
    const { url } = await uploadLandingImageToStorage(file);
    return { success: "Image uploaded.", imageUrl: url };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to upload image.";
    return { error: message };
  }
}

export async function uploadProductImage(
  _prevState: ProductUploadActionState | null,
  formData: FormData,
): Promise<ProductUploadActionState> {
  await requireAdmin();

  if (!hasAdminCredentials()) {
    return { error: "Supabase storage is not configured." };
  }

  const file = formData.get("file");

  if (!(file instanceof File)) {
    return { error: "Please choose an image file to upload." };
  }

  const validationError = validateProductImageFile(file);
  if (validationError) {
    return { error: validationError };
  }

  try {
    const { url, originalSize, compressedSize } =
      await uploadProductImageToStorage(file);

    return {
      success: "Image uploaded successfully.",
      imageUrl: url,
      originalSize,
      compressedSize,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to upload image.";
    return { error: message };
  }
}

export async function revalidateStorefront() {
  revalidatePath("/");
  revalidatePath("/shop");
}

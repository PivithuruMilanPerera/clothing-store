"use server";

import { revalidatePath } from "next/cache";
import { getSessionAdmin } from "@/lib/auth";
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

function isUploadFile(value: FormDataEntryValue | null): value is File {
  return (
    typeof File !== "undefined" &&
    value instanceof File &&
    typeof value.arrayBuffer === "function" &&
    value.size > 0
  );
}

function toUploadErrorMessage(error: unknown, fallback: string): string {
  const message = error instanceof Error ? error.message : fallback;
  console.error("[admin-upload]", message, error);
  return message;
}

export async function uploadAdminImage(
  _prevState: UploadActionState | null,
  formData: FormData,
): Promise<UploadActionState> {
  const admin = await getSessionAdmin();
  if (!admin) {
    return { error: "You must be signed in as an admin to upload images." };
  }

  if (!hasAdminCredentials()) {
    return { error: "Supabase storage is not configured." };
  }

  const file = formData.get("file");

  if (!isUploadFile(file)) {
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
    return {
      error: toUploadErrorMessage(error, "Unable to upload image."),
    };
  }
}

export async function uploadProductImage(
  _prevState: ProductUploadActionState | null,
  formData: FormData,
): Promise<ProductUploadActionState> {
  const admin = await getSessionAdmin();
  if (!admin) {
    return { error: "You must be signed in as an admin to upload images." };
  }

  if (!hasAdminCredentials()) {
    return { error: "Supabase storage is not configured." };
  }

  const file = formData.get("file");

  if (!isUploadFile(file)) {
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
    return {
      error: toUploadErrorMessage(error, "Unable to upload image."),
    };
  }
}

export async function revalidateStorefront() {
  revalidatePath("/");
  revalidatePath("/shop");
}

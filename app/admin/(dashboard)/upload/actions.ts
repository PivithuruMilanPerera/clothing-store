"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { hasAdminCredentials } from "@/lib/supabase/admin";
import {
  uploadLandingImageToStorage,
  validateLandingImageFile,
} from "@/lib/supabase/landing-storage";

export type UploadActionState = {
  error?: string;
  success?: string;
  imageUrl?: string;
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
    const imageUrl = await uploadLandingImageToStorage(file);
    return { success: "Image uploaded.", imageUrl };
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

"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  startTransition,
  type ChangeEvent,
} from "react";
import {
  uploadLandingImage,
  type BannerLogoActionState,
} from "@/app/admin/(dashboard)/banner-logo/actions";
import {
  MAX_LANDING_IMAGE_SIZE,
  validateLandingImageFile,
} from "@/lib/landing-image-validation";
import { formatFileSize } from "@/lib/utils";

type UseLandingImageUploaderParams = {
  onUploaded: (url: string) => void;
};

function formatCompressionMessage(
  originalSize: number,
  compressedSize: number,
): string {
  if (compressedSize >= originalSize) {
    return `Image uploaded and converted to WebP (${formatFileSize(compressedSize)}).`;
  }

  const savedPercent = Math.round(
    ((originalSize - compressedSize) / originalSize) * 100,
  );

  return `Image uploaded. Compressed from ${formatFileSize(originalSize)} to ${formatFileSize(compressedSize)} (${savedPercent}% smaller).`;
}

export function useLandingImageUploader({
  onUploaded,
}: UseLandingImageUploaderParams) {
  const inputRef = useRef<HTMLInputElement>(null);
  const onUploadedRef = useRef(onUploaded);
  const lastHandledUploadRef = useRef<BannerLogoActionState | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadState, uploadAction, isUploading] = useActionState<
    BannerLogoActionState | null,
    FormData
  >(uploadLandingImage, null);

  useEffect(() => {
    onUploadedRef.current = onUploaded;
  });

  useEffect(() => {
    if (!uploadState) {
      return;
    }

    if (uploadState.error) {
      setClientError(null);
      setUploadSuccess(null);
      return;
    }

    if (!uploadState.imageUrl) {
      return;
    }

    if (lastHandledUploadRef.current === uploadState) {
      return;
    }

    lastHandledUploadRef.current = uploadState;
    setClientError(null);

    if (
      uploadState.originalSize !== undefined &&
      uploadState.compressedSize !== undefined
    ) {
      setUploadSuccess(
        formatCompressionMessage(
          uploadState.originalSize,
          uploadState.compressedSize,
        ),
      );
    } else {
      setUploadSuccess(uploadState.success ?? "Image uploaded successfully.");
    }

    onUploadedRef.current(uploadState.imageUrl);
  }, [uploadState]);

  function openFilePicker() {
    inputRef.current?.click();
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setClientError(null);
    setUploadSuccess(null);

    const validationError = validateLandingImageFile(file);
    if (validationError) {
      setClientError(validationError);
      event.target.value = "";
      return;
    }

    const formData = new FormData();
    formData.set("file", file);
    startTransition(() => {
      uploadAction(formData);
    });
    event.target.value = "";
  }

  return {
    inputRef,
    uploadError: clientError ?? uploadState?.error ?? null,
    uploadSuccess,
    isUploading,
    maxFileSizeLabel: formatFileSize(MAX_LANDING_IMAGE_SIZE),
    openFilePicker,
    onFileChange,
  };
}

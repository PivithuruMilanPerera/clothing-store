"use client";

import { useActionState, useEffect, useRef, type ChangeEvent } from "react";
import {
  uploadLandingImage,
  type BannerLogoActionState,
} from "@/app/admin/(dashboard)/banner-logo/actions";

type UseLandingImageUploaderParams = {
  onUploaded: (url: string) => void;
};

export function useLandingImageUploader({
  onUploaded,
}: UseLandingImageUploaderParams) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadState, uploadAction, isUploading] = useActionState<
    BannerLogoActionState | null,
    FormData
  >(uploadLandingImage, null);

  useEffect(() => {
    if (uploadState?.imageUrl) {
      onUploaded(uploadState.imageUrl);
    }
  }, [onUploaded, uploadState?.imageUrl]);

  function openFilePicker() {
    inputRef.current?.click();
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.set("file", file);
    uploadAction(formData);
    event.target.value = "";
  }

  return {
    inputRef,
    uploadError: uploadState?.error ?? null,
    isUploading,
    openFilePicker,
    onFileChange,
  };
}

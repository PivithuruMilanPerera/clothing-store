"use client";

import {
  useActionState,
  useEffect,
  useRef,
  type ChangeEvent,
} from "react";
import {
  uploadAdminImage,
  type UploadActionState,
} from "@/app/admin/(dashboard)/upload/actions";

type UseAdminImageUploaderParams = {
  onUploaded: (url: string) => void;
};

export function useAdminImageUploader({
  onUploaded,
}: UseAdminImageUploaderParams) {
  const inputRef = useRef<HTMLInputElement>(null);
  const onUploadedRef = useRef(onUploaded);
  const lastHandledUploadRef = useRef<UploadActionState | null>(null);
  const [uploadState, uploadAction, isUploading] = useActionState<
    UploadActionState | null,
    FormData
  >(uploadAdminImage, null);

  useEffect(() => {
    onUploadedRef.current = onUploaded;
  });

  useEffect(() => {
    if (!uploadState?.imageUrl) {
      return;
    }

    if (lastHandledUploadRef.current === uploadState) {
      return;
    }

    lastHandledUploadRef.current = uploadState;
    onUploadedRef.current(uploadState.imageUrl);
  }, [uploadState]);

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

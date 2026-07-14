"use client";

import Image from "next/image";
import { useAdminImageUploader } from "@/hooks/useAdminImageUploader";

type ImageUploadFieldProps = {
  label: string;
  value: string;
  onChange: (url: string) => void;
  inputId: string;
};

export function ImageUploadField({
  label,
  value,
  onChange,
  inputId,
}: ImageUploadFieldProps) {
  const { inputRef, uploadError, isUploading, openFilePicker, onFileChange } =
    useAdminImageUploader({ onUploaded: onChange });

  return (
    <div>
      <label
        htmlFor={inputId}
        className="mb-2 block font-label text-xs font-bold uppercase tracking-[0.12em] leading-none text-on-surface-variant"
      >
        {label}
      </label>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={onFileChange}
      />
      <input type="hidden" name="image_url" value={value} />
      <div className="flex flex-wrap items-center gap-3">
        {value ? (
          <div className="relative h-20 w-20 overflow-hidden border border-outline-variant bg-surface-container-low">
            <Image
              src={value}
              alt=""
              fill
              sizes="80px"
              className="object-cover"
            />
          </div>
        ) : null}
        <button
          type="button"
          onClick={openFilePicker}
          disabled={isUploading}
          className="font-label border border-outline-variant px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] leading-none text-on-surface transition-opacity hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isUploading ? "Uploading..." : value ? "Change Image" : "Upload Image"}
        </button>
      </div>
      {uploadError ? (
        <p className="font-body mt-2 text-sm leading-normal text-error">
          {uploadError}
        </p>
      ) : null}
    </div>
  );
}

import "server-only";

import sharp from "sharp";

const WEBP_QUALITY = 82;
const WEBP_SKIP_MAX_SIZE = 120 * 1024;
const MAX_IMAGE_DIMENSION = 2048;

function isWebpBuffer(buffer: Buffer): boolean {
  return (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  );
}

function shouldSkipWebpProcessing(
  buffer: Buffer,
  mimeType?: string,
): boolean {
  const isWebp = mimeType === "image/webp" || isWebpBuffer(buffer);
  return isWebp && buffer.length <= WEBP_SKIP_MAX_SIZE;
}

function copyToPackedBuffer(input: Buffer): Buffer {
  return Buffer.from(input);
}

export async function prepareImageForWebpUpload(
  input: Buffer,
  options?: { mimeType?: string },
): Promise<Buffer> {
  if (shouldSkipWebpProcessing(input, options?.mimeType)) {
    return copyToPackedBuffer(input);
  }

  try {
    const output = await sharp(copyToPackedBuffer(input), {
      failOn: "none",
      animated: false,
    })
      .rotate()
      .resize({
        width: MAX_IMAGE_DIMENSION,
        height: MAX_IMAGE_DIMENSION,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({
        quality: WEBP_QUALITY,
        effort: 4,
        smartSubsample: true,
      })
      .toBuffer();

    return copyToPackedBuffer(output);
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : "unknown processing error";
    throw new Error(
      `This image could not be compressed. Try a JPG, PNG, or WebP under 5 MB. (${detail})`,
    );
  }
}

export async function compressImageToWebp(input: Buffer): Promise<Buffer> {
  return prepareImageForWebpUpload(input);
}

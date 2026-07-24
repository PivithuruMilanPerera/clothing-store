import "server-only";

import sharp from "sharp";

const WEBP_QUALITY = 92;
const WEBP_SKIP_MAX_SIZE = 120 * 1024;

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

export async function prepareImageForWebpUpload(
  input: Buffer,
  options?: { mimeType?: string },
): Promise<Buffer> {
  if (shouldSkipWebpProcessing(input, options?.mimeType)) {
    return input;
  }

  return sharp(input)
    .rotate()
    .webp({
      quality: WEBP_QUALITY,
      effort: 6,
      smartSubsample: true,
    })
    .toBuffer();
}

export async function compressImageToWebp(input: Buffer): Promise<Buffer> {
  return prepareImageForWebpUpload(input);
}

import { readFileSync } from "node:fs";
import { readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  LANDING_BUCKET,
  uploadLandingBufferToStorage,
} from "@/lib/supabase/landing-storage";

const ROOT = process.cwd();
const CONTENT_PATH = path.join(ROOT, "data", "landing-content.json");
const UPLOAD_DIR = path.join(ROOT, "public", "uploads", "landing");
const LOCAL_PREFIX = "/uploads/landing/";

function loadEnvLocal() {
  try {
    const envFile = readFileSync(path.join(ROOT, ".env.local"), "utf-8");
    for (const line of envFile.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const separator = trimmed.indexOf("=");
      if (separator === -1) continue;
      const key = trimmed.slice(0, separator);
      const value = trimmed.slice(separator + 1);
      if (key && process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  } catch {
    // .env.local is optional when env vars are already set.
  }
}

function getContentType(filename: string) {
  switch (path.extname(filename).toLowerCase()) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    default:
      return "application/octet-stream";
  }
}

function collectLocalImageUrls(content: {
  heroSlides: Array<{ image: string; mobileImage: string }>;
  brandLogos: Array<{ image: string }>;
}) {
  const urls = new Set<string>();

  for (const slide of content.heroSlides) {
    if (slide.image.startsWith(LOCAL_PREFIX)) urls.add(slide.image);
    if (slide.mobileImage.startsWith(LOCAL_PREFIX)) urls.add(slide.mobileImage);
  }

  for (const logo of content.brandLogos) {
    if (logo.image.startsWith(LOCAL_PREFIX)) urls.add(logo.image);
  }

  return [...urls];
}

function replaceLocalUrls<T>(value: T, urlMap: Map<string, string>): T {
  if (typeof value === "string") {
    return (urlMap.get(value) ?? value) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => replaceLocalUrls(item, urlMap)) as T;
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        replaceLocalUrls(item, urlMap),
      ]),
    ) as T;
  }

  return value;
}

async function main() {
  loadEnvLocal();
  createAdminClient();

  const raw = await readFile(CONTENT_PATH, "utf-8");
  const content = JSON.parse(raw) as {
    heroSlides: Array<{ image: string; mobileImage: string }>;
    brandLogos: Array<{ image: string }>;
  };

  const localUrls = collectLocalImageUrls(content);

  if (localUrls.length === 0) {
    console.log("No local landing images to migrate.");
    return;
  }

  const urlMap = new Map<string, string>();

  for (const localUrl of localUrls) {
    const filename = localUrl.slice(LOCAL_PREFIX.length);
    const filePath = path.join(UPLOAD_DIR, filename);
    const buffer = await readFile(filePath);
    const publicUrl = await uploadLandingBufferToStorage(
      filename,
      buffer,
      getContentType(filename),
      { upsert: true },
    );

    urlMap.set(localUrl, publicUrl);
    console.log(`Uploaded ${filename}`);
  }

  const updatedContent = replaceLocalUrls(content, urlMap);
  await writeFile(
    CONTENT_PATH,
    `${JSON.stringify(updatedContent, null, 2)}\n`,
    "utf-8",
  );

  for (const localUrl of localUrls) {
    const filename = localUrl.slice(LOCAL_PREFIX.length);
    await unlink(path.join(UPLOAD_DIR, filename));
    console.log(`Removed public/uploads/landing/${filename}`);
  }

  console.log(
    `Migrated ${localUrls.length} image(s) to Supabase bucket "${LANDING_BUCKET}".`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { brandLogos, heroSlides } from "@/data/landing";
import type { LandingContent } from "@/lib/types";

const CONTENT_PATH = path.join(process.cwd(), "data", "landing-content.json");

export function getDefaultLandingContent(): LandingContent {
  return {
    heroSlides: heroSlides.map((slide) => ({
      id: slide.id,
      headline: slide.headline,
      image: slide.image,
      cta: { ...slide.cta },
    })),
    brandLogos: brandLogos.map((logo) => ({
      id: logo.id,
      name: logo.name,
      image: logo.image,
    })),
  };
}

export async function getLandingContent(): Promise<LandingContent> {
  try {
    const raw = await readFile(CONTENT_PATH, "utf-8");
    const parsed = JSON.parse(raw) as LandingContent;

    if (
      Array.isArray(parsed.heroSlides) &&
      Array.isArray(parsed.brandLogos)
    ) {
      return parsed;
    }
  } catch {
    // Fall back to bundled defaults when no saved content exists yet.
  }

  return getDefaultLandingContent();
}

export async function saveLandingContent(content: LandingContent): Promise<void> {
  await writeFile(CONTENT_PATH, `${JSON.stringify(content, null, 2)}\n`, "utf-8");
}

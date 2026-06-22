import type { Metadata } from "next";
import { BannerLogoAdmin } from "@/components/admin/banner-logo/BannerLogoAdmin";
import { getLandingContent } from "@/lib/landing-content";

export const metadata: Metadata = {
  title: "Banner & Logo | Admin | VELVORZ",
  description: "Manage homepage hero banners and brand logos.",
};

export default async function BannerLogoPage() {
  const content = await getLandingContent();

  return <BannerLogoAdmin initialContent={content} />;
}

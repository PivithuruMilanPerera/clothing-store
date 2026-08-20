import type { NextConfig } from "next";

const serverActionOrigins = [
  "velvorz.com",
  "www.velvorz.com",
  // Vercel deployment / production hostnames (no protocol).
  process.env.VERCEL_URL,
  process.env.VERCEL_PROJECT_PRODUCTION_URL,
].filter((origin): origin is string => Boolean(origin));

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Product image uploads allow up to 5 MB before server-side compression.
      bodySizeLimit: "6mb",
      // Prevent CSRF Origin/Host mismatches behind Vercel/custom domain from
      // aborting uploads with a generic production 500.
      allowedOrigins: serverActionOrigins,
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "encrypted-tbn0.gstatic.com",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  outputFileTracingIncludes: {
    "*": ["./node_modules/@swc/helpers/**/*"],
  },
};

export default nextConfig;

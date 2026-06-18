import type { ProductColor, ProductImage, ProductSize } from "@/lib/types";

type ProductDetailOverride = {
  description?: string;
  images?: ProductImage[];
  materialsCare?: string;
  shippingReturns?: string;
  colors?: ProductColor[];
  sizes?: ProductSize[];
};

export const productDetailOverrides: Record<string, ProductDetailOverride> = {
  "signature-oversized-hoodie": {
    description:
      "An architectural take on the classic hoodie. Crafted from 100% heavy-weight organic cotton, featuring a structured oversized fit and dropped shoulders. Uncompromising precision in every stitch.",
    images: [
      { src: "/temp/hoodie.png", alt: "Signature Oversized Hoodie in black" },
      { src: "/temp/t.png", alt: "Signature Oversized Hoodie in white" },
      { src: "/temp/screen.png", alt: "Signature Oversized Hoodie fabric detail" },
    ],
    colors: ["black", "white"],
    sizes: ["S", "M", "L", "XL"],
  },
  "monolith-leather-sneakers": {
    description:
      "Monolith leather sneakers with a sculpted sole and minimal paneling. Full-grain leather upper with a cushioned footbed for all-day comfort.",
    images: [
      { src: "/temp/shoo.png", alt: "Monolith Leather Sneakers" },
      { src: "/temp/hero.png", alt: "Monolith Leather Sneakers side view" },
      { src: "/temp/screen.png", alt: "Monolith Leather Sneakers detail" },
    ],
    colors: ["white", "black"],
    sizes: ["S", "M", "L"],
  },
  "essential-cotton-tee": {
    description:
      "An essential cotton tee with a relaxed drape and reinforced neckline. Soft organic cotton designed for layering or wearing on its own.",
    images: [
      { src: "/temp/t.png", alt: "Essential Cotton Tee" },
      { src: "/temp/hoodie.png", alt: "Essential Cotton Tee styled look" },
      { src: "/temp/screen.png", alt: "Essential Cotton Tee fabric detail" },
    ],
    colors: ["black", "white"],
    sizes: ["XS", "S", "M", "L"],
  },
  "structured-cargo-trousers": {
    description:
      "Structured cargo trousers with articulated knee panels and utility pockets. Tailored through the leg with a clean, architectural silhouette.",
    images: [
      { src: "/temp/screen.png", alt: "Structured Cargo Trousers" },
      { src: "/temp/hoodie.png", alt: "Structured Cargo Trousers styled look" },
      { src: "/temp/t.png", alt: "Structured Cargo Trousers detail" },
    ],
    colors: ["black", "gray"],
    sizes: ["S", "M", "L"],
  },
};

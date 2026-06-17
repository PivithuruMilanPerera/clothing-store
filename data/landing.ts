import type { Category, FooterColumn, NavLink, Product } from "@/lib/types";

export const navLinks: NavLink[] = [
  { label: "Men", href: "/men" },
  { label: "Women", href: "/women" },
  { label: "Accessories", href: "/accessories" },
  { label: "Clearance", href: "/clearance" },
];

export const newArrivals: Product[] = [
  {
    id: "hoodie",
    brand: "Velvorz",
    name: "Signature Oversized Hoodie",
    price: 120,
    image: "/temp/hoodie.png",
    href: "/products/signature-oversized-hoodie",
  },
  {
    id: "sneakers",
    brand: "Velvorz",
    name: "Monolith Leather Sneakers",
    price: 245,
    image: "/temp/shoo.png",
    href: "/products/monolith-leather-sneakers",
    badge: "NEW",
  },
  {
    id: "tee",
    brand: "Velvorz",
    name: "Essential Cotton Tee",
    price: 65,
    image: "/temp/t.png",
    href: "/products/essential-cotton-tee",
  },
  {
    id: "trousers",
    brand: "Velvorz",
    name: "Structured Cargo Trousers",
    price: 185,
    image: "/temp/screen.png",
    href: "/products/structured-cargo-trousers",
  },
];

export const categories: Category[] = [
  {
    id: "men",
    name: "Men",
    image:
      "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=900&q=80",
    href: "/men",
  },
  {
    id: "women",
    name: "Women",
    image:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=900&q=80",
    href: "/women",
  },
  {
    id: "accessories",
    name: "Accessories",
    image:
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=900&q=80",
    href: "/accessories",
  },
];

export const footerColumns: FooterColumn[] = [
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Shipping", href: "/shipping" },
      { label: "Returns", href: "/returns" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Social",
    links: [
      { label: "Instagram", href: "https://instagram.com" },
      { label: "Twitter", href: "https://twitter.com" },
    ],
  },
];

export const heroSlides = [
  {
    id: "precision",
    headline: "Uncompromising Precision.",
    image: "/temp/hero.png",
    cta: { label: "Shop Collection", href: "/collection" },
  },
  {
    id: "summer-edit",
    headline: "Refined Essentials for Everyday Movement.",
    image: "/temp/hero.png",
    cta: { label: "Explore New Arrivals", href: "/new-arrivals" },
  },
  {
    id: "street-form",
    headline: "Elevated Streetwear, Designed for Comfort.",
    image: "/temp/hero.png",
    cta: { label: "Discover Street Form", href: "/streetwear" },
  },
];

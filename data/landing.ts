import type { Category, FooterColumn, NavLink, Product } from "@/lib/types";
import kids from "@/app/assets/category/kids-image.jpg";
import heroimage1 from "@/app/assets/hero-slider/image1.png";
import heroimage2 from "@/app/assets/hero-slider/image2.png";
import heroimage3 from "@/app/assets/hero-slider/image3.png";

export const navLinks: NavLink[] = [
  { label: "Men", href: "/men" },
  { label: "Women", href: "/women" },
  { label: "Kids", href: "/kids" },
  { label: "Accessories", href: "/accessories" },
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
    id: "kids",
    name: "Kids",
    image: kids.src,
    href: "/kids",
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
    image: heroimage1.src,
    cta: { label: "Shop Collection", href: "/collection" },
  },
  {
    id: "tailored-motion",
    headline: "Tailored Motion.",
    image: heroimage2.src,
    cta: { label: "Shop Now", href: "/collection/tailored-motion" },
  },
  {
    id: "summer-edit",
    headline: "Refined Essentials.",
    image: heroimage3.src,
    cta: { label: "Explore", href: "/new-arrivals" },
  },
  {
    id: "graphic-minimal",
    headline: "Graphic Minimal.",
    image: heroimage1.src,
    cta: { label: "Shop Now", href: "/collection/graphic-minimal" },
  },
  {
    id: "street-form",
    headline: "Street Form.",
    image: heroimage2.src,
    cta: { label: "Discover", href: "/streetwear" },
  },
  {
    id: "footwear-edit",
    headline: "Footwear Edit.",
    image: heroimage3.src,
    cta: { label: "Shop Now", href: "/collection/footwear-edit" },
  },
];

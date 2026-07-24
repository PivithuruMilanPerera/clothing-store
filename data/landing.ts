import type {
  Category,
  FooterColumn,
  NavLink,
  Product,
  SocialLink,
} from "@/lib/types";
import kids from "@/app/assets/category/kids-image.jpg";
import bag from "@/app/assets/category/bags.jpg";
import women from "@/app/assets/category/women.webp";
import heroimage1 from "@/app/assets/hero-slider/image1.png";
import heroimage2 from "@/app/assets/hero-slider/image2.png";
import heroimage3 from "@/app/assets/hero-slider/image3.png";
import men from "@/app/assets/category/man.jpg";

export const navLinks: NavLink[] = [
  { label: "Home", href: "/" },
  { label: "Mens", href: "/mens" },
  { label: "Womens", href: "/womens" },
  { label: "Baby & Kids", href: "/baby-kids" },
  { label: "Accessories", href: "/accessories" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

const brandLogoPlaceholder =
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSnxZnbZvsXk53T1xlTyr0akcZc7UqplTdw3LQVYKMRzO4SsF9_uRmwgpY&s=10";

export const brandLogos = [
  { id: "brand-1", name: "Brand 1", image: brandLogoPlaceholder },
  { id: "brand-2", name: "Brand 2", image: brandLogoPlaceholder },
  { id: "brand-3", name: "Brand 3", image: brandLogoPlaceholder },
  { id: "brand-4", name: "Brand 4", image: brandLogoPlaceholder },
  { id: "brand-5", name: "Brand 5", image: brandLogoPlaceholder },
  { id: "brand-6", name: "Brand 6", image: brandLogoPlaceholder },
  { id: "brand-7", name: "Brand 7", image: brandLogoPlaceholder },
  { id: "brand-8", name: "Brand 8", image: brandLogoPlaceholder },
];

export const preOrderProducts: Product[] = [
  {
    id: "linen-dress",
    brand: "Velvorz",
    name: "Structured Linen Dress",
    price: 195,
    basePrice: 195,
    discountType: null,
    discountValue: 0,
    discountAmount: 0,
    inventory: 100,
    image:
      "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80",
    href: "/products/structured-linen-dress",
    badge: "PRE ORDER",
    colors: ["cream"],
  },
  {
    id: "wool-coat",
    brand: "Velvorz",
    name: "Minimal Wool Coat",
    price: 320,
    basePrice: 320,
    discountType: null,
    discountValue: 0,
    discountAmount: 0,
    inventory: 100,
    image:
      "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800&q=80",
    href: "/products/minimal-wool-coat",
    badge: "PRE ORDER",
    colors: ["gray"],
  },
  {
    id: "leather-belt",
    brand: "Velvorz",
    name: "Minimal Leather Belt",
    price: 85,
    basePrice: 85,
    discountType: null,
    discountValue: 0,
    discountAmount: 0,
    inventory: 100,
    image:
      "https://images.unsplash.com/photo-1624222247344-550fb60583fd?w=800&q=80",
    href: "/products/minimal-leather-belt",
    badge: "PRE ORDER",
    colors: ["black"],
  },
  {
    id: "canvas-tote",
    brand: "Velvorz",
    name: "Structured Canvas Tote",
    price: 110,
    basePrice: 110,
    discountType: null,
    discountValue: 0,
    discountAmount: 0,
    inventory: 100,
    image:
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80",
    href: "/products/structured-canvas-tote",
    badge: "PRE ORDER",
    colors: ["cream", "black"],
  },
];

export const newArrivals: Product[] = [
  {
    id: "hoodie",
    brand: "Velvorz",
    name: "Signature Oversized Hoodie",
    price: 120,
    basePrice: 120,
    discountType: null,
    discountValue: 0,
    discountAmount: 0,
    inventory: 100,
    image: "/temp/hoodie.png",
    href: "/products/signature-oversized-hoodie",
    colors: ["black", "white"],
  },
  {
    id: "sneakers",
    brand: "Velvorz",
    name: "Monolith Leather Sneakers",
    price: 245,
    basePrice: 245,
    discountType: null,
    discountValue: 0,
    discountAmount: 0,
    inventory: 100,
    image: "/temp/shoo.png",
    href: "/products/monolith-leather-sneakers",
    badge: "NEW",
    colors: ["white", "black"],
  },
  {
    id: "tee",
    brand: "Velvorz",
    name: "Essential Cotton Tee",
    price: 65,
    basePrice: 65,
    discountType: null,
    discountValue: 0,
    discountAmount: 0,
    inventory: 100,
    image: "/temp/t.png",
    href: "/products/essential-cotton-tee",
    colors: ["black", "white"],
  },
  {
    id: "trousers",
    brand: "Velvorz",
    name: "Structured Cargo Trousers",
    price: 185,
    basePrice: 185,
    discountType: null,
    discountValue: 0,
    discountAmount: 0,
    inventory: 100,
    image: "/temp/screen.png",
    href: "/products/structured-cargo-trousers",
    colors: ["black", "gray"],
  },
];

export const categories: Category[] = [
  {
    id: "mens",
    name: "Mens",
    image: men.src,
    href: "/mens",
  },
  {
    id: "womens",
    name: "Womens",
    image: women.src,
    href: "/womens",
  },
  {
    id: "baby-kids",
    name: "Baby & Kids",
    image: kids.src,
    href: "/baby-kids",
  },
  {
    id: "accessories",
    name: "Accessories",
    image: bag.src,
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
      { label: "About Us", href: "/about" },
      { label: "Shipping", href: "/shipping" },
      { label: "Returns", href: "/returns" },
      { label: "Contact", href: "/contact" },
    ],
  },
];

export const socialLinks: SocialLink[] = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/velvorz/",
    icon: "instagram",
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/profile.php?id=61591352036910",
    icon: "facebook",
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/@VELVORZ-clothing",
    icon: "youtube",
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/velvorz/",
    icon: "linkedin",
  },
  {
    label: "TikTok",
    href: "https://www.tiktok.com/@velvorz",
    icon: "tiktok",
  },
];

export const heroSlides = [
  {
    id: "precision",
    keyTag: "New Collection",
    headline: "Uncompromising Precision.",
    image: heroimage1.src,
    mobileImage: heroimage1.src,
    cta: { label: "Shop Collection", href: "/collection" },
  },
  {
    id: "tailored-motion",
    keyTag: "New",
    headline: "Tailored Motion.",
    image: heroimage2.src,
    mobileImage: heroimage2.src,
    cta: { label: "Shop Now", href: "/collection/tailored-motion" },
  },
  {
    id: "summer-edit",
    headline: "Refined Essentials.",
    image: heroimage3.src,
    mobileImage: heroimage3.src,
    cta: { label: "Explore", href: "/new-arrivals" },
  },
  {
    id: "graphic-minimal",
    headline: "Graphic Minimal.",
    image: heroimage1.src,
    mobileImage: heroimage1.src,
    cta: { label: "Shop Now", href: "/collection/graphic-minimal" },
  },
  {
    id: "street-form",
    headline: "Street Form.",
    image: heroimage2.src,
    mobileImage: heroimage2.src,
    cta: { label: "Discover", href: "/streetwear" },
  },
  {
    id: "footwear-edit",
    headline: "Footwear Edit.",
    image: heroimage3.src,
    mobileImage: heroimage3.src,
    cta: { label: "Shop Now", href: "/collection/footwear-edit" },
  },
];

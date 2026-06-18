export type ProductCategory = "men" | "women" | "kids" | "accessories";

export type ProductSize = "XS" | "S" | "M" | "L" | "XL";

export type ProductColor = "black" | "white" | "gray" | "cream";

export type SortOption = "newest" | "price-asc" | "price-desc" | "name";

export type Product = {
  id: string;
  brand: string;
  name: string;
  price: number;
  image: string;
  href: string;
  badge?: string;
};

export type ShopProduct = Product & {
  category: ProductCategory;
  sizes: ProductSize[];
  colors: ProductColor[];
  createdAt: string;
};

export type ProductImage = {
  src: string;
  alt: string;
};

export type ProductDetail = ShopProduct & {
  slug: string;
  description: string;
  images: ProductImage[];
  materialsCare: string;
  shippingReturns: string;
};

export type CartItem = {
  id: string;
  slug: string;
  name: string;
  image: string;
  price: number;
  color: ProductColor;
  size: ProductSize;
  quantity: number;
};

export type Category = {
  id: string;
  name: string;
  image: string;
  href: string;
};

export type NavLink = {
  label: string;
  href: string;
};

export type FooterColumn = {
  title: string;
  links: NavLink[];
};

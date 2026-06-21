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

export type Profile = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  created_at: string;
  updated_at: string;
};

export type Address = {
  id: string;
  user_id: string;
  label: string;
  full_name: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

export type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export type OrderItem = {
  id: string;
  order_id: string;
  product_name: string;
  product_slug: string | null;
  image: string | null;
  color: string | null;
  size: string | null;
  quantity: number;
  unit_price: number;
  created_at: string;
};

export type Order = {
  id: string;
  user_id: string;
  order_number: string;
  status: OrderStatus;
  subtotal: number;
  shipping: number;
  total: number;
  shipping_address: Record<string, string> | null;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
};

export type ReturnStatus = "pending" | "approved" | "rejected" | "completed";

export type ReturnRequest = {
  id: string;
  user_id: string;
  order_id: string;
  reason: string;
  details: string | null;
  status: ReturnStatus;
  created_at: string;
  updated_at: string;
  orders?: Pick<Order, "order_number" | "created_at">;
};

export type AccountNavItem = {
  label: string;
  href: string;
  description: string;
};

export type Admin = {
  id: string;
  email: string;
  created_at: string;
};

export type ProductCategory = string;

export type ProductSize = string;

export type ProductColor = string;

export type SortOption = "newest" | "price-asc" | "price-desc" | "name";
export type DiscountType = "percentage" | "fixed";

export type Product = {
  id: string;
  brand: string;
  name: string;
  price: number;
  basePrice: number;
  discountType: DiscountType | null;
  discountValue: number;
  discountAmount: number;
  inventory: number;
  isLowStock?: boolean;
  image: string;
  href: string;
  badge?: string;
  colors?: ProductColor[];
  colorOptions?: Array<{ id: string; name: string; hex: string }>;
  sizes?: ProductSize[];
};

export type ShopProduct = Product & {
  category: ProductCategory;
  categorySlugs: ProductCategory[];
  categoryLabels?: string[];
  categoryId?: string;
  description?: string;
  sizes: ProductSize[];
  colors: ProductColor[];
  createdAt: string;
};

export type ProductImage = {
  src: string;
  alt: string;
  colorId?: string;
};

export type ProductDetail = ShopProduct & {
  slug: string;
  description: string;
  images: ProductImage[];
  materialsCare: string;
  shippingReturns: string;
  variantInventory: Array<{
    colorId: string;
    sizeId: string;
    sizeLabel: string;
    inventory: number;
  }>;
};

export type CartItem = {
  id: string;
  slug: string;
  name: string;
  image: string;
  price: number;
  color: ProductColor;
  colorName?: string;
  size: ProductSize;
  quantity: number;
  availableStock?: number;
  isOutOfStock?: boolean;
  isLowStock?: boolean;
};

export type CartStockStatus = {
  id: string;
  slug: string;
  color: string;
  size: string;
  availableStock: number;
  isOutOfStock: boolean;
  isLowStock: boolean;
  currentPrice: number;
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
  children?: NavLink[];
};

export type FooterColumn = {
  title: string;
  links: NavLink[];
};

export type SocialLink = {
  label: string;
  href: string;
  icon: "instagram" | "facebook" | "youtube" | "linkedin" | "tiktok";
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

export type PaymentMethod = "cash_on_delivery" | "card";

export type PaymentStatus = "pending" | "paid" | "failed";

export type CardPaymentOutcome = "success" | "failed" | "incomplete";

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
  user_id: string | null;
  customer_email?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  order_number: string;
  status: OrderStatus;
  payment_method?: PaymentMethod | string;
  payment_status?: PaymentStatus;
  is_guest?: boolean;
  subtotal: number;
  shipping: number;
  total: number;
  shipping_address: Record<string, string> | null;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
};

export type CheckoutMode = "registered" | "guest";

export type CheckoutShippingAddress = {
  country: string;
  firstName: string;
  lastName: string;
  company?: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
};

export type CheckoutSubmissionData = {
  mode: CheckoutMode;
  email: string;
  subscribeNews?: boolean;
  password?: string;
  confirmPassword?: string;
  shippingAddress: CheckoutShippingAddress;
  paymentMethod: PaymentMethod;
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
};

export type Admin = {
  id: string;
  email: string;
  created_at: string;
};

export type HeroSlideCta = {
  label?: string;
  href?: string;
};

export type HeroSlide = {
  id: string;
  image: string;
  mobileImage: string;
  keyTag?: string;
  headline?: string;
  cta?: HeroSlideCta;
};

export type BrandLogo = {
  id: string;
  name: string;
  image: string;
};

export type LandingContent = {
  heroSlides: HeroSlide[];
  brandLogos: BrandLogo[];
};

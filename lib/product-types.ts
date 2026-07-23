export type Color = {
  id: string;
  name: string;
  hex: string;
};

export type Brand = {
  id: string;
  name: string;
};

export type Size = {
  id: string;
  label: string;
};

export type StoreProductSize = {
  id: string;
  product_id: string;
  size_id: string;
  sort_order: number;
  size: Size;
};

export type StoreProductColor = {
  id: string;
  product_id: string;
  color_id: string;
  sort_order: number;
  color: Color;
};

export type StoreProductImage = {
  id: string;
  product_id: string;
  url: string;
  alt: string;
  color_id: string | null;
  sort_order: number;
  color?: Color | null;
};

export type StoreProductVariant = {
  id: string;
  product_id: string;
  color_id: string;
  size_id: string;
  inventory: number;
  color?: Color;
  size?: Size;
};

export type ProductVariantStock = {
  colorId: string;
  sizeId: string;
  sizeLabel: string;
  inventory: number;
};

export type StoreProduct = {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  brand: string;
  price: number;
  base_price: number;
  discount_type: "percentage" | "fixed" | null;
  discount_value: number;
  description: string;
  materials_care: string;
  shipping_returns: string;
  badge: string | null;
  inventory: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type StoreProductWithRelations = StoreProduct & {
  images: StoreProductImage[];
  colors: StoreProductColor[];
  sizes: StoreProductSize[];
  variants: StoreProductVariant[];
  category?: {
    id: string;
    name: string;
    slug: string;
    parent_id: string | null;
  };
};

export type ProductColorOption = {
  id: string;
  name: string;
  hex: string;
};

export type ShopFilterCategory = {
  id: string;
  label: string;
  slug: string;
};

export type ShopFilterColor = {
  id: string;
  label: string;
  hex: string;
};

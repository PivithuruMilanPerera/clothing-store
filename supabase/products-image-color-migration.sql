-- Link product images to a color variant by color name
alter table public.product_images
  add column if not exists color_name text;

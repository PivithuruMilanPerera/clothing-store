export const MAX_MAIN_CATEGORIES = 8;

export type StoreCategory = {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
};

export type CategoryTreeNode = StoreCategory & {
  children: CategoryTreeNode[];
};

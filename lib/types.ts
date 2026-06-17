export type Product = {
  id: string;
  brand: string;
  name: string;
  price: number;
  image: string;
  href: string;
  badge?: string;
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

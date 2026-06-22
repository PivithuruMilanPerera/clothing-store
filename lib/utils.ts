export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type FormatPriceOptions = {
  decimals?: number;
};

export function formatPrice(value: number, options: FormatPriceOptions = {}) {
  const decimals = options.decimals ?? 2;

  return `Rs. ${new Intl.NumberFormat("en-LK", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)}`;
}

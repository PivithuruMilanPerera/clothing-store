export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type FormatPriceOptions = {
  decimals?: number;
};

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatPrice(value: number, options: FormatPriceOptions = {}) {
  const decimals = options.decimals ?? 2;

  return `Rs. ${new Intl.NumberFormat("en-LK", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)}`;
}

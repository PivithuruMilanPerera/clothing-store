export const COUNTRIES = [
  { code: "LK", name: "Sri Lanka" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "AU", name: "Australia" },
  { code: "CA", name: "Canada" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "SG", name: "Singapore" },
  { code: "IN", name: "India" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "NZ", name: "New Zealand" },
  { code: "IT", name: "Italy" },
  { code: "JP", name: "Japan" },
  { code: "MY", name: "Malaysia" },
  { code: "MV", name: "Maldives" },
];

export const SRI_LANKA_PROVINCES = [
  "Western Province",
  "Central Province",
  "Southern Province",
  "North Western Province",
  "Sabaragamuwa Province",
  "Eastern Province",
  "Northern Province",
  "North Central Province",
  "Uva Province",
];

export const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut",
  "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
  "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan",
  "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire",
  "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma",
  "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee",
  "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming",
];

export function calculateShipping(subtotal: number): number {
  if (subtotal <= 0) return 0;
  // Free standard shipping on orders over Rs. 5000 (or flat Rs. 350 standard shipping)
  return subtotal >= 5000 ? 0 : 350;
}

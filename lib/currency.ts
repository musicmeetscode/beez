import { convertCurrency, FALLBACK_RATES } from "./currency-exchange";

export const currencies = [
  { code: "UGX", label: "Ugandan shilling" },
  { code: "USD", label: "US dollar" },
  { code: "EUR", label: "Euro" },
  { code: "GBP", label: "British pound" },
  { code: "KES", label: "Kenyan shilling" },
  { code: "TZS", label: "Tanzanian shilling" },
  { code: "RWF", label: "Rwandan franc" },
  { code: "ZAR", label: "South African rand" },
] as const;

export { convertCurrency, FALLBACK_RATES };

export function formatCurrency(amount: number, currency = "USD") {
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency,
      maximumFractionDigits:
        currency === "UGX" || currency === "RWF" || currency === "TZS" ? 0 : 2,
    }).format(Number.isFinite(amount) ? amount : 0);
  } catch {
    return `${currency} ${(Number.isFinite(amount) ? amount : 0).toLocaleString()}`;
  }
}

/**
 * Converts amount from fromCurrency to toCurrency and formats it in toCurrency.
 */
export function formatConvertedCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates?: Record<string, number>,
) {
  const converted = convertCurrency(amount, fromCurrency, toCurrency, rates);
  return formatCurrency(converted, toCurrency);
}

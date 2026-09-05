// Free open currency exchange service without API keys
// Provider: https://open.er-api.com/v6/latest/USD

const CACHE_KEY = "beez_exchange_rates_v1";
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

// Sensible offline fallback rates relative to USD (base: 1 USD)
export const FALLBACK_RATES: Record<string, number> = {
  USD: 1,
  UGX: 3716.89,
  EUR: 0.86,
  GBP: 0.74,
  KES: 129.38,
  TZS: 2641.56,
  RWF: 1476.18,
  ZAR: 15.96,
  CAD: 1.38,
  AUD: 1.38,
  JPY: 156.15,
  CNY: 6.72,
  INR: 94.51,
  NGN: 1324.2,
  GHS: 11.36,
};

export interface ExchangeRatesData {
  base: string;
  rates: Record<string, number>;
  timestamp: number;
}

let memoryRates: ExchangeRatesData | null = null;

function getStoredRates(): ExchangeRatesData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed.rates === "object" &&
      typeof parsed.timestamp === "number"
    ) {
      return parsed;
    }
  } catch {
    // Ignore localStorage parse errors
  }
  return null;
}

function setStoredRates(data: ExchangeRatesData) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage quota errors
  }
}

export function getCachedRates(): ExchangeRatesData {
  if (memoryRates) return memoryRates;
  const stored = getStoredRates();
  if (stored) {
    memoryRates = stored;
    return stored;
  }
  return {
    base: "USD",
    rates: FALLBACK_RATES,
    timestamp: 0,
  };
}

export async function fetchExchangeRates(): Promise<ExchangeRatesData> {
  const cached = getStoredRates();
  const now = Date.now();

  // If cache is fresh, return it
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    memoryRates = cached;
    return cached;
  }

  try {
    const response = await fetch("https://open.er-api.com/v6/latest/USD");
    if (!response.ok) {
      throw new Error(`Failed to fetch exchange rates: ${response.statusText}`);
    }
    const json = await response.json();
    if (json && json.result === "success" && json.rates) {
      const data: ExchangeRatesData = {
        base: json.base_code || "USD",
        rates: { ...FALLBACK_RATES, ...json.rates },
        timestamp: now,
      };
      memoryRates = data;
      setStoredRates(data);
      return data;
    }
  } catch (error) {
    console.warn("Using cached/fallback exchange rates due to error:", error);
  }

  return (
    cached || {
      base: "USD",
      rates: FALLBACK_RATES,
      timestamp: 0,
    }
  );
}

/**
 * Converts an amount from one currency to another using exchange rates.
 * Both currencies are compared against USD base.
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: Record<string, number> = memoryRates?.rates || FALLBACK_RATES,
): number {
  if (!Number.isFinite(amount) || amount === 0) return 0;
  const from = fromCurrency.toUpperCase();
  const to = toCurrency.toUpperCase();

  if (from === to) return amount;

  const fromRate = rates[from] ?? FALLBACK_RATES[from] ?? 1;
  const toRate = rates[to] ?? FALLBACK_RATES[to] ?? 1;

  // Convert from source currency to USD, then from USD to target currency
  const amountInUSD = amount / fromRate;
  const converted = amountInUSD * toRate;

  return converted;
}

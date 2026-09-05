"use client";

import { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import {
  fetchExchangeRates,
  getCachedRates,
  convertCurrency as convertCurrencyFn,
  FALLBACK_RATES,
  type ExchangeRatesData,
} from "@/lib/currency-exchange";
import { formatCurrency } from "@/lib/currency";

interface CurrencyContextValue {
  rates: Record<string, number>;
  loading: boolean;
  lastUpdated: number;
  convert: (amount: number, fromCurrency: string, toCurrency: string) => number;
  formatConverted: (amount: number, fromCurrency: string, toCurrency: string) => string;
  refreshRates: () => Promise<void>;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [ratesData, setRatesData] = useState<ExchangeRatesData>(() => getCachedRates());
  const [loading, setLoading] = useState(false);

  const loadRates = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchExchangeRates();
      setRatesData(data);
    } catch {
      // Ignore background fetch failures
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRates();
  }, [loadRates]);

  const convert = useCallback(
    (amount: number, fromCurrency: string, toCurrency: string) => {
      return convertCurrencyFn(amount, fromCurrency, toCurrency, ratesData.rates);
    },
    [ratesData.rates],
  );

  const formatConverted = useCallback(
    (amount: number, fromCurrency: string, toCurrency: string) => {
      const converted = convertCurrencyFn(amount, fromCurrency, toCurrency, ratesData.rates);
      return formatCurrency(converted, toCurrency);
    },
    [ratesData.rates],
  );

  const value = useMemo(
    () => ({
      rates: ratesData.rates,
      loading,
      lastUpdated: ratesData.timestamp,
      convert,
      formatConverted,
      refreshRates: loadRates,
    }),
    [ratesData.rates, ratesData.timestamp, loading, convert, formatConverted, loadRates],
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrencyExchange() {
  const context = useContext(CurrencyContext);
  if (!context) {
    // Fallback if used outside provider
    return {
      rates: FALLBACK_RATES,
      loading: false,
      lastUpdated: 0,
      convert: (amount: number, from: string, to: string) =>
        convertCurrencyFn(amount, from, to, FALLBACK_RATES),
      formatConverted: (amount: number, from: string, to: string) => {
        const converted = convertCurrencyFn(amount, from, to, FALLBACK_RATES);
        return formatCurrency(converted, to);
      },
      refreshRates: async () => { },
    };
  }
  return context;
}


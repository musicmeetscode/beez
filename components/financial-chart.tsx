"use client";

import { useState, useMemo, useCallback } from "react";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { formatCurrency } from "@/lib/currency";
import { useCurrencyExchange } from "@/contexts/currency-context";
import type { Business, Expense, Invoice, PaymentTransaction } from "@/lib/types";
import { Card, CardContent, CardHeader } from "./ui/card";

interface FinancialChartProps {
  invoices: Invoice[];
  transactions: PaymentTransaction[];
  expenses: Expense[];
  businesses: Business[];
  targetCurrency: string;
}

export function FinancialChart({
  invoices,
  transactions,
  expenses,
  businesses,
  targetCurrency,
}: FinancialChartProps) {
  const { convert } = useCurrencyExchange();
  const [period, setPeriod] = useState<"6m" | "12m">("6m");
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const currencyForBusiness = useCallback(
    (id: string) => {
      return businesses.find((b) => b.id === id)?.currency || "USD";
    },
    [businesses],
  );

  const monthsCount = period === "6m" ? 6 : 12;

  const data = useMemo(() => {
    const now = new Date();
    const buckets = Array.from({ length: monthsCount }).map((_, idx) => {
      const d = subMonths(now, monthsCount - 1 - idx);
      const start = startOfMonth(d);
      const end = endOfMonth(d);
      return {
        start,
        end,
        label: format(d, "MMM"),
        fullLabel: format(d, "MMMM yyyy"),
        income: 0,
        expenses: 0,
        invoiced: 0,
      };
    });

    for (const t of transactions) {
      const pDate = t.paymentDate?.toDate?.();
      if (!pDate) continue;
      const bucket = buckets.find((b) => pDate >= b.start && pDate <= b.end);
      if (bucket) {
        const cur = currencyForBusiness(t.businessId);
        bucket.income += convert(t.amount, cur, targetCurrency);
      }
    }

    for (const e of expenses) {
      const eDate = e.startsOn?.toDate?.();
      if (!eDate) continue;
      const bucket = buckets.find((b) => eDate >= b.start && eDate <= b.end);
      if (bucket) {
        bucket.expenses += convert(e.amount, e.currency, targetCurrency);
      }
    }

    for (const inv of invoices) {
      const iDate = inv.issueDate?.toDate?.();
      if (!iDate) continue;
      const bucket = buckets.find((b) => iDate >= b.start && iDate <= b.end);
      if (bucket) {
        const cur = currencyForBusiness(inv.businessId);
        bucket.invoiced += convert(inv.totalAmount, cur, targetCurrency);
      }
    }

    return buckets;
  }, [invoices, transactions, expenses, currencyForBusiness, targetCurrency, monthsCount, convert]);

  const totals = useMemo(() => {
    return data.reduce(
      (acc, b) => ({
        income: acc.income + b.income,
        expenses: acc.expenses + b.expenses,
        invoiced: acc.invoiced + b.invoiced,
      }),
      { income: 0, expenses: 0, invoiced: 0 },
    );
  }, [data]);

  // Chart coordinates calculation
  const width = 640;
  const height = 260;
  const padding = { top: 25, right: 25, bottom: 40, left: 60 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const maxValue = useMemo(() => {
    const maxVal = Math.max(
      ...data.flatMap((b) => [b.income, b.expenses, b.invoiced]),
      100,
    );
    // Round up to nice number
    const magnitude = Math.pow(10, Math.floor(Math.log10(maxVal)));
    return Math.ceil((maxVal * 1.15) / magnitude) * magnitude;
  }, [data]);

  const getX = (idx: number) => {
    if (data.length <= 1) return padding.left + chartW / 2;
    return padding.left + (idx / (data.length - 1)) * chartW;
  };

  const getY = (val: number) => {
    const clamped = Math.max(0, val);
    return padding.top + chartH - (clamped / maxValue) * chartH;
  };

  const incomePoints = data.map((b, idx) => `${getX(idx)},${getY(b.income)}`).join(" ");
  const expensePoints = data.map((b, idx) => `${getX(idx)},${getY(b.expenses)}`).join(" ");
  const invoicedPoints = data.map((b, idx) => `${getX(idx)},${getY(b.invoiced)}`).join(" ");

  // Y-axis grid ticks (4 intervals)
  const yTicks = [0, maxValue * 0.33, maxValue * 0.66, maxValue];

  const formatShort = (num: number) => {
    if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(0)}k`;
    return num.toFixed(0);
  };

  const hoveredBucket = hoveredIdx !== null ? data[hoveredIdx] : null;

  return (
    <Card className="h-full flex flex-col justify-between overflow-hidden">
      <CardHeader className="flex flex-col gap-3 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-base">Financial trends</h2>
            <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
              {targetCurrency}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-[var(--muted)]">
            Income vs Expenses vs Invoiced billing
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-xl bg-[var(--surface-2)] p-1 self-start sm:self-auto">
          <button
            onClick={() => setPeriod("6m")}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${period === "6m"
                ? "bg-white text-[var(--foreground)] shadow-xs"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
          >
            6 Months
          </button>
          <button
            onClick={() => setPeriod("12m")}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${period === "12m"
                ? "bg-white text-[var(--foreground)] shadow-xs"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
          >
            12 Months
          </button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-1">
        {/* Legend & Period Summary */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-medium border-b border-[var(--border)] pb-3">
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-emerald-500" />
            <span className="text-[var(--muted)]">Income:</span>
            <span className="font-semibold text-foreground">
              {formatCurrency(totals.income, targetCurrency)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-rose-500" />
            <span className="text-[var(--muted)]">Expenses:</span>
            <span className="font-semibold text-foreground">
              {formatCurrency(totals.expenses, targetCurrency)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-blue-500" />
            <span className="text-[var(--muted)]">Invoiced:</span>
            <span className="font-semibold text-foreground">
              {formatCurrency(totals.invoiced, targetCurrency)}
            </span>
          </div>
        </div>

        {/* SVG Chart */}
        <div className="relative w-full overflow-hidden">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto overflow-visible select-none"
            onMouseLeave={() => setHoveredIdx(null)}
          >
            <defs>
              <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Y-axis grid lines & labels */}
            {yTicks.map((val, idx) => {
              const y = getY(val);
              return (
                <g key={idx}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={width - padding.right}
                    y2={y}
                    stroke="var(--border)"
                    strokeDasharray={idx === 0 ? "none" : "3 3"}
                    strokeWidth={idx === 0 ? 1.5 : 1}
                    opacity={0.65}
                  />
                  <text
                    x={padding.left - 8}
                    y={y + 3.5}
                    textAnchor="end"
                    className="text-[10px] fill-[var(--muted)] font-medium"
                  >
                    {formatShort(val)}
                  </text>
                </g>
              );
            })}

            {/* X-axis labels */}
            {data.map((b, idx) => {
              const x = getX(idx);
              const isHovered = hoveredIdx === idx;
              return (
                <text
                  key={idx}
                  x={x}
                  y={height - padding.bottom + 20}
                  textAnchor="middle"
                  className={`text-[11px] transition font-medium ${isHovered
                      ? "fill-[var(--foreground)] font-bold"
                      : "fill-[var(--muted)]"
                    }`}
                >
                  {b.label}
                </text>
              );
            })}

            {/* Invoiced Line (Blue) */}
            <polyline
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={invoicedPoints}
            />

            {/* Expenses Line (Rose) */}
            <polyline
              fill="none"
              stroke="#f43f5e"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={expensePoints}
            />

            {/* Income Line (Emerald) */}
            <polyline
              fill="none"
              stroke="#10b981"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={incomePoints}
            />

            {/* Data point circles and hover overlay columns */}
            {data.map((b, idx) => {
              const x = getX(idx);
              const colW = chartW / data.length;
              const isHovered = hoveredIdx === idx;

              return (
                <g key={idx}>
                  {/* Hover vertical guide line */}
                  {isHovered && (
                    <line
                      x1={x}
                      y1={padding.top}
                      x2={x}
                      y2={height - padding.bottom}
                      stroke="var(--foreground)"
                      strokeDasharray="2 2"
                      strokeWidth={1.5}
                      opacity={0.4}
                    />
                  )}

                  {/* Circles */}
                  <circle
                    cx={x}
                    cy={getY(b.invoiced)}
                    r={isHovered ? 5 : 3.5}
                    fill="#3b82f6"
                    stroke="#ffffff"
                    strokeWidth={2}
                  />
                  <circle
                    cx={x}
                    cy={getY(b.expenses)}
                    r={isHovered ? 5 : 3.5}
                    fill="#f43f5e"
                    stroke="#ffffff"
                    strokeWidth={2}
                  />
                  <circle
                    cx={x}
                    cy={getY(b.income)}
                    r={isHovered ? 6 : 4}
                    fill="#10b981"
                    stroke="#ffffff"
                    strokeWidth={2.5}
                  />

                  {/* Invisible broad column for hover detection */}
                  <rect
                    x={x - colW / 2}
                    y={padding.top}
                    width={colW}
                    height={chartH}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredIdx(idx)}
                  />
                </g>
              );
            })}
          </svg>

          {/* Interactive Tooltip Card */}
          {hoveredBucket && (
            <div
              className="pointer-events-none absolute top-2 rounded-xl border border-[var(--border)] bg-white/95 p-3 shadow-lg backdrop-blur-md transition-all text-xs z-20 min-w-[170px]"
              style={{
                left: `${Math.min(
                  Math.max(10, ((hoveredIdx! / (data.length - 1)) * 100)),
                  75,
                )}%`,
              }}
            >
              <p className="font-semibold text-foreground border-b border-[var(--border)] pb-1 mb-1.5">
                {hoveredBucket.fullLabel}
              </p>
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-3 text-emerald-700">
                  <span className="flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    Income:
                  </span>
                  <span className="font-semibold">
                    {formatCurrency(hoveredBucket.income, targetCurrency)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 text-rose-700">
                  <span className="flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-rose-500" />
                    Expenses:
                  </span>
                  <span className="font-semibold">
                    {formatCurrency(hoveredBucket.expenses, targetCurrency)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 text-blue-700">
                  <span className="flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-blue-500" />
                    Invoiced:
                  </span>
                  <span className="font-semibold">
                    {formatCurrency(hoveredBucket.invoiced, targetCurrency)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-[var(--border)] pt-1 mt-1 font-semibold text-foreground">
                  <span>Net margin:</span>
                  <span className={hoveredBucket.income - hoveredBucket.expenses >= 0 ? "text-emerald-700" : "text-rose-700"}>
                    {formatCurrency(hoveredBucket.income - hoveredBucket.expenses, targetCurrency)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import {
  CalendarDays,
  Plus,
  Repeat2,
  TrendingDown,
  Trash2,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { Timestamp } from "firebase/firestore";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { useBusiness } from "@/contexts/business-context";
import { useCurrencyExchange } from "@/contexts/currency-context";
import {
  createExpense,
  createRecurringExpenseSeries,
  deleteExpense,
  generateMissingRecurringRecords,
} from "@/lib/data";
import { expenseAmountInMonth, nextOccurrence } from "@/lib/expenses";
import { formatCurrency } from "@/lib/currency";
import type { Expense } from "@/lib/types";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Skeleton } from "./ui/skeleton";
import { Switch } from "./ui/switch";
import { CurrencySelect } from "./currency-select";
import { EmptyState } from "./empty-state";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

const schema = z
  .object({
    name: z.string().min(2, "Enter an expense name"),
    category: z.string().min(2, "Enter a category"),
    amount: z.coerce.number().positive("Enter an amount greater than zero"),
    currency: z.string().length(3),
    startsOn: z.string().min(1, "Choose a start date"),
    isRecurring: z.boolean(),
    recurringInterval: z.enum(["weekly", "monthly", "yearly"]).nullable(),
    occurrences: z.coerce.number().min(1).max(60).default(12),
  })
  .refine((value) => !value.isRecurring || value.recurringInterval, {
    path: ["recurringInterval"],
    message: "Choose how often this repeats",
  });
type Form = z.infer<typeof schema>;

export function ExpensesView({
  expenses,
  targetCurrency: propTargetCurrency,
  loading,
}: {
  expenses: Expense[];
  targetCurrency?: string;
  loading: boolean;
}) {
  const { user } = useAuth();
  const { activeBusiness, businesses } = useBusiness();
  const { convert } = useCurrencyExchange();
  const [migrating, setMigrating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const targetCurrency =
    propTargetCurrency ||
    activeBusiness?.currency ||
    businesses[0]?.currency ||
    "USD";

  const totalLifetimeExpenses = useMemo(() => {
    return expenses.reduce((sum, expense) => {
      return sum + convert(expense.amount, expense.currency, targetCurrency);
    }, 0);
  }, [expenses, convert, targetCurrency]);

  const legacyRecurring = useMemo(() => {
    return expenses.filter(
      (e) => e.isRecurring && !e.recurringGroupId && Boolean(e.recurringInterval),
    );
  }, [expenses]);

  const handleGenerateAllRecords = async () => {
    if (!user || migrating) return;
    setMigrating(true);
    try {
      for (const legacy of legacyRecurring) {
        await generateMissingRecurringRecords(user.uid, legacy, 12);
      }
      toast.success(
        `Generated scheduled records for ${legacyRecurring.length} recurring expense(s)`,
      );
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Failed to generate records",
      );
    } finally {
      setMigrating(false);
    }
  };

  const handleDelete = async (
    expense: Expense,
    deleteAllSeries: boolean = false,
  ) => {
    try {
      setDeletingId(expense.id);
      await deleteExpense(expense.id, expense.recurringGroupId, deleteAllSeries);
      toast.success(
        deleteAllSeries
          ? "Recurring series deleted"
          : "Expense record deleted",
      );
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Could not delete expense",
      );
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-32" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-rise">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="mr-auto">
          <h2 className="text-xl font-semibold">Expenses</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Account-wide costs reflected in {targetCurrency} and deducted from net
            revenue.
          </p>
        </div>
        <ExpenseDialog targetCurrency={targetCurrency} />
      </div>

      {legacyRecurring.length > 0 && (
        <div className="flex flex-col gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 shrink-0 text-amber-600" size={18} />
            <div>
              <p className="font-semibold">
                Generate records for recurring expenses
              </p>
              <p className="mt-0.5 text-xs text-amber-800">
                You have {legacyRecurring.length} recurring expense(s) saved as
                single items. Generate individual records for all set times so each
                month has its own entry.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="shrink-0 border-amber-400 bg-white text-amber-900 hover:bg-amber-100"
            disabled={migrating}
            onClick={handleGenerateAllRecords}
          >
            <Sparkles size={15} />
            {migrating ? "Generating…" : "Generate all records"}
          </Button>
        </div>
      )}

      <Card className="overflow-hidden bg-[var(--dark)] text-white">
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
          <span className="grid size-12 place-items-center rounded-2xl bg-white/10 text-[var(--accent)]">
            <TrendingDown size={22} />
          </span>
          <div>
            <p className="text-sm text-[#aeb7b9]">
              Lifetime expenses ({targetCurrency})
            </p>
            <p className="mt-1 text-2xl font-semibold">
              {formatCurrency(totalLifetimeExpenses, targetCurrency)}
            </p>
          </div>
          <p className="max-w-md text-sm leading-6 text-[#aeb7b9] sm:ml-auto sm:text-right">
            All expenses recorded across your business converted to {targetCurrency} at live exchange rates.
          </p>
        </CardContent>
      </Card>

      {expenses.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {expenses.map((expense) => {
            const convertedAmount = convert(
              expense.amount,
              expense.currency,
              targetCurrency,
            );
            const isDifferentCurrency =
              expense.currency.toUpperCase() !== targetCurrency.toUpperCase();

            return (
              <Card key={expense.id} className="relative group">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <span className="grid size-11 place-items-center rounded-xl bg-[var(--surface-2)] shrink-0">
                      {expense.recurringGroupId || expense.isRecurring ? (
                        <Repeat2 size={18} />
                      ) : (
                        <CalendarDays size={18} />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate font-semibold text-[15px]">
                            {expense.name}
                          </h3>
                          <p className="mt-0.5 text-xs text-[var(--muted)]">
                            {expense.category}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-semibold">
                            {formatCurrency(convertedAmount, targetCurrency)}
                          </p>
                          {isDifferentCurrency && (
                            <p className="text-[11px] text-[var(--muted)]">
                              Orig:{" "}
                              {formatCurrency(
                                expense.amount,
                                expense.currency,
                              )}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {expense.recurringGroupId ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                            <Repeat2 size={12} />
                            #{expense.recurringIndex} of{" "}
                            {expense.recurringTotal || "?"} (
                            {expense.recurringInterval})
                          </span>
                        ) : expense.isRecurring ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                            <Repeat2 size={12} />
                            Repeats {expense.recurringInterval}
                          </span>
                        ) : null}

                        <p className="text-xs text-[var(--muted)]">
                          {format(expense.startsOn.toDate(), "dd MMM yyyy")}
                        </p>
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-[var(--border)] pt-3">
                        <p className="text-[11px] text-[var(--muted)]">
                          {expense.isRecurring && !expense.recurringGroupId
                            ? `${formatCurrency(
                              convert(
                                expenseAmountInMonth(expense),
                                expense.currency,
                                targetCurrency,
                              ),
                              targetCurrency,
                            )} in current month`
                            : "Scheduled expense"}
                        </p>

                        <div className="flex items-center gap-1">
                          {expense.recurringGroupId && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                              disabled={deletingId === expense.id}
                              onClick={() => {
                                if (
                                  confirm(
                                    `Delete all ${expense.recurringTotal || ""} scheduled records in this recurring series?`,
                                  )
                                ) {
                                  handleDelete(expense, true);
                                }
                              }}
                            >
                              Delete series
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-[var(--muted)] hover:bg-red-50 hover:text-red-600"
                            disabled={deletingId === expense.id}
                            aria-label="Delete this expense"
                            onClick={() => {
                              if (confirm("Delete this expense record?")) {
                                handleDelete(expense, false);
                              }
                            }}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No expenses yet"
          detail="Add one-time or recurring costs to see true net revenue."
          action={<ExpenseDialog targetCurrency={targetCurrency} />}
        />
      )}
    </div>
  );
}

function ExpenseDialog({ targetCurrency }: { targetCurrency?: string }) {
  const { user } = useAuth();
  const { businesses } = useBusiness();
  const [open, setOpen] = useState(false);
  const defaultCurr = targetCurrency || businesses[0]?.currency || "USD";

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Form>({
    resolver: zodResolver(schema) as Resolver<Form>,
    defaultValues: defaults(defaultCurr),
  });

  const recurring = watch("isRecurring");
  const recurringInterval = watch("recurringInterval");
  const occurrences = watch("occurrences") || 12;
  const startsOn = watch("startsOn");

  // Calculate schedule preview
  const schedulePreview = useMemo(() => {
    if (!recurring || !recurringInterval || !startsOn) return null;
    try {
      const startDate = new Date(`${startsOn}T12:00:00`);
      let endDate = startDate;
      for (let i = 1; i < occurrences; i++) {
        endDate = nextOccurrence(endDate, recurringInterval);
      }
      return {
        startDate,
        endDate,
        count: occurrences,
      };
    } catch {
      return null;
    }
  }, [recurring, recurringInterval, occurrences, startsOn]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus size={17} />
          New expense
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Add expense</DialogTitle>
        <DialogDescription>
          Expenses reflect across your business in {defaultCurr} and reduce
          dashboard net revenue.
        </DialogDescription>
        <form
          className="mt-6 grid gap-4"
          onSubmit={handleSubmit(async (values) => {
            if (!user) return;
            try {
              const amount = Number(values.amount);
              const startDate = Timestamp.fromDate(
                new Date(`${values.startsOn}T12:00:00`),
              );

              if (values.isRecurring && values.recurringInterval) {
                const count = Number(values.occurrences) || 12;
                await createRecurringExpenseSeries(
                  user.uid,
                  {
                    name: values.name,
                    category: values.category,
                    amount,
                    currency: values.currency,
                    startsOn: startDate,
                    isRecurring: false,
                    recurringInterval: values.recurringInterval,
                  },
                  count,
                );
                toast.success(
                  `Created ${count} recurring expense records for all set times`,
                );
              } else {
                await createExpense(user.uid, {
                  name: values.name,
                  category: values.category,
                  amount,
                  currency: values.currency,
                  startsOn: startDate,
                  isRecurring: false,
                  recurringInterval: null,
                });
                toast.success("Expense added");
              }

              reset(defaults(defaultCurr));
              setOpen(false);
            } catch (error) {
              toast.error(
                error instanceof Error
                  ? error.message
                  : "Could not add expense",
              );
            }
          })}
        >
          <Field label="Expense name" error={errors.name?.message}>
            <Input autoFocus placeholder="e.g. Server hosting, Rent" {...register("name")} />
          </Field>
          <Field label="Category" error={errors.category?.message}>
            <Input
              placeholder="Rent, software, transport…"
              {...register("category")}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Amount" error={errors.amount?.message}>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                {...register("amount")}
              />
            </Field>
            <Field label="Currency" error={errors.currency?.message}>
              <CurrencySelect
                value={watch("currency")}
                onValueChange={(value) =>
                  setValue("currency", value, { shouldValidate: true })
                }
              />
            </Field>
          </div>
          <Field
            label={recurring ? "Recurring starts on" : "Expense date"}
            error={errors.startsOn?.message}
          >
            <Input type="date" {...register("startsOn")} />
          </Field>
          <div className="rounded-2xl border border-[var(--border)] p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Recurring expense</p>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  Creates scheduled expense records for all the set times.
                </p>
              </div>
              <Switch
                checked={recurring}
                onCheckedChange={(value) => setValue("isRecurring", value)}
              />
            </div>
            {recurring && (
              <div className="mt-4 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium mb-1.5 text-[var(--muted)]">
                      Repeat every
                    </label>
                    <Select
                      value={watch("recurringInterval") || undefined}
                      onValueChange={(value) =>
                        setValue(
                          "recurringInterval",
                          value as Form["recurringInterval"],
                          { shouldValidate: true },
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Repeat every…" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Week</SelectItem>
                        <SelectItem value="monthly">Month</SelectItem>
                        <SelectItem value="yearly">Year</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.recurringInterval && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.recurringInterval.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1.5 text-[var(--muted)]">
                      Number of times to create
                    </label>
                    <Input
                      type="number"
                      min="1"
                      max="60"
                      {...register("occurrences")}
                      placeholder="e.g. 12"
                    />
                    {errors.occurrences && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.occurrences.message}
                      </p>
                    )}
                  </div>
                </div>

                {schedulePreview && (
                  <div className="rounded-xl bg-[var(--surface-2)] p-3 text-xs leading-relaxed text-[var(--muted)]">
                    <span className="font-semibold text-foreground">Schedule Preview: </span>
                    Will create{" "}
                    <strong className="text-foreground">{schedulePreview.count}</strong>{" "}
                    expense records from{" "}
                    <strong className="text-foreground">
                      {format(schedulePreview.startDate, "dd MMM yyyy")}
                    </strong>{" "}
                    to{" "}
                    <strong className="text-foreground">
                      {format(schedulePreview.endDate, "dd MMM yyyy")}
                    </strong>{" "}
                    (one for each {recurringInterval?.replace("ly", "")}).
                  </div>
                )}
              </div>
            )}
          </div>
          <Button disabled={isSubmitting}>
            {isSubmitting
              ? "Saving…"
              : recurring
                ? `Create ${occurrences || 12} expense records`
                : "Save expense"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function defaults(currency = "USD"): Form {
  return {
    name: "",
    category: "",
    amount: 0,
    currency,
    startsOn: new Date().toISOString().slice(0, 10),
    isRecurring: false,
    recurringInterval: null,
    occurrences: 12,
  };
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <div className="mt-1.5">{children}</div>
      {error && (
        <span className="mt-1 block text-xs text-red-600">{error}</span>
      )}
    </label>
  );
}

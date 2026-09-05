"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CalendarDays, Plus, Repeat2, TrendingDown } from "lucide-react";
import { Timestamp } from "firebase/firestore";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { useBusiness } from "@/contexts/business-context";
import { createExpense } from "@/lib/data";
import { expenseAmountInMonth } from "@/lib/expenses";
import { formatCurrency } from "@/lib/currency";
import type { Expense } from "@/lib/types";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader } from "./ui/card";
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
  })
  .refine((value) => !value.isRecurring || value.recurringInterval, {
    path: ["recurringInterval"],
    message: "Choose how often this repeats",
  });
type Form = z.infer<typeof schema>;

export function ExpensesView({
  expenses,
  loading,
}: {
  expenses: Expense[];
  loading: boolean;
}) {
  const projected = groupMonthlyExpenses(expenses);
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
            Account-wide costs are included in net revenue automatically.
          </p>
        </div>
        <ExpenseDialog />
      </div>

      <Card className="overflow-hidden bg-[var(--dark)] text-white">
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
          <span className="grid size-12 place-items-center rounded-2xl bg-white/10 text-[var(--accent)]">
            <TrendingDown size={22} />
          </span>
          <div>
            <p className="text-sm text-[#aeb7b9]">Projected this month</p>
            <p className="mt-1 text-2xl font-semibold">
              {projected.length
                ? projected
                    .map(([currency, total]) => formatCurrency(total, currency))
                    .join(" · ")
                : formatCurrency(0, "USD")}
            </p>
          </div>
          <p className="max-w-md text-sm leading-6 text-[#aeb7b9] sm:ml-auto sm:text-right">
            Includes upcoming recurring charges scheduled before the end of the
            month.
          </p>
        </CardContent>
      </Card>

      {expenses.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {expenses.map((expense) => (
            <Card key={expense.id}>
              <CardContent>
                <div className="flex items-start gap-3">
                  <span className="grid size-11 place-items-center rounded-xl bg-[var(--surface-2)]">
                    {expense.isRecurring ? (
                      <Repeat2 size={18} />
                    ) : (
                      <CalendarDays size={18} />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate font-semibold">
                          {expense.name}
                        </h3>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                          {expense.category}
                        </p>
                      </div>
                      <p className="whitespace-nowrap font-semibold">
                        {formatCurrency(expense.amount, expense.currency)}
                      </p>
                    </div>
                    <p className="mt-4 text-xs font-medium text-[var(--muted)]">
                      {expense.isRecurring
                        ? `Repeats ${expense.recurringInterval} from ${format(expense.startsOn.toDate(), "dd MMM yyyy")}`
                        : `Scheduled for ${format(expense.startsOn.toDate(), "dd MMM yyyy")}`}
                    </p>
                    {expense.isRecurring && (
                      <p className="mt-2 text-sm font-semibold">
                        {formatCurrency(
                          expenseAmountInMonth(expense),
                          expense.currency,
                        )}{" "}
                        projected this month
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No expenses yet"
          detail="Add one-time or recurring costs to see true net revenue."
          action={<ExpenseDialog />}
        />
      )}
    </div>
  );
}

function ExpenseDialog() {
  const { user } = useAuth();
  const { businesses } = useBusiness();
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Form>({
    resolver: zodResolver(schema) as Resolver<Form>,
    defaultValues: defaults(businesses[0]?.currency),
  });
  const recurring = watch("isRecurring");
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
          Expenses apply across your account and reduce dashboard net revenue.
        </DialogDescription>
        <form
          className="mt-6 grid gap-4"
          onSubmit={handleSubmit(async (values) => {
            if (!user) return;
            try {
              await createExpense(user.uid, {
                ...values,
                amount: Number(values.amount),
                startsOn: Timestamp.fromDate(
                  new Date(`${values.startsOn}T12:00:00`),
                ),
                recurringInterval: values.isRecurring
                  ? values.recurringInterval
                  : null,
              });
              toast.success("Expense added");
              reset(defaults(businesses[0]?.currency));
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
            <Input autoFocus {...register("name")} />
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
                  Future occurrences are deducted before they are due.
                </p>
              </div>
              <Switch
                checked={recurring}
                onCheckedChange={(value) => setValue("isRecurring", value)}
              />
            </div>
            {recurring && (
              <div className="mt-4">
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
            )}
          </div>
          <Button disabled={isSubmitting}>Save expense</Button>
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
  };
}

function groupMonthlyExpenses(expenses: Expense[]) {
  const totals = new Map<string, number>();
  for (const expense of expenses) {
    totals.set(
      expense.currency,
      (totals.get(expense.currency) || 0) + expenseAmountInMonth(expense),
    );
  }
  return Array.from(totals).filter(([, total]) => total > 0);
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

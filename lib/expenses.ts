import {
  addMonths,
  addWeeks,
  addYears,
  endOfMonth,
  startOfMonth,
} from "date-fns";
import type { Expense, RecurringInterval } from "./types";

export function nextOccurrence(
  date: Date,
  interval: Exclude<RecurringInterval, null>,
): Date {
  if (interval === "weekly") return addWeeks(date, 1);
  if (interval === "monthly") return addMonths(date, 1);
  return addYears(date, 1);
}

export function expenseAmountInMonth(expense: Expense, month = new Date()) {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const startsOn = expense.startsOn.toDate();

  // If this is an individual scheduled occurrence or one-time expense
  if (!expense.isRecurring || expense.recurringGroupId) {
    return startsOn >= monthStart && startsOn <= monthEnd ? expense.amount : 0;
  }

  // Legacy fallback for standalone recurring definitions that haven't generated records
  if (!expense.recurringInterval || startsOn > monthEnd) return 0;

  let occurrence = startsOn;
  let count = 0;
  let guard = 0;
  while (occurrence <= monthEnd && guard < 10000) {
    if (occurrence >= monthStart) count += 1;
    occurrence = nextOccurrence(occurrence, expense.recurringInterval);
    guard += 1;
  }
  return count * expense.amount;
}

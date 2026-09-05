import {
  addMonths,
  addWeeks,
  addYears,
  endOfMonth,
  startOfMonth,
} from "date-fns";
import type { Expense } from "./types";

export function expenseAmountInMonth(expense: Expense, month = new Date()) {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const startsOn = expense.startsOn.toDate();

  if (!expense.isRecurring) {
    return startsOn >= monthStart && startsOn <= monthEnd ? expense.amount : 0;
  }
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

function nextOccurrence(
  date: Date,
  interval: Exclude<Expense["recurringInterval"], null>,
) {
  if (interval === "weekly") return addWeeks(date, 1);
  if (interval === "monthly") return addMonths(date, 1);
  return addYears(date, 1);
}

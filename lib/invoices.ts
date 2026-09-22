import { Timestamp } from "firebase/firestore";
import { createInvoice, updateInvoice } from "./data";
import { nextOccurrence } from "./expenses";
import type { Invoice } from "./types";

const MAX_CATCH_UP_PER_SERIES = 24;

function nextInvoiceOccurrence(invoice: Invoice) {
  if (!invoice.recurringInterval) return null;
  const issueDate = nextOccurrence(
    invoice.issueDate.toDate(),
    invoice.recurringInterval,
  );
  const dueDelta =
    invoice.dueDate.toDate().getTime() - invoice.issueDate.toDate().getTime();
  return { issueDate, dueDate: new Date(issueDate.getTime() + dueDelta) };
}

/**
 * Client-side "catch up": for each recurring invoice series, generates any
 * real invoice documents whose date has arrived but haven't been created yet.
 * No future documents are pre-generated — only what's due by `now`. Safe to
 * call repeatedly; it only creates what's missing.
 */
export async function materializeDueRecurringInvoices(invoices: Invoice[]) {
  const recurring = invoices.filter(
    (invoice) => invoice.isRecurring && invoice.recurringInterval,
  );
  if (!recurring.length) return;

  const bySeries = new Map<string, Invoice[]>();
  for (const invoice of recurring) {
    const groupId = invoice.recurringGroupId || invoice.id;
    const list = bySeries.get(groupId) || [];
    list.push(invoice);
    bySeries.set(groupId, list);
  }

  const now = new Date();
  for (const [groupId, series] of bySeries) {
    const latest = series.reduce((a, b) =>
      a.issueDate.toMillis() > b.issueDate.toMillis() ? a : b,
    );
    if (!latest.recurringInterval) continue;

    if (!latest.recurringGroupId) {
      await updateInvoice(latest.id, { recurringGroupId: groupId });
    }

    let cursor = latest;
    let next = nextInvoiceOccurrence(cursor);
    let guard = 0;
    while (next && next.issueDate <= now && guard < MAX_CATCH_UP_PER_SERIES) {
      const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}${
        guard ? `-${guard}` : ""
      }`;
      await createInvoice(latest.businessId, {
        clientId: latest.clientId,
        invoiceNumber,
        status: "Sent",
        items: latest.items,
        subtotal: latest.subtotal,
        taxRate: latest.taxRate,
        totalAmount: latest.totalAmount,
        amountPaid: 0,
        balanceDue: latest.totalAmount,
        issueDate: Timestamp.fromDate(next.issueDate),
        dueDate: Timestamp.fromDate(next.dueDate),
        isRecurring: true,
        recurringInterval: latest.recurringInterval,
        recurringGroupId: groupId,
      });
      cursor = {
        ...cursor,
        issueDate: Timestamp.fromDate(next.issueDate),
        dueDate: Timestamp.fromDate(next.dueDate),
      };
      next = nextInvoiceOccurrence(cursor);
      guard++;
    }
  }
}

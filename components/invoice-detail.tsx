"use client";
import { useState } from "react";
import { format } from "date-fns";
import { ArrowLeft, Download, Pencil, Receipt, Trash2 } from "lucide-react";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { recordPayment } from "@/lib/data";
import { formatCurrency } from "@/lib/currency";
import { useCurrencyExchange } from "@/contexts/currency-context";
import { downloadInvoicePdf, downloadReceiptPdf } from "@/lib/invoice-pdf";
import type {
  Business,
  Client,
  Invoice,
  PaymentTransaction,
} from "@/lib/types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent } from "./ui/card";
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
const schema = z.object({
  amount: z.coerce.number().positive(),
  paymentMethod: z.string().min(1),
  reference: z.string(),
  paymentDate: z.string().min(1),
});
type Form = z.infer<typeof schema>;
export function InvoiceDetail({
  invoice,
  business,
  client,
  transactions,
  targetCurrency,
  onBack,
  onEdit,
  onDelete,
}: {
  invoice: Invoice;
  business?: Business;
  client?: Client;
  transactions: PaymentTransaction[];
  targetCurrency?: string;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { convert } = useCurrencyExchange();
  const currency = business?.currency || "USD";
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { isSubmitting, errors },
  } = useForm<Form>({
    resolver: zodResolver(schema) as Resolver<Form>,
    defaultValues: {
      amount: invoice.balanceDue,
      paymentMethod: "Bank transfer",
      reference: "",
      paymentDate: new Date().toISOString().slice(0, 10),
    },
  });
  return (
    <div className="space-y-5 animate-rise">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Back to invoices"
          onClick={onBack}
        >
          <ArrowLeft size={19} />
        </Button>
        <div className="mr-auto">
          <p className="text-sm text-[var(--muted)]">Invoice</p>
          <h2 className="text-xl font-semibold">{invoice.invoiceNumber}</h2>
        </div>
        {business && (
          <Button
            variant="outline"
            onClick={async () => {
              try {
                await downloadInvoicePdf(
                  invoice,
                  business,
                  client,
                  transactions,
                );
              } catch {
                toast.error("Could not generate PDF");
              }
            }}
          >
            <Download size={17} />
            Download PDF
          </Button>
        )}
        <Button variant="outline" onClick={onEdit}>
          <Pencil size={17} />
          Edit
        </Button>
        <Button
          variant="outline"
          className="text-red-600 hover:bg-red-50 hover:text-red-700"
          onClick={() => {
            if (
              confirm(
                `Delete invoice ${invoice.invoiceNumber}? This cannot be undone.`,
              )
            ) {
              onDelete();
            }
          }}
        >
          <Trash2 size={17} />
          Delete
        </Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button disabled={invoice.balanceDue <= 0}>
              <Receipt size={17} />
              Record payment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>Record payment</DialogTitle>
            <DialogDescription>
              Updates the invoice balance and creates a receipt transaction
              atomically.
            </DialogDescription>
            <form
              className="mt-6 space-y-4"
              onSubmit={handleSubmit(async (v) => {
                try {
                  const transaction = await recordPayment(invoice, {
                    ...v,
                    paymentDate: new Date(`${v.paymentDate}T12:00:00`),
                  });
                  toast.success("Payment recorded");
                  if (business) {
                    try {
                      await downloadReceiptPdf(
                        invoice,
                        business,
                        client,
                        transaction,
                        invoice.balanceDue - transaction.amount,
                      );
                    } catch {
                      toast.error(
                        "Payment saved, but the receipt could not be downloaded",
                      );
                    }
                  }
                  reset();
                  setOpen(false);
                  onBack();
                } catch (e) {
                  toast.error(
                    e instanceof Error ? e.message : "Could not record payment",
                  );
                }
              })}
            >
              <label className="block text-sm font-medium">
                Amount
                <Input
                  className="mt-1.5"
                  type="number"
                  step="0.01"
                  max={invoice.balanceDue}
                  {...register("amount")}
                />
                {errors.amount && (
                  <span className="text-xs text-red-600">
                    Enter a valid amount
                  </span>
                )}
              </label>
              <label className="block text-sm font-medium">
                Method
                <Select
                  defaultValue="Bank transfer"
                  onValueChange={(v) => setValue("paymentMethod", v)}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      "Bank transfer",
                      "Cash",
                      "Card",
                      "Mobile money",
                      "Cheque",
                    ].map((v) => (
                      <SelectItem key={v} value={v}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
              <label className="block text-sm font-medium">
                Reference
                <Input className="mt-1.5" {...register("reference")} />
              </label>
              <label className="block text-sm font-medium">
                Payment date
                <Input
                  className="mt-1.5"
                  type="date"
                  {...register("paymentDate")}
                />
              </label>
              <Button className="w-full" disabled={isSubmitting}>
                Save payment
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <Card className="overflow-hidden">
        <div className="flex flex-col justify-between gap-6 bg-[var(--dark)] p-6 text-white md:flex-row">
          <div>
            {business?.logoUrl && (
              <img
                src={business.logoUrl}
                alt={`${business.name} logo`}
                className="mb-4 h-10 max-w-32 object-contain object-left"
              />
            )}
            <p className="text-xl font-semibold">{business?.name}</p>
            <p className="mt-2 max-w-lg whitespace-pre-line text-sm leading-6 text-[#aeb7b9]">
              {business?.paymentInstructions}
            </p>
          </div>
          <div className="md:text-right">
            <p className="text-xs font-semibold uppercase tracking-[.14em] text-[var(--accent)]">
              Balance due
            </p>
            <p className="mt-2 text-3xl font-semibold">
              {formatCurrency(invoice.balanceDue, currency)}
            </p>
            {targetCurrency && targetCurrency.toUpperCase() !== currency.toUpperCase() && (
              <p className="mt-1 text-xs font-medium text-[#aeb7b9]">
                ≈ {formatCurrency(convert(invoice.balanceDue, currency, targetCurrency), targetCurrency)} ({targetCurrency})
              </p>
            )}
          </div>
        </div>
        <CardContent className="p-5 md:p-7">
          <div className="grid gap-6 border-b border-[var(--border)] pb-6 md:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.1em] text-[var(--muted)]">
                Billed to
              </p>
              <p className="mt-2 font-semibold">
                {client?.name || "Deleted client"}
              </p>
              {client?.businessName && (
                <p className="mt-1 text-sm font-medium">
                  {client.businessName}
                </p>
              )}
              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                {client?.email}
                <br />
                {client?.phone}
                <br />
                {client?.businessAddress || client?.address}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 md:text-right">
              <div>
                <p className="text-xs text-[var(--muted)]">Issued</p>
                <p className="mt-1 text-sm font-medium">
                  {format(invoice.issueDate.toDate(), "dd MMM yyyy")}
                </p>
              </div>
              <div>
                <p className="text-xs text-[var(--muted)]">Due</p>
                <p className="mt-1 text-sm font-medium">
                  {format(invoice.dueDate.toDate(), "dd MMM yyyy")}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--muted)]">
                  <th className="pb-3 font-medium">Description</th>
                  <th className="pb-3 text-right font-medium">Qty</th>
                  <th className="pb-3 text-right font-medium">Rate</th>
                  <th className="pb-3 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((i, n) => (
                  <tr key={n} className="border-b border-[var(--border)]">
                    <td className="py-4 font-medium">{i.description}</td>
                    <td className="py-4 text-right">{i.quantity}</td>
                    <td className="py-4 text-right">
                      {formatCurrency(i.rate, currency)}
                    </td>
                    <td className="py-4 text-right font-semibold">
                      {formatCurrency(i.amount, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="ml-auto mt-6 w-full max-w-sm space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">Subtotal</span>
              <span>{formatCurrency(invoice.subtotal, currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">
                Tax ({invoice.taxRate}%)
              </span>
              <span>
                {formatCurrency(
                  invoice.totalAmount - invoice.subtotal,
                  currency,
                )}
              </span>
            </div>
            <div className="flex justify-between border-t border-[var(--border)] pt-3 text-lg font-semibold">
              <span>Total</span>
              <span>{formatCurrency(invoice.totalAmount, currency)}</span>
            </div>
            <div className="flex justify-between rounded-xl bg-[var(--accent)] p-3 font-semibold">
              <span>Balance due</span>
              <span>{formatCurrency(invoice.balanceDue, currency)}</span>
            </div>
          </div>
          {transactions.length > 0 && (
            <div className="mt-8 border-t border-[var(--border)] pt-6">
              <h3 className="font-semibold">Payment history</h3>
              <div className="mt-3 divide-y divide-[var(--border)]">
                {transactions.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between gap-3 py-3 text-sm"
                  >
                    <div>
                      <p className="font-medium">{t.paymentMethod}</p>
                      <p className="text-xs text-[var(--muted)]">
                        {format(t.paymentDate.toDate(), "dd MMM yyyy")}
                        {t.reference ? ` · ${t.reference}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="font-semibold">
                        {formatCurrency(t.amount, currency)}
                      </p>
                      {business && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            try {
                              await downloadReceiptPdf(
                                invoice,
                                business,
                                client,
                                t,
                              );
                            } catch {
                              toast.error("Could not generate receipt");
                            }
                          }}
                        >
                          <Download size={15} />
                          Receipt
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

"use client";
import { useEffect, useMemo, useState } from "react";
import { useFieldArray, useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronsUpDown, Plus, Trash2 } from "lucide-react";
import { Timestamp } from "firebase/firestore";
import { toast } from "sonner";
import { createInvoice } from "@/lib/data";
import { useBusiness } from "@/contexts/business-context";
import type { Client, InvoiceStatus, Product } from "@/lib/types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "./ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Command, CommandInput, CommandItem, CommandList } from "./ui/command";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Switch } from "./ui/switch";
import { ClientDialog, ProductDialog } from "./entity-dialogs";
const schema = z
  .object({
    clientId: z.string().min(1, "Choose a client"),
    issueDate: z.string().min(1),
    dueDate: z.string().min(1),
    taxRate: z.coerce.number().min(0).max(100),
    isRecurring: z.boolean(),
    recurringInterval: z.enum(["weekly", "monthly", "yearly"]).nullable(),
    items: z
      .array(
        z.object({
          productId: z.string().min(1, "Choose a product"),
          description: z.string().min(1, "Required"),
          quantity: z.coerce.number().positive(),
          rate: z.coerce.number().min(0),
        }),
      )
      .min(1),
  })
  .refine((v) => !v.isRecurring || v.recurringInterval, {
    path: ["recurringInterval"],
    message: "Choose an interval",
  });
type Form = z.infer<typeof schema>;
const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});
export function InvoiceComposer({
  open,
  onOpenChange,
  clients,
  products,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  clients: Client[];
  products: Product[];
}) {
  const { activeBusinessId, activeBusiness } = useBusiness();
  const [tone, setTone] = useState<InvoiceStatus>("Sent");
  const [clientOpen, setClientOpen] = useState(false);
  const [search, setSearch] = useState("");
  const today = new Date().toISOString().slice(0, 10);
  const due = new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10);
  const {
    register,
    control,
    watch,
    setValue,
    reset,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({
    resolver: zodResolver(schema) as Resolver<Form>,
    defaultValues: {
      clientId: "",
      issueDate: today,
      dueDate: due,
      taxRate: 0,
      isRecurring: false,
      recurringInterval: null,
      items: [{ productId: "", description: "", quantity: 1, rate: 0 }],
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const values = watch();
  const subtotal = useMemo(
    () =>
      values.items.reduce(
        (s, i) => s + (Number(i.quantity) || 0) * (Number(i.rate) || 0),
        0,
      ),
    [values.items],
  );
  const total = subtotal * (1 + (Number(values.taxRate) || 0) / 100);
  const client = clients.find((c) => c.id === values.clientId);
  const filtered = clients.filter((c) =>
    `${c.name} ${c.email}`.toLowerCase().includes(search.toLowerCase()),
  );
  useEffect(() => {
    if (!open) setSearch("");
  }, [open]);
  const save = handleSubmit(async (v) => {
    try {
      const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;
      await createInvoice(activeBusinessId, {
        clientId: v.clientId,
        invoiceNumber,
        status: tone,
        items: v.items.map((i) => ({ ...i, amount: i.quantity * i.rate })),
        subtotal,
        taxRate: v.taxRate,
        totalAmount: total,
        amountPaid: 0,
        balanceDue: total,
        issueDate: Timestamp.fromDate(new Date(`${v.issueDate}T12:00:00`)),
        dueDate: Timestamp.fromDate(new Date(`${v.dueDate}T12:00:00`)),
        isRecurring: v.isRecurring,
        recurringInterval: v.isRecurring ? v.recurringInterval : null,
      });
      toast.success(`${invoiceNumber} created`);
      reset();
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create invoice");
    }
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl p-0">
        <div className="border-b border-[var(--border)] p-6 pr-14">
          <DialogTitle>New invoice</DialogTitle>
          <DialogDescription>
            Create and send a precise invoice for {activeBusiness?.name}.
          </DialogDescription>
        </div>
        <form onSubmit={save}>
          <div className="grid max-h-[calc(90vh-164px)] overflow-y-auto lg:grid-cols-[1fr_320px]">
            <section className="space-y-6 p-5 md:p-7">
              <div className="rounded-2xl bg-[var(--dark)] p-5 text-white">
                <p className="text-xs font-semibold uppercase tracking-[.14em] text-[var(--accent)]">
                  From
                </p>
                <p className="mt-2 text-lg font-semibold">
                  {activeBusiness?.name}
                </p>
                <p className="mt-1 whitespace-pre-line text-sm leading-6 text-[#aeb7b9]">
                  {activeBusiness?.paymentInstructions ||
                    "Payment instructions can be added in Settings."}
                </p>
              </div>
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Line items</h3>
                    <p className="text-sm text-[var(--muted)]">
                      Choose a product, then adjust its invoice details if needed.
                    </p>
                  </div>
                  <ProductDialog
                    trigger={
                      <Button type="button" size="sm" variant="outline">
                        <Plus size={15} />
                        Product
                      </Button>
                    }
                  />
                </div>
                <div className="space-y-3">
                  {fields.map((f, index) => (
                    <div
                      key={f.id}
                      className="grid gap-2 rounded-2xl border border-[var(--border)] p-3 md:grid-cols-[1.2fr_1.5fr_88px_120px_44px]"
                    >
                      <Select
                        value={watch(`items.${index}.productId`) || undefined}
                        onValueChange={(id) => {
                          const p = products.find((x) => x.id === id);
                          if (p) {
                            setValue(`items.${index}.productId`, p.id);
                            setValue(
                              `items.${index}.description`,
                              p.description,
                            );
                            setValue(`items.${index}.rate`, p.rate);
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Product" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        aria-label="Description"
                        placeholder="Description"
                        {...register(`items.${index}.description`)}
                      />
                      <Input
                        aria-label="Quantity"
                        type="number"
                        min="0.01"
                        step="0.01"
                        {...register(`items.${index}.quantity`)}
                      />
                      <Input
                        aria-label="Rate"
                        type="number"
                        min="0"
                        step="0.01"
                        {...register(`items.${index}.rate`)}
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        aria-label="Remove line item"
                        disabled={fields.length === 1}
                        onClick={() => remove(index)}
                      >
                        <Trash2 size={17} />
                      </Button>
                      {errors.items?.[index] && (
                        <p className="text-xs text-red-600 md:col-span-5">
                          Check the description, quantity, and rate.
                        </p>
                      )}
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  className="mt-2"
                  onClick={() =>
                    append({
                      productId: "",
                      description: "",
                      quantity: 1,
                      rate: 0,
                    })
                  }
                >
                  <Plus size={16} />
                  Add line item
                </Button>
              </div>
              <div className="ml-auto w-full max-w-sm space-y-3 border-t border-[var(--border)] pt-5 text-sm">
                <div className="flex justify-between text-[var(--muted)]">
                  <span>Subtotal</span>
                  <span>{money.format(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <label htmlFor="tax">Tax rate</label>
                  <div className="flex w-28 items-center">
                    <Input
                      id="tax"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      className="text-right"
                      {...register("taxRate")}
                    />
                    <span className="-ml-7">%</span>
                  </div>
                </div>
                <div className="flex justify-between border-t border-[var(--border)] pt-3 text-lg font-semibold">
                  <span>Total</span>
                  <span>{money.format(total)}</span>
                </div>
              </div>
            </section>
            <aside className="space-y-5 border-t border-[var(--border)] bg-[#fbfcf9] p-5 lg:border-l lg:border-t-0">
              <div>
                <label className="text-sm font-medium">Bill to</label>
                <Popover open={clientOpen} onOpenChange={setClientOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-1.5 w-full justify-between font-normal"
                    >
                      {client?.name || "Choose a client"}
                      <ChevronsUpDown size={16} />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[280px] p-0" align="start">
                    <Command>
                      <CommandInput
                        placeholder="Search clients"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                      <CommandList>
                        {filtered.map((c) => (
                          <CommandItem
                            key={c.id}
                            onClick={() => {
                              setValue("clientId", c.id, {
                                shouldValidate: true,
                              });
                              setClientOpen(false);
                            }}
                          >
                            <Check
                              size={15}
                              className={
                                c.id === values.clientId
                                  ? "opacity-100"
                                  : "opacity-0"
                              }
                            />
                            <span>{c.name}</span>
                          </CommandItem>
                        ))}
                        {!filtered.length && (
                          <p className="p-4 text-sm text-[var(--muted)]">
                            No client found.
                          </p>
                        )}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {errors.clientId && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.clientId.message}
                  </p>
                )}
                <ClientDialog
                  onCreated={(id) =>
                    setValue("clientId", id, { shouldValidate: true })
                  }
                  trigger={
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="mt-1 w-full"
                    >
                      <Plus size={15} />
                      Create new client
                    </Button>
                  }
                />
              </div>
              <label className="block text-sm font-medium">
                Issue date
                <Input
                  className="mt-1.5"
                  type="date"
                  {...register("issueDate")}
                />
              </label>
              <label className="block text-sm font-medium">
                Due date
                <Input
                  className="mt-1.5"
                  type="date"
                  {...register("dueDate")}
                />
              </label>
              <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <label htmlFor="recurring" className="text-sm font-medium">
                    Recurring invoice
                  </label>
                  <Switch
                    id="recurring"
                    checked={values.isRecurring}
                    onCheckedChange={(v) => setValue("isRecurring", v)}
                  />
                </div>
                {values.isRecurring && (
                  <div className="mt-4">
                    <Select
                      value={values.recurringInterval || undefined}
                      onValueChange={(v) =>
                        setValue(
                          "recurringInterval",
                          v as Form["recurringInterval"],
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
            </aside>
          </div>
          <div className="flex flex-col-reverse gap-3 border-t border-[var(--border)] bg-white p-4 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => setTone("Draft")}
            >
              Save draft
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              onClick={() => setTone("Sent")}
            >
              Create invoice
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

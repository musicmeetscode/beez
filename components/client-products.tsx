"use client";
import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import {
  Copy,
  FilePlus2,
  KeyRound,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import {
  createClientProductLink,
  deleteClientProductLink,
  updateClientProductLink,
} from "@/lib/data";
import {
  apiKeyBalanceUrl,
  computeBalances,
  createApiKey,
  deleteApiKey,
  resyncApiKey,
} from "@/lib/api-keys";
import { formatCurrency } from "@/lib/currency";
import type { ApiKey, ClientProductLink, Invoice, Product } from "@/lib/types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader } from "./ui/card";
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

const schema = z.object({
  productId: z.string().min(1, "Choose a product"),
  amount: z.coerce.number().min(0),
  paymentDay: z.coerce.number().min(1).max(31),
});
type Form = z.infer<typeof schema>;

function ordinalDay(day: number) {
  if (day % 100 >= 11 && day % 100 <= 13) return `${day}th`;
  const suffix = ["th", "st", "nd", "rd"][day % 10] || "th";
  return `${day}${suffix}`;
}

export function ClientProductsCard({
  businessId,
  clientId,
  clientName,
  products,
  links,
  apiKeys,
  invoices,
  currency,
  businessCurrency,
  onGenerateInvoice,
}: {
  businessId: string;
  clientId: string;
  clientName: string;
  products: Product[];
  links: ClientProductLink[];
  apiKeys: ApiKey[];
  invoices: Invoice[];
  currency: string;
  businessCurrency: string;
  onGenerateInvoice: (link: ClientProductLink, product: Product) => void;
}) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const scopedProducts = products.filter((p) => p.businessId === businessId);

  const handleDelete = async (link: ClientProductLink) => {
    if (!confirm("Unlink this product from the client?")) return;
    try {
      setDeletingId(link.id);
      await deleteClientProductLink(link.id);
      toast.success("Product unlinked");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not unlink product");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold">Products</h3>
          <p className="mt-1 text-sm text-(--muted)">
            Link products this client is billed for, then generate invoices
            in one click.
          </p>
        </div>
        <ClientProductDialog
          businessId={businessId}
          clientId={clientId}
          products={scopedProducts}
          trigger={
            <Button size="sm" variant="outline">
              <Plus size={15} />
              Link product
            </Button>
          }
        />
      </CardHeader>
      <CardContent>
        {links.length ? (
          <div className="divide-y divide-[var(--border)]">
            {links.map((link) => {
              const product = products.find((p) => p.id === link.productId);
              return (
                <div
                  key={link.id}
                  className="flex items-center gap-3 py-3"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--surface-2)]">
                    <Package size={17} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">
                      {product?.name || "Deleted product"}
                    </p>
                    <p className="text-xs text-[var(--muted)]">
                      {formatCurrency(link.amount, currency)} · Bills on the{" "}
                      {ordinalDay(link.paymentDay)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {product && (
                      <Button
                        size="sm"
                        onClick={() => onGenerateInvoice(link, product)}
                      >
                        <FilePlus2 size={15} />
                        Generate invoice
                      </Button>
                    )}
                    {product && (
                      <ApiKeyDialog
                        invoices={invoices}
                        apiKey={apiKeys.find(
                          (key) => key.productId === product.id,
                        )}
                        create={() =>
                          createApiKey({
                            businessId,
                            clientId,
                            productId: product.id,
                            clientProductId: link.id,
                            clientName,
                            productName: product.name,
                            currency: businessCurrency,
                            invoices,
                          })
                        }
                      />
                    )}
                    <ClientProductDialog
                      businessId={businessId}
                      clientId={clientId}
                      products={scopedProducts}
                      link={link}
                      trigger={
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-[var(--muted)]"
                          aria-label="Edit link"
                        >
                          <Pencil size={14} />
                        </Button>
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-[var(--muted)] hover:bg-red-50 hover:text-red-600"
                      aria-label="Unlink product"
                      disabled={deletingId === link.id}
                      onClick={() => handleDelete(link)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="No products linked"
            detail="Link a product with a billing amount and day to generate invoices quickly."
          />
        )}
      </CardContent>
    </Card>
  );
}

function ClientProductDialog({
  businessId,
  clientId,
  products,
  link,
  trigger,
}: {
  businessId: string;
  clientId: string;
  products: Product[];
  link?: ClientProductLink;
  trigger: React.ReactNode;
}) {
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
    defaultValues: {
      productId: link?.productId || "",
      amount: link?.amount ?? 0,
      paymentDay: link?.paymentDay ?? 1,
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (value) {
          reset({
            productId: link?.productId || "",
            amount: link?.amount ?? 0,
            paymentDay: link?.paymentDay ?? 1,
          });
        }
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogTitle>{link ? "Edit linked product" : "Link a product"}</DialogTitle>
        <DialogDescription>
          Sets the billing amount and the day of the month this client is
          invoiced for this product.
        </DialogDescription>
        <form
          className="mt-6 grid gap-4"
          onSubmit={handleSubmit(async (values) => {
            try {
              if (link) {
                await updateClientProductLink(link.id, values);
                toast.success("Link updated");
              } else {
                await createClientProductLink(businessId, {
                  clientId,
                  ...values,
                });
                toast.success("Product linked");
              }
              setOpen(false);
            } catch (e) {
              toast.error(
                e instanceof Error ? e.message : "Could not save product link",
              );
            }
          })}
        >
          <label className="block text-sm font-medium">
            Product
            <Select
              value={watch("productId") || undefined}
              onValueChange={(value) => {
                setValue("productId", value, { shouldValidate: true });
                const product = products.find((p) => p.id === value);
                if (product) setValue("amount", product.rate);
              }}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Choose a product" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.productId && (
              <span className="mt-1 block text-xs text-red-600">
                {errors.productId.message}
              </span>
            )}
          </label>
          <label className="block text-sm font-medium">
            Billing amount
            <Input
              className="mt-1.5"
              type="number"
              min="0"
              step="0.01"
              {...register("amount")}
            />
            {errors.amount && (
              <span className="mt-1 block text-xs text-red-600">
                {errors.amount.message}
              </span>
            )}
          </label>
          <label className="block text-sm font-medium">
            Payment day of month
            <Input
              className="mt-1.5"
              type="number"
              min="1"
              max="31"
              {...register("paymentDay")}
            />
            {errors.paymentDay && (
              <span className="mt-1 block text-xs text-red-600">
                {errors.paymentDay.message}
              </span>
            )}
          </label>
          <Button disabled={isSubmitting}>
            {link ? "Save changes" : "Link product"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ApiKeyDialog({
  invoices,
  apiKey,
  create,
}: {
  invoices: Invoice[];
  apiKey?: ApiKey;
  create: () => Promise<string>;
}) {
  const [busy, setBusy] = useState(false);
  const run = async (action: () => Promise<unknown>, message: string) => {
    try {
      setBusy(true);
      await action();
      toast.success(message);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update API key");
    } finally {
      setBusy(false);
    }
  };
  const copy = async (value: string, label: string) => {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copied`);
  };
  const url = apiKey ? apiKeyBalanceUrl(apiKey.id) : "";

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-[var(--muted)]"
          aria-label="API key"
        >
          <KeyRound size={14} />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Balance API key</DialogTitle>
        <DialogDescription>
          Client apps for this product can read the client&apos;s active
          balance with this key. Anyone holding the key can read the balance,
          so keep it out of public code.
        </DialogDescription>
        {apiKey ? (
          <div className="mt-6 grid gap-4">
            <CopyField
              label="API key"
              value={apiKey.id}
              onCopy={() => copy(apiKey.id, "API key")}
            />
            <CopyField
              label="Endpoint (GET)"
              value={url}
              onCopy={() => copy(url, "Endpoint")}
            />
            <BalanceCheck
              apiKey={apiKey}
              invoices={invoices}
              busy={busy}
              onResync={() =>
                run(() => resyncApiKey(apiKey, invoices), "Balance resynced")
              }
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => {
                  if (!confirm("Regenerate? The current key stops working."))
                    return;
                  void run(async () => {
                    await create();
                    await deleteApiKey(apiKey.id);
                  }, "API key regenerated");
                }}
              >
                <RefreshCw size={15} />
                Regenerate
              </Button>
              <Button
                variant="ghost"
                className="text-red-600 hover:bg-red-50"
                disabled={busy}
                onClick={() => {
                  if (!confirm("Revoke this API key?")) return;
                  void run(() => deleteApiKey(apiKey.id), "API key revoked");
                }}
              >
                <Trash2 size={15} />
                Revoke
              </Button>
            </div>
          </div>
        ) : (
          <Button
            className="mt-6"
            disabled={busy}
            onClick={() => run(create, "API key created")}
          >
            <KeyRound size={15} />
            Generate API key
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}

function CopyField({
  label,
  value,
  onCopy,
}: {
  label: string;
  value: string;
  onCopy: () => void;
}) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <div className="mt-1.5 flex gap-2">
        <Input readOnly value={value} className="font-mono text-xs" />
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={`Copy ${label}`}
          onClick={onCopy}
        >
          <Copy size={15} />
        </Button>
      </div>
    </label>
  );
}

// Compares what the API is serving with the balance computed from the
// invoices on screen, so a stale published value is obvious and fixable.
function BalanceCheck({
  apiKey,
  invoices,
  busy,
  onResync,
}: {
  apiKey: ApiKey;
  invoices: Invoice[];
  busy: boolean;
  onResync: () => void;
}) {
  const live = computeBalances(invoices, apiKey.clientId, apiKey.productId);
  const inSync =
    live.balance === apiKey.balance &&
    live.productBalance === apiKey.productBalance &&
    live.openInvoices === apiKey.openInvoices;
  const drafts = invoices
    .filter((i) => i.clientId === apiKey.clientId && i.status === "Draft")
    .reduce((sum, i) => sum + (Number(i.balanceDue) || 0), 0);
  const updated = apiKey.updatedAt?.toDate?.();

  return (
    <div className="grid gap-2 rounded-xl bg-[var(--surface-2)] p-4 text-sm">
      <div className="flex justify-between gap-3">
        <span className="text-[var(--muted)]">API is serving</span>
        <span className="font-semibold">
          {formatCurrency(apiKey.balance, apiKey.currency)}
        </span>
      </div>
      <div className="flex justify-between gap-3">
        <span className="text-[var(--muted)]">Live from invoices</span>
        <span className="font-semibold">
          {formatCurrency(live.balance, apiKey.currency)}
        </span>
      </div>
      <div className="flex justify-between gap-3">
        <span className="text-[var(--muted)]">This product&apos;s share</span>
        <span>{formatCurrency(live.productBalance, apiKey.currency)}</span>
      </div>
      {drafts > 0 && (
        <p className="text-xs text-[var(--muted)]">
          {formatCurrency(drafts, apiKey.currency)} in draft invoices is not
          included until they are sent.
        </p>
      )}
      <div className="mt-1 flex items-center justify-between gap-3">
        <span
          className={
            inSync ? "text-xs text-emerald-700" : "text-xs text-red-600"
          }
        >
          {inSync ? "In sync" : "Out of sync"}
          {updated && ` · last published ${updated.toLocaleString()}`}
        </span>
        <Button size="sm" variant="outline" disabled={busy} onClick={onResync}>
          <RefreshCw size={14} />
          Resync now
        </Button>
      </div>
    </div>
  );
}

"use client";
import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import { FilePlus2, Package, Pencil, Plus, Trash2 } from "lucide-react";
import {
  createClientProductLink,
  deleteClientProductLink,
  updateClientProductLink,
} from "@/lib/data";
import { formatCurrency } from "@/lib/currency";
import type { ClientProductLink, Product } from "@/lib/types";
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
  products,
  links,
  currency,
  onGenerateInvoice,
}: {
  businessId: string;
  clientId: string;
  products: Product[];
  links: ClientProductLink[];
  currency: string;
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

"use client";
import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import {
  createClient,
  createProduct,
  updateClient,
  updateProduct,
} from "@/lib/data";
import type { Client, Product } from "@/lib/types";
import { productContractTerms } from "@/lib/contracts";
import { useBusiness } from "@/contexts/business-context";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
const clientSchema = z.object({
  name: z.string().min(2),
  email: z.union([z.literal(""), z.email()]),
  phone: z.string().min(3, "Enter a phone number"),
  businessName: z.string().min(2, "Enter the business or organisation"),
  businessAddress: z.string().min(2, "Enter the business address"),
});
type ClientForm = z.infer<typeof clientSchema>;
export function ClientDialog({
  trigger,
  onCreated,
  businessId,
}: {
  trigger?: React.ReactNode;
  onCreated?: (id: string) => void;
  businessId?: string;
}) {
  const { activeBusinessId, businesses } = useBusiness();
  const [selectedBusinessId, setSelectedBusinessId] = useState("");
  const targetBusinessId =
    businessId ||
    (activeBusinessId === "all"
      ? selectedBusinessId || businesses[0]?.id || ""
      : activeBusinessId);
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ClientForm>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      businessName: "",
      businessAddress: "",
    },
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button>New client</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Add a client</DialogTitle>
        <DialogDescription>
          Contact details appear on invoices and receipts.
        </DialogDescription>
        <form
          className="mt-6 grid gap-4"
          onSubmit={handleSubmit(async (v) => {
            try {
              const r = await createClient(targetBusinessId, {
                ...v,
                address: v.businessAddress,
              });
              toast.success("Client added");
              reset();
              setOpen(false);
              onCreated?.(r.id);
            } catch (e) {
              toast.error(
                e instanceof Error ? e.message : "Could not add client",
              );
            }
          })}
        >
          {activeBusinessId === "all" && !businessId && (
            <Field label="Business">
              <Select
                value={targetBusinessId}
                onValueChange={setSelectedBusinessId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a business" />
                </SelectTrigger>
                <SelectContent>
                  {businesses.map((business) => (
                    <SelectItem key={business.id} value={business.id}>
                      {business.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
          <Field label="Contact name" error={errors.name?.message}>
            <Input autoFocus {...register("name")} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Phone" error={errors.phone?.message}>
              <Input type="tel" {...register("phone")} />
            </Field>
            <Field label="Email" error={errors.email?.message}>
              <Input type="email" {...register("email")} />
            </Field>
          </div>
          <Field
            label="Business / organisation name"
            error={errors.businessName?.message}
          >
            <Input {...register("businessName")} />
          </Field>
          <Field
            label="Business address"
            error={errors.businessAddress?.message}
          >
            <Input {...register("businessAddress")} />
          </Field>
          <Button className="mt-2" disabled={isSubmitting || !targetBusinessId}>
            Save client
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function EditClientDialog({ client }: { client: Client }) {
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ClientForm>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: client.name,
      email: client.email,
      phone: client.phone,
      businessName: client.businessName || "",
      businessAddress: client.businessAddress || client.address || "",
    },
  });
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (value) {
          reset({
            name: client.name,
            email: client.email,
            phone: client.phone,
            businessName: client.businessName || "",
            businessAddress: client.businessAddress || client.address || "",
          });
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">Edit client</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Edit client</DialogTitle>
        <DialogDescription>
          Updates the contact details used on future invoice and receipt
          downloads.
        </DialogDescription>
        <form
          className="mt-6 grid gap-4"
          onSubmit={handleSubmit(async (values) => {
            try {
              await updateClient(client.id, {
                ...values,
                address: values.businessAddress,
              });
              toast.success("Client updated");
              setOpen(false);
            } catch (error) {
              toast.error(
                error instanceof Error
                  ? error.message
                  : "Could not update client",
              );
            }
          })}
        >
          <Field label="Contact name" error={errors.name?.message}>
            <Input autoFocus {...register("name")} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Phone" error={errors.phone?.message}>
              <Input type="tel" {...register("phone")} />
            </Field>
            <Field label="Email" error={errors.email?.message}>
              <Input type="email" {...register("email")} />
            </Field>
          </div>
          <Field
            label="Business / organisation name"
            error={errors.businessName?.message}
          >
            <Input {...register("businessName")} />
          </Field>
          <Field
            label="Business address"
            error={errors.businessAddress?.message}
          >
            <Input {...register("businessAddress")} />
          </Field>
          <Button disabled={isSubmitting}>Save changes</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
const productSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(2),
  rate: z.coerce.number().min(0),
  termsOfUse: z.string().trim().min(1).max(12000),
});
type ProductForm = z.infer<typeof productSchema>;
export function ProductDialog({
  trigger,
  businessId,
  product,
}: {
  trigger?: React.ReactNode;
  businessId?: string;
  product?: Product;
}) {
  const { activeBusinessId } = useBusiness();
  const targetBusinessId =
    product?.businessId || businessId || activeBusinessId;
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductForm>({
    resolver: zodResolver(productSchema) as Resolver<ProductForm>,
    defaultValues: {
      name: product?.name || "",
      description: product?.description || "",
      rate: product?.rate || 0,
      termsOfUse: productContractTerms(product?.termsOfUse),
    },
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant={product ? "outline" : "default"}>
            {product ? "Edit" : "New product"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>{product ? "Edit product" : "Add a product"}</DialogTitle>
        <DialogDescription>
          Products keep descriptions and rates consistent across invoices.
        </DialogDescription>
        <form
          className="mt-6 grid gap-4"
          onSubmit={handleSubmit(async (v) => {
            try {
              if (product) await updateProduct(product.id, v);
              else await createProduct(targetBusinessId, v);
              toast.success(product ? "Product updated" : "Product added");
              reset(product ? v : undefined);
              setOpen(false);
            } catch (e) {
              toast.error(
                e instanceof Error ? e.message : "Could not add product",
              );
            }
          })}
        >
          <Field label="Product name" error={errors.name?.message}>
            <Input autoFocus {...register("name")} />
          </Field>
          <Field
            label="Invoice description"
            error={errors.description?.message}
          >
            <Input {...register("description")} />
          </Field>
          <Field label="Default rate" error={errors.rate?.message}>
            <Input type="number" step="0.01" {...register("rate")} />
          </Field>
          <Field
            label="Software terms of use"
            error={errors.termsOfUse?.message}
          >
            <textarea
              maxLength={12000}
              rows={7}
              className="focus-ring w-full rounded-xl border border-[var(--border)] p-3 text-sm"
              {...register("termsOfUse")}
            />
            <p className="mt-1 text-xs text-[var(--muted)]">
              Used automatically for this product&apos;s new contracts. Existing
              contracts keep their saved terms.
            </p>
          </Field>
          <Button
            className="mt-2"
            disabled={
              isSubmitting || !targetBusinessId || targetBusinessId === "all"
            }
          >
            Save product
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
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

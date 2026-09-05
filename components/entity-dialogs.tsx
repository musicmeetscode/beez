"use client";
import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import { createClient, createProduct } from "@/lib/data";
import { useBusiness } from "@/contexts/business-context";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
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
  phone: z.string(),
  address: z.string(),
});
type ClientForm = z.infer<typeof clientSchema>;
export function ClientDialog({
  trigger,
  onCreated,
}: {
  trigger?: React.ReactNode;
  onCreated?: (id: string) => void;
}) {
  const { activeBusinessId } = useBusiness();
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ClientForm>({
    resolver: zodResolver(clientSchema),
    defaultValues: { name: "", email: "", phone: "", address: "" },
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
              const r = await createClient(activeBusinessId, v);
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
          <Field label="Client name" error={errors.name?.message}>
            <Input autoFocus {...register("name")} />
          </Field>
          <Field label="Email" error={errors.email?.message}>
            <Input type="email" {...register("email")} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Phone">
              <Input {...register("phone")} />
            </Field>
            <Field label="Address">
              <Input {...register("address")} />
            </Field>
          </div>
          <Button className="mt-2" disabled={isSubmitting || !activeBusinessId}>
            Save client
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
const productSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(2),
  rate: z.coerce.number().min(0),
});
type ProductForm = z.infer<typeof productSchema>;
export function ProductDialog({ trigger }: { trigger?: React.ReactNode }) {
  const { activeBusinessId } = useBusiness();
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductForm>({
    resolver: zodResolver(productSchema) as Resolver<ProductForm>,
    defaultValues: { name: "", description: "", rate: 0 },
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button>New product</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Add a product</DialogTitle>
        <DialogDescription>
          Products keep descriptions and rates consistent across invoices.
        </DialogDescription>
        <form
          className="mt-6 grid gap-4"
          onSubmit={handleSubmit(async (v) => {
            try {
              await createProduct(activeBusinessId, v);
              toast.success("Product added");
              reset();
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
          <Button className="mt-2" disabled={isSubmitting || !activeBusinessId}>
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

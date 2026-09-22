"use client";
import { useEffect, useState } from "react";
import { ImagePlus, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createBusiness, updateBusiness, uploadBusinessLogo } from "@/lib/data";
import { useBusiness } from "@/contexts/business-context";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader } from "./ui/card";
import { CurrencySelect } from "./currency-select";
import { defaultPaymentTerms } from "@/lib/contracts";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
const schema = z.object({
  name: z.string().min(2),
  paymentInstructions: z.string(),
  contractPaymentTerms: z.string().trim().min(1).max(12000),
  contractAddress: z.string().max(500),
  contractTerms: z.string().max(12000),
  currency: z.string().length(3),
});
type Form = z.infer<typeof schema>;
export function SettingsView() {
  const { activeBusiness } = useBusiness();
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema) });
  useEffect(() => {
    if (activeBusiness)
      reset({
        name: activeBusiness.name,
        paymentInstructions: activeBusiness.paymentInstructions,
        contractPaymentTerms:
          activeBusiness.contractPaymentTerms || defaultPaymentTerms,
        contractAddress: activeBusiness.contractAddress || "Uganda",
        contractTerms: activeBusiness.contractTerms || "",
        currency: activeBusiness.currency || "USD",
      });
  }, [activeBusiness, reset]);
  if (!activeBusiness) return null;
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Business details</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Used on every invoice and PDF.
          </p>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-5"
            onSubmit={handleSubmit(async (v) => {
              try {
                await updateBusiness(activeBusiness.id, v);
                toast.success("Business details saved");
              } catch (e) {
                toast.error(
                  e instanceof Error ? e.message : "Could not save changes",
                );
              }
            })}
          >
            <label className="block text-sm font-medium">
              Business name
              <Input className="mt-1.5" {...register("name")} />
            </label>
            <label className="block text-sm font-medium">
              Currency
              <CurrencySelect
                className="mt-1.5"
                value={watch("currency")}
                onValueChange={(value) =>
                  setValue("currency", value, { shouldValidate: true })
                }
              />
            </label>
            <label className="block text-sm font-medium">
              Principal business address (contracts)
              <Input
                className="mt-1.5"
                maxLength={500}
                {...register("contractAddress")}
              />
            </label>
            <label className="block text-sm font-medium">
              Payment instructions
              <textarea
                className="focus-ring mt-1.5 min-h-36 w-full rounded-xl border border-[var(--border)] p-3.5 text-[15px]"
                {...register("paymentInstructions")}
              />
            </label>
            <label className="block text-sm font-medium">
              Default contract payment terms
              <textarea
                required
                maxLength={12000}
                className="focus-ring mt-1.5 min-h-36 w-full rounded-xl border border-[var(--border)] p-3.5 text-[15px]"
                {...register("contractPaymentTerms")}
              />
              <span className="mt-1 block text-xs text-[var(--muted)]">
                Automatically included in new contracts. Existing contracts keep
                their saved terms.
              </span>
            </label>
            <label className="block text-sm font-medium">
              Business contract terms (optional)
              <textarea
                maxLength={12000}
                rows={6}
                className="focus-ring mt-1.5 w-full rounded-xl border border-[var(--border)] p-3.5 text-[15px]"
                placeholder="Terms that apply to every software contract for this business."
                {...register("contractTerms")}
              />
              <span className="mt-1 block text-xs text-[var(--muted)]">
                Included automatically alongside payment terms and the selected
                product&apos;s terms.
              </span>
            </label>
            <Button disabled={isSubmitting}>Save changes</Button>
          </form>
        </CardContent>
      </Card>
      <div className="space-y-5">
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Business logo</h2>
          </CardHeader>
          <CardContent>
            {activeBusiness.logoUrl ? (
              <img
                className="mb-4 h-20 w-full rounded-xl border border-[var(--border)] object-contain p-3"
                src={activeBusiness.logoUrl}
                alt={`${activeBusiness.name} logo`}
              />
            ) : (
              <div className="mb-4 grid h-20 place-items-center rounded-xl border border-dashed border-[var(--border)] text-sm text-[var(--muted)]">
                No logo uploaded
              </div>
            )}
            <label>
              <input
                className="sr-only"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  if (f.size > 2_000_000) {
                    toast.error("Choose an image under 2 MB");
                    return;
                  }
                  try {
                    const url = await uploadBusinessLogo(activeBusiness.id, f);
                    await updateBusiness(activeBusiness.id, { logoUrl: url });
                    toast.success("Logo updated");
                  } catch (err) {
                    toast.error(
                      err instanceof Error ? err.message : "Upload failed",
                    );
                  }
                }}
              />
              <span className="focus-ring inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-[var(--border)] px-4 text-sm font-semibold">
                <ImagePlus size={17} />
                Upload logo
              </span>
            </label>
          </CardContent>
        </Card>
        <NewBusinessDialog />
      </div>
    </div>
  );
}
function NewBusinessDialog() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { isSubmitting },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      paymentInstructions: "",
      contractPaymentTerms: defaultPaymentTerms,
      contractAddress: "Uganda",
      contractTerms: "",
      currency: "USD",
    },
  });
  return (
    <Card>
      <CardHeader>
        <h2 className="font-semibold">Businesses</h2>
        <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
          Add another business with its own private billing records.
        </p>
      </CardHeader>
      <CardContent>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full">
              <Plus size={17} />
              Add business
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>New business</DialogTitle>
            <DialogDescription>
              Clients, products, invoices, and payments stay isolated by
              business.
            </DialogDescription>
            <form
              className="mt-6 space-y-4"
              onSubmit={handleSubmit(async (v) => {
                if (!user) return;
                try {
                  await createBusiness(user.uid, v);
                  toast.success("Business created");
                  reset();
                  setOpen(false);
                } catch (e) {
                  toast.error(
                    e instanceof Error
                      ? e.message
                      : "Could not create business",
                  );
                }
              })}
            >
              <label className="block text-sm font-medium">
                Business name
                <Input className="mt-1.5" autoFocus {...register("name")} />
              </label>
              <label className="block text-sm font-medium">
                Currency
                <CurrencySelect
                  className="mt-1.5"
                  value={watch("currency")}
                  onValueChange={(value) =>
                    setValue("currency", value, { shouldValidate: true })
                  }
                />
              </label>
              <label className="block text-sm font-medium">
                Payment instructions
                <textarea
                  className="focus-ring mt-1.5 min-h-28 w-full rounded-xl border border-[var(--border)] p-3.5"
                  {...register("paymentInstructions")}
                />
              </label>
              <Button className="w-full" disabled={isSubmitting}>
                Create business
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

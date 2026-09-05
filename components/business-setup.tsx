"use client";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Building2 } from "lucide-react";
import { toast } from "sonner";
import { createBusiness } from "@/lib/data";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
const schema = z.object({
  name: z.string().min(2),
  paymentInstructions: z.string(),
});
type Form = z.infer<typeof schema>;
export function BusinessSetup() {
  const { user } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", paymentInstructions: "" },
  });
  return (
    <main className="grid min-h-screen place-items-center p-4">
      <section className="w-full max-w-xl rounded-[28px] border border-[var(--border)] bg-white p-7 shadow-[0_24px_80px_rgba(20,23,18,.08)] md:p-10">
        <span className="grid size-12 place-items-center rounded-2xl bg-[var(--accent)]">
          <Building2 size={22} />
        </span>
        <h1 className="mt-6 text-3xl font-semibold tracking-[-.035em]">
          Create your first business
        </h1>
        <p className="mt-2 leading-7 text-[var(--muted)]">
          Each business keeps its clients, products, invoices, and payments
          separate.
        </p>
        <form
          className="mt-8 space-y-5"
          onSubmit={handleSubmit(async (v) => {
            if (!user) return;
            try {
              await createBusiness(user.uid, v);
              toast.success("Business created");
            } catch (e) {
              toast.error(
                e instanceof Error ? e.message : "Could not create business",
              );
            }
          })}
        >
          <label className="block text-sm font-medium">
            Business name
            <Input className="mt-1.5" autoFocus {...register("name")} />
            {errors.name && (
              <span className="text-xs text-red-600">
                {errors.name.message}
              </span>
            )}
          </label>
          <label className="block text-sm font-medium">
            Payment instructions
            <textarea
              className="focus-ring mt-1.5 min-h-28 w-full rounded-xl border border-[var(--border)] p-3.5 text-[15px]"
              {...register("paymentInstructions")}
            />
          </label>
          <Button className="w-full" disabled={isSubmitting}>
            Create business
          </Button>
        </form>
      </section>
    </main>
  );
}

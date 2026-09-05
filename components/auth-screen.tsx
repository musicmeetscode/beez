"use client";
import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ArrowRight, FileText, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/auth-context";
const schema = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(8, "Use at least 8 characters"),
});
type Form = z.infer<typeof schema>;
export function AuthScreen() {
  const { signIn, signUp, google } = useAuth();
  const [create, setCreate] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema) });
  const run = handleSubmit(async (v) => {
    try {
      await (create
        ? signUp(v.email, v.password)
        : signIn(v.email, v.password));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not sign in");
    }
  });
  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-6xl overflow-hidden rounded-[28px] border border-[var(--border)] bg-white shadow-[0_24px_80px_rgba(20,23,18,.08)] md:min-h-[calc(100vh-4rem)] md:grid-cols-[1.05fr_.95fr]">
        <section className="flex flex-col justify-between bg-[var(--dark)] p-7 text-white md:p-12">
          <div className="flex items-center gap-3 text-lg font-semibold">
            <span className="grid size-10 place-items-center rounded-xl bg-[var(--accent)] text-[var(--accent-ink)]">
              <FileText size={20} />
            </span>
            Ledgerly
          </div>
          <div className="my-16">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[.18em] text-[var(--accent)]">
              Billing, without the busywork
            </p>
            <h1 className="text-4xl font-semibold leading-[1.05] tracking-[-.045em] md:text-6xl">
              Every business.
              <br />
              One clear ledger.
            </h1>
            <p className="mt-6 max-w-md leading-7 text-[#aeb7b9]">
              Create precise invoices, track every payment, and keep client
              balances in view.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-[#aeb7b9]">
            <ShieldCheck size={17} />
            Your records stay scoped to the active business.
          </div>
        </section>
        <section className="flex items-center p-7 md:p-12">
          <div className="w-full max-w-md">
            <p className="text-sm font-semibold text-[#7a8074]">
              {create ? "Create workspace" : "Welcome back"}
            </p>
            <h2 className="mb-8 mt-2 text-3xl font-semibold tracking-[-.035em]">
              {create ? "Start managing invoices" : "Sign in to Ledgerly"}
            </h2>
            <Button
              variant="outline"
              className="w-full"
              onClick={async () => {
                try {
                  await google();
                } catch (e) {
                  toast.error(
                    e instanceof Error ? e.message : "Google sign-in failed",
                  );
                }
              }}
            >
              Continue with Google
            </Button>
            <div className="my-5 flex items-center gap-3 text-xs text-[var(--muted)]">
              <span className="h-px flex-1 bg-[var(--border)]" />
              or use email
              <span className="h-px flex-1 bg-[var(--border)]" />
            </div>
            <form className="space-y-4" onSubmit={run}>
              <label className="block text-sm font-medium">
                Email
                <Input
                  className="mt-1.5"
                  type="email"
                  autoComplete="email"
                  {...register("email")}
                />
                <span className="mt-1 block text-xs text-red-600">
                  {errors.email?.message}
                </span>
              </label>
              <label className="block text-sm font-medium">
                Password
                <Input
                  className="mt-1.5"
                  type="password"
                  autoComplete={create ? "new-password" : "current-password"}
                  {...register("password")}
                />
                <span className="mt-1 block text-xs text-red-600">
                  {errors.password?.message}
                </span>
              </label>
              <Button className="w-full" disabled={isSubmitting}>
                {create ? "Create account" : "Sign in"}
                <ArrowRight size={17} />
              </Button>
            </form>
            <button
              className="focus-ring mt-6 w-full rounded-lg text-sm text-[var(--muted)]"
              onClick={() => setCreate(!create)}
            >
              {create
                ? "Already have an account? Sign in"
                : "New to Ledgerly? Create an account"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

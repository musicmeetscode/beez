"use client";
import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
export function AuthScreen() {
  const { google } = useAuth();
  const [signingIn, setSigningIn] = useState(false);
  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-6xl overflow-hidden rounded-[28px] border border-[var(--border)] bg-white shadow-[0_24px_80px_rgba(20,23,18,.08)] md:min-h-[calc(100vh-4rem)] md:grid-cols-[1.05fr_.95fr]">
        <section className="flex flex-col justify-between bg-[var(--dark)] p-7 text-white md:p-12">
          <div className="flex items-center gap-3 text-lg font-semibold">
            <img
              src="/icons/icon-192.png"
              alt=""
              className="size-10 rounded-xl"
            />
            Beez
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
            <p className="text-sm font-semibold text-[#7a8074]">Welcome</p>
            <h2 className="mb-8 mt-2 text-3xl font-semibold tracking-[-.035em]">
              Continue to your workspace
            </h2>
            <Button
              className="w-full"
              disabled={signingIn}
              onClick={async () => {
                setSigningIn(true);
                try {
                  await google();
                } catch (e) {
                  toast.error(
                    e instanceof Error ? e.message : "Google sign-in failed",
                  );
                } finally {
                  setSigningIn(false);
                }
              }}
            >
              {signingIn ? "Connecting…" : "Continue with Google"}
            </Button>
            <p className="mt-5 text-center text-sm leading-6 text-[var(--muted)]">
              Beez keeps you signed in on this device until you choose Sign out.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

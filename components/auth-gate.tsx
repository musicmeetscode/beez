"use client";
import { AlertTriangle, ArrowRight, FileText, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
export function AuthGate() {
  return (
    <main className="min-h-screen bg-[var(--background)] p-4 md:p-8">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-6xl overflow-hidden rounded-[28px] border border-[var(--border)] bg-white shadow-[0_24px_80px_rgba(20,23,18,.08)] md:min-h-[calc(100vh-4rem)] md:grid-cols-[1.05fr_.95fr]">
        <section className="flex flex-col justify-between bg-[var(--dark)] p-7 text-white md:p-12">
          <div className="flex items-center gap-3 text-lg font-semibold">
            <span className="grid size-10 place-items-center rounded-xl bg-[var(--accent)] text-[var(--accent-ink)]">
              <FileText size={20} />
            </span>
            Ledgerly
          </div>
          <div className="my-16 max-w-xl animate-rise">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[.18em] text-[var(--accent)]">
              Billing, without the busywork
            </p>
            <h1 className="text-4xl font-semibold leading-[1.05] tracking-[-.045em] md:text-6xl">
              Every business.
              <br />
              One clear ledger.
            </h1>
            <p className="mt-6 max-w-md text-base leading-7 text-[#aeb7b9]">
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
            <div className="mb-8">
              <p className="text-sm font-semibold text-[#7a8074]">Welcome</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-.035em]">
                Sign in to your workspace
              </h2>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
              <div className="mb-1 flex items-center gap-2 font-semibold">
                <AlertTriangle size={17} />
                Firebase setup needed
              </div>
              Add your public Firebase web configuration to{" "}
              <code className="rounded bg-amber-100 px-1.5 py-0.5 text-xs">
                .env.local
              </code>{" "}
              to enable secure Email/Password and Google sign-in.
            </div>
            <Button className="mt-6 w-full" disabled>
              Continue with Google <ArrowRight size={17} />
            </Button>
            <p className="mt-5 text-center text-xs leading-5 text-[var(--muted)]">
              No sample records are shown. Once connected, every view listens
              directly to your Firestore data.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

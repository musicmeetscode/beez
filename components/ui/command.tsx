"use client";
import * as React from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
export function Command({
  className,
  ...p
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("overflow-hidden", className)} {...p} />;
}
export function CommandInput(p: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex items-center gap-2 border-b border-[var(--border)] px-3">
      <Search size={16} className="text-[var(--muted)]" />
      <input
        className="h-11 w-full outline-none placeholder:text-[#9ca297]"
        {...p}
      />
    </label>
  );
}
export function CommandList({
  className,
  ...p
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("max-h-64 overflow-y-auto py-1", className)} {...p} />
  );
}
export function CommandItem({
  className,
  ...p
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        "focus-ring flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm hover:bg-[var(--surface-2)]",
        className,
      )}
      {...p}
    />
  );
}

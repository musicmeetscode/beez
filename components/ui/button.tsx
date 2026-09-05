import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
const variants=cva("focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition disabled:pointer-events-none disabled:opacity-50",{variants:{variant:{default:"bg-[var(--accent)] text-[var(--accent-ink)] hover:brightness-95",dark:"bg-[var(--dark)] text-white hover:bg-black",outline:"border border-[var(--border)] bg-white hover:bg-[var(--surface-2)]",ghost:"hover:bg-[var(--surface-2)]",danger:"bg-red-50 text-[var(--danger)] hover:bg-red-100"},size:{default:"h-11",sm:"h-9 min-h-9 px-3",icon:"size-11 p-0"}},defaultVariants:{variant:"default",size:"default"}});
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>,VariantProps<typeof variants>{asChild?:boolean}
export function Button({className,variant,size,asChild,...props}:ButtonProps){const Comp=asChild?Slot:"button";return <Comp className={cn(variants({variant,size}),className)} {...props}/>}

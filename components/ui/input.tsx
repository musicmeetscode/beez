import * as React from "react"; import { cn } from "@/lib/utils";
export function Input({className,...props}:React.InputHTMLAttributes<HTMLInputElement>){return <input className={cn("focus-ring h-11 w-full rounded-xl border border-[var(--border)] bg-white px-3.5 text-[15px] placeholder:text-[#a1a69c] disabled:bg-[var(--surface-2)]",className)} {...props}/>}

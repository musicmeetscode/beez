"use client";
import * as P from "@radix-ui/react-popover";
import { cn } from "@/lib/utils";
export const Popover = P.Root;
export const PopoverTrigger = P.Trigger;
export function PopoverContent({
  className,
  ...p
}: React.ComponentProps<typeof P.Content>) {
  return (
    <P.Portal>
      <P.Content
        sideOffset={6}
        className={cn(
          "z-[60] rounded-xl border border-[var(--border)] bg-white p-2 shadow-xl",
          className,
        )}
        {...p}
      />
    </P.Portal>
  );
}

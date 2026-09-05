"use client";
import * as D from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
export const Dialog = D.Root;
export const DialogTrigger = D.Trigger;
export const DialogClose = D.Close;
export function DialogContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof D.Content>) {
  return (
    <D.Portal>
      <D.Overlay className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px]" />
      <D.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl",
          className,
        )}
        {...props}
      >
        {children}
        <D.Close
          aria-label="Close"
          className="focus-ring absolute right-4 top-4 rounded-lg p-2 hover:bg-[var(--surface-2)]"
        >
          <X size={18} />
        </D.Close>
      </D.Content>
    </D.Portal>
  );
}
export const DialogTitle = ({
  className,
  ...p
}: React.ComponentProps<typeof D.Title>) => (
  <D.Title
    className={cn("text-xl font-semibold tracking-[-.02em]", className)}
    {...p}
  />
);
export const DialogDescription = ({
  className,
  ...p
}: React.ComponentProps<typeof D.Description>) => (
  <D.Description
    className={cn("mt-1 text-sm leading-6 text-[var(--muted)]", className)}
    {...p}
  />
);

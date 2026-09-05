"use client";
import * as S from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
export const Select = S.Root;
export function SelectTrigger({
  className,
  children,
  ...p
}: React.ComponentProps<typeof S.Trigger>) {
  return (
    <S.Trigger
      className={cn(
        "focus-ring flex h-11 w-full items-center justify-between rounded-xl border border-[var(--border)] bg-white px-3.5 text-sm",
        className,
      )}
      {...p}
    >
      {children}
      <S.Icon>
        <ChevronDown size={16} />
      </S.Icon>
    </S.Trigger>
  );
}
export const SelectValue = S.Value;
export function SelectContent({
  className,
  children,
  ...p
}: React.ComponentProps<typeof S.Content>) {
  return (
    <S.Portal>
      <S.Content
        position="popper"
        sideOffset={6}
        className={cn(
          "z-[70] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border border-[var(--border)] bg-white p-1 shadow-xl",
          className,
        )}
        {...p}
      >
        <S.Viewport>{children}</S.Viewport>
      </S.Content>
    </S.Portal>
  );
}
export function SelectItem({
  className,
  children,
  ...p
}: React.ComponentProps<typeof S.Item>) {
  return (
    <S.Item
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-lg py-2.5 pl-8 pr-3 text-sm outline-none data-[highlighted]:bg-[var(--surface-2)]",
        className,
      )}
      {...p}
    >
      <span className="absolute left-2">
        <S.ItemIndicator>
          <Check size={15} />
        </S.ItemIndicator>
      </span>
      <S.ItemText>{children}</S.ItemText>
    </S.Item>
  );
}

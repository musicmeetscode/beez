"use client";
import * as S from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";
export function Switch({
  className,
  ...p
}: React.ComponentProps<typeof S.Root>) {
  return (
    <S.Root
      className={cn(
        "focus-ring h-6 w-11 rounded-full bg-[#c9cec3] p-0.5 transition data-[state=checked]:bg-[var(--dark)]",
        className,
      )}
      {...p}
    >
      <S.Thumb className="block size-5 rounded-full bg-white shadow transition data-[state=checked]:translate-x-5" />
    </S.Root>
  );
}

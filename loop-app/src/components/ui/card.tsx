import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-white/40 bg-white/80 p-6 shadow-loop-card",
        className,
      )}
      {...props}
    />
  );
}

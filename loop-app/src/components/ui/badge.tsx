import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: "success" | "neutral" | "warning";
}

export function Badge({ tone = "neutral", className, ...props }: BadgeProps) {
  const palette: Record<NonNullable<BadgeProps["tone"]>, string> = {
    success: "bg-loop-green/15 text-loop-green border-loop-green/20",
    neutral: "bg-loop-slate/10 text-loop-slate border-loop-slate/15",
    warning: "bg-loop-amber/20 text-loop-slate border-loop-amber/40",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide",
        palette[tone],
        className,
      )}
      {...props}
    />
  );
}

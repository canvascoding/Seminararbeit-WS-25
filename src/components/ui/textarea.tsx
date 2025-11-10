"use client";

import { forwardRef, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "w-full rounded-2xl border border-loop-slate/15 bg-white px-4 py-3 text-base text-loop-slate placeholder:text-loop-slate/60 focus:border-loop-green focus:outline-none focus:ring-2 focus:ring-loop-green/40",
      className,
    )}
    {...props}
  />
));

Textarea.displayName = "Textarea";

"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

type Variant = "primary" | "ghost" | "secondary" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  fullWidth?: boolean;
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      fullWidth,
      disabled,
      asChild,
      children,
      ...props
    },
    ref,
  ) => {
    const base =
      "inline-flex items-center justify-center rounded-full px-4 sm:px-5 py-2.5 sm:py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] touch-manipulation";
    const variants: Record<Variant, string> = {
      primary:
        "bg-loop-green text-white shadow-lg shadow-loop-green/30 hover:bg-loop-green-dark focus-visible:ring-loop-green",
      secondary:
        "bg-loop-sand text-loop-slate border border-loop-green/40 hover:border-loop-green focus-visible:ring-loop-green",
      ghost:
        "bg-transparent text-loop-slate hover:bg-loop-green/10 focus-visible:ring-loop-green",
      danger:
        "bg-loop-rose text-white hover:bg-loop-rose/90 focus-visible:ring-loop-rose",
    };
    const sharedClass = cn(
      base,
      variants[variant],
      fullWidth && "w-full",
      className,
    );

    if (asChild) {
      return (
        <Slot className={sharedClass} {...props}>
          {children}
        </Slot>
      );
    }

    return (
      <button
        ref={ref}
        className={sharedClass}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";

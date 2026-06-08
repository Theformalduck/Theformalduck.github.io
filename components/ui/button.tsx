"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive" | "gradient" | "glass" | "lime";
  size?: "sm" | "md" | "lg" | "icon";
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "md",
      asChild = false,
      loading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";

    const base =
      "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexus-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 whitespace-nowrap select-none";

    const variants = {
      default:
        "bg-nexus-600 text-white hover:bg-nexus-700 active:bg-nexus-800 shadow-sm hover:shadow-md",
      secondary:
        "bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-200 border border-gray-200",
      outline:
        "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300 active:bg-gray-100",
      ghost:
        "bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 active:bg-gray-100",
      destructive:
        "bg-red-600 text-white hover:bg-red-700 active:bg-red-800",
      gradient:
        "bg-gradient-to-r from-nexus-600 via-nexus-500 to-sky-400 text-white hover:opacity-90 active:opacity-80 shadow-lg hover:shadow-nexus-500/25 hover:shadow-xl",
      glass:
        "glass text-white hover:bg-white/15 border-white/30",
      lime:
        "bg-[#c8e83c] text-gray-900 font-semibold hover:bg-[#b8d82c] active:bg-[#a8c81e] shadow-lg hover:shadow-[#c8e83c]/30 hover:shadow-xl",
    };

    const sizes = {
      sm: "h-8 px-3 text-sm rounded-lg",
      md: "h-10 px-4 text-sm",
      lg: "h-12 px-6 text-base rounded-xl",
      icon: "h-10 w-10",
    };

    return (
      <Comp
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            {children}
          </>
        ) : (
          children
        )}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button };

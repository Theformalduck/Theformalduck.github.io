import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "outline" | "success" | "warning" | "destructive" | "gradient" | "lime";
}

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  const variants = {
    default:
      "bg-nexus-100 text-nexus-700 dark:bg-nexus-900/30 dark:text-nexus-300",
    secondary:
      "bg-surface-2 text-foreground",
    outline:
      "border border-border text-muted-foreground bg-transparent",
    success:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    warning:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    destructive:
      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    gradient:
      "bg-gradient-to-r from-nexus-500 to-cyan-500 text-white",
    lime:
      "bg-[#c8e83c] text-gray-900",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

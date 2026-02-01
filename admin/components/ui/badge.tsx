import * as React from "react";

import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  const variants: Record<BadgeVariant, string> = {
    default: "bg-gray-900 text-white shadow-sm",
    secondary: "bg-gray-50 text-gray-600 border border-gray-100",
    destructive: "bg-red-50 text-red-600 border border-red-100",
    outline: "border border-gray-100 bg-white text-gray-500",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-lg px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}

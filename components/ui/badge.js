import * as React from "react";
import { cn } from "../../lib/utils";

const badgeVariants = {
  default: "bg-gray-800 text-white",
  secondary: "bg-gray-100 text-gray-700",
  destructive: "bg-red-50 text-red-600 ring-1 ring-red-100",
  outline: "border border-gray-200 text-gray-600 bg-white",
  success: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
};

function Badge({ className, variant = "default", ...props }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-lg px-2 py-0.5 text-[11px] font-semibold tracking-wide",
        badgeVariants[variant] || badgeVariants.default,
        className
      )}
      {...props}
    />
  );
}

export { Badge };

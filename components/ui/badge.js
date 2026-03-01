import * as React from "react";
import { cn } from "../../lib/utils";

const badgeVariants = {
  default: "bg-gray-900 text-white hover:bg-gray-800",
  secondary: "bg-gray-100 text-gray-800 hover:bg-gray-200",
  destructive: "bg-red-100 text-red-700 hover:bg-red-200",
  outline: "border border-gray-200 text-gray-700",
};

function Badge({ className, variant = "default", ...props }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
        badgeVariants[variant] || badgeVariants.default,
        className
      )}
      {...props}
    />
  );
}

export { Badge };

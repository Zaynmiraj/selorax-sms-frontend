import * as React from "react";
import { cn } from "../../lib/utils";

const buttonVariants = {
  default: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-500/20",
  outline: "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 shadow-sm",
  ghost: "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
  destructive: "bg-red-600 text-white hover:bg-red-700 shadow-sm shadow-red-500/20",
};

const buttonSizes = {
  default: "h-10 px-5 py-2",
  sm: "h-8 px-3.5 text-[13px]",
  lg: "h-12 px-8",
  icon: "h-10 w-10",
};

const Button = React.forwardRef(
  ({ className, variant = "default", size = "default", disabled, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-xl text-sm font-semibold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]",
        buttonVariants[variant] || buttonVariants.default,
        buttonSizes[size] || buttonSizes.default,
        className
      )}
      disabled={disabled}
      {...props}
    />
  )
);
Button.displayName = "Button";

export { Button };

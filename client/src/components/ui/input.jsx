import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-9 w-full rounded-md border border-input bg-card px-3 py-1.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 " +
        "transition-colors duration-150 " +
        "hover:border-border/80 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary " +
        "disabled:cursor-not-allowed disabled:opacity-50 file:border-0 file:bg-transparent file:text-xs file:font-medium",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };

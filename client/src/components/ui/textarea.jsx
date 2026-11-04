import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-input bg-card px-3 py-2 text-xs sm:text-sm text-foreground " +
        "placeholder:text-muted-foreground/60 resize-y transition-colors duration-150 " +
        "hover:border-border/80 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary " +
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };

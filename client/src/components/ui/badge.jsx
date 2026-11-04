import * as React from "react";
import { cn } from "@/lib/utils";

const Badge = React.forwardRef(({ className, variant = "default", ...props }, ref) => {
  const variants = {
    default: "bg-primary/10 text-primary border border-primary/25",
    secondary: "bg-secondary text-secondary-foreground border border-border/80",
    destructive: "bg-destructive/10 text-destructive border border-destructive/25",
    outline: "text-muted-foreground border border-border bg-card",
    success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25",
  };

  return (
    <div
      ref={ref}
      className={cn(
        "inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium transition-colors font-mono tracking-tight",
        variants[variant] || variants.default,
        className
      )}
      {...props}
    />
  );
});
Badge.displayName = "Badge";

export { Badge };

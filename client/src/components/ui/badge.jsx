import * as React from "react";
import { cn } from "@/lib/utils";

const Badge = React.forwardRef(({ className, variant = "default", ...props }, ref) => {
  const variants = {
    default: "bg-primary/10 text-primary border border-primary/20",
    secondary: "bg-secondary text-secondary-foreground border border-border/40",
    destructive: "bg-destructive/10 text-destructive border border-destructive/20",
    outline: "text-muted-foreground border border-border/80 bg-background/50",
  };

  return (
    <div
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
        variants[variant],
        className
      )}
      {...props}
    />
  );
});
Badge.displayName = "Badge";

export { Badge };

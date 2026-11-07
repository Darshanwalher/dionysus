import * as React from "react";
import { cn } from "@/lib/utils";

const Badge = React.forwardRef(({ className, variant = "default", dot = false, children, ...props }, ref) => {
  const variants = {
    default: "bg-primary/10 text-primary border border-primary/20",
    secondary: "bg-secondary text-secondary-foreground border border-border/80",
    outline: "text-muted-foreground border border-border bg-card/60",
    success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25",
    warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25",
    destructive: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25",
    cyan: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/25",
    indigo: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/25",
    mono: "bg-secondary font-mono text-muted-foreground border border-border text-[10px]",
  };

  const dotColors = {
    default: "bg-primary",
    secondary: "bg-muted-foreground",
    outline: "bg-muted-foreground",
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    destructive: "bg-rose-500",
    cyan: "bg-sky-500",
    indigo: "bg-indigo-500",
    mono: "bg-muted-foreground",
  };

  return (
    <div
      ref={ref}
      className={cn(
        "inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[11px] font-medium transition-colors font-mono tracking-tight select-none",
        variants[variant] || variants.default,
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full shrink-0",
            dotColors[variant] || "bg-current"
          )}
        />
      )}
      {children}
    </div>
  );
});
Badge.displayName = "Badge";

export { Badge };

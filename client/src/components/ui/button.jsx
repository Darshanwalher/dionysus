import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs sm:text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none active:scale-[0.985]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:opacity-90 border border-primary/10 shadow-xs font-semibold",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/25",
        outline:
          "border border-border bg-card/80 text-foreground hover:bg-secondary hover:border-foreground/20 shadow-2xs",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-surface-hover border border-border/70",
        ghost:
          "text-muted-foreground hover:bg-secondary hover:text-foreground",
        link:
          "text-foreground underline-offset-4 hover:underline p-0 h-auto font-normal",
        subtle:
          "bg-muted/80 text-foreground hover:bg-muted border border-border/50",
      },
      size: {
        default: "h-8.5 px-3.5 py-1.5 text-xs sm:text-sm",
        sm: "h-7.5 rounded px-2.5 text-xs",
        xs: "h-6.5 rounded px-2 text-[11px]",
        lg: "h-10 rounded-md px-5 text-sm",
        icon: "h-8 w-8 p-0",
        "icon-sm": "h-7 w-7 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const Button = React.forwardRef(
  ({ className, variant, size, isLoading, children, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };

import { cn } from "@/lib/utils";

function Skeleton({ className, shimmer = false, ...props }) {
  return (
    <div
      className={cn(
        "rounded-md bg-muted/60",
        shimmer ? "skeleton-shimmer" : "animate-pulse",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };

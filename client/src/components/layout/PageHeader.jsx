import { cn } from "@/lib/utils";

export default function PageHeader({
  icon: Icon,
  title,
  description,
  actions,
  className,
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 pb-5 sm:flex-row sm:items-start sm:justify-between border-b border-border/80",
        className
      )}
    >
      <div className="flex items-start gap-3 min-w-0">
        {Icon ? (
          <div className="icon-tile shrink-0 mt-0.5">
            <Icon className="h-4 w-4" />
          </div>
        ) : null}
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate">
            {title}
          </h1>
          {description ? (
            <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {actions}
        </div>
      ) : null}
    </div>
  );
}

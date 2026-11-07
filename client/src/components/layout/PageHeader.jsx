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
        "flex flex-col gap-3 pb-5 sm:flex-row sm:items-center sm:justify-between border-b border-border",
        className
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        {Icon ? (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card shadow-2xs shrink-0 text-foreground">
            <Icon className="h-4.5 w-4.5" />
          </div>
        ) : null}
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground truncate font-sans">
            {title}
          </h1>
          {description ? (
            <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed truncate">
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

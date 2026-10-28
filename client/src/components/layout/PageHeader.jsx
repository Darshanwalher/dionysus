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
        "flex flex-col gap-4 pb-6 sm:flex-row sm:items-start sm:justify-between animate-fade-up border-b border-border/40",
        className
      )}
    >
      <div className="flex items-start gap-3">
        {Icon ? (
          <div className="icon-tile mt-0.5 shrink-0">
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {title}
          </h1>
          {description ? (
            <p className="mt-1 text-sm text-muted-foreground max-w-xl leading-relaxed">
              {description}
            </p>
          ) : null}
          <div className="accent-line mt-3 max-w-[100px]" />
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

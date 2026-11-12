import { Link } from "react-router-dom";
import { AlertCircle, AlertTriangle, Info, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

const SEVERITY = {
  critical: { icon: AlertCircle, label: "Critical", stripe: "bg-destructive", chip: "bg-destructive/10 text-destructive border-destructive/30" },
  high: { icon: AlertTriangle, label: "High", stripe: "bg-accent-amber", chip: "bg-accent-amber/10 text-accent-amber border-accent-amber/30" },
  default: { icon: Info, label: "Suggestion", stripe: "bg-primary", chip: "bg-primary/10 text-primary border-primary/30" },
};

/**
 * Compact quick-fix row with a severity stripe.
 * Props unchanged: fix { title, description, severity, scoreImpact, file }, projectId.
 */
export default function QuickFixCard({ fix, projectId }) {
  const s = SEVERITY[fix.severity] || SEVERITY.default;
  const Icon = s.icon;

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-3.5 pl-4 transition-colors hover:border-primary/40">
      <span aria-hidden="true" className={cn("absolute inset-y-0 left-0 w-[3px]", s.stripe)} />

      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
          <h4 className="truncate text-[13px] font-semibold text-foreground">{fix.title}</h4>
        </div>
        {fix.scoreImpact && (
          <span className="shrink-0 rounded-full border border-accent-emerald/30 bg-accent-emerald/10 px-2 py-0.5 text-[11px] font-semibold text-accent-emerald">
            {fix.scoreImpact}
          </span>
        )}
      </div>

      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{fix.description}</p>

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className={cn("shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium", s.chip)}>{s.label}</span>
          <span className="truncate font-mono text-[11px] text-muted-foreground" title={fix.file}>
            {fix.file}
          </span>
        </div>
        <Link
          to={`/projects/${projectId}/visualise`}
          className="flex shrink-0 items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
        >
          Inspect
          <ArrowUpRight className="h-3 w-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}
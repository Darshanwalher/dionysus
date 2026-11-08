import React from "react";
import { Link } from "react-router-dom";
import { AlertCircle, AlertTriangle, Info, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

/**
 * Actionable Quick Fix Card
 * Allows 1-click jump to file / visualization node
 */
export default function QuickFixCard({ fix, projectId }) {
  const getSeverityStyle = (sev) => {
    if (sev === "critical") {
      return {
        icon: AlertCircle,
        badgeClass: "bg-red-500/10 text-red-500 border-red-500/30",
        borderClass: "border-red-500/30",
      };
    }
    if (sev === "high") {
      return {
        icon: AlertTriangle,
        badgeClass: "bg-amber-500/10 text-amber-500 border-amber-500/30",
        borderClass: "border-amber-500/30",
      };
    }
    return {
      icon: Info,
      badgeClass: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
      borderClass: "border-border",
    };
  };

  const style = getSeverityStyle(fix.severity);
  const Icon = style.icon;

  return (
    <div className={`p-3.5 rounded-xl border bg-card/70 hover:bg-card transition-all flex flex-col justify-between gap-2.5 shadow-2xs ${style.borderClass}`}>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <Icon className="h-4 w-4 shrink-0 text-foreground/80" />
            <h4 className="text-xs font-bold text-foreground truncate">{fix.title}</h4>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Badge variant="outline" className={`text-[9px] font-mono uppercase ${style.badgeClass}`}>
              {fix.severity}
            </Badge>
            <Badge variant="outline" className="text-[9px] font-mono bg-emerald-500/10 text-emerald-500 border-emerald-500/30 font-semibold">
              {fix.scoreImpact}
            </Badge>
          </div>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          {fix.description}
        </p>
      </div>

      <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[11px] font-mono">
        <span className="text-muted-foreground truncate max-w-[200px]" title={fix.file}>
          {fix.file}
        </span>
        <Link
          to={`/projects/${projectId}/visualise`}
          className="flex items-center gap-1 text-primary hover:underline font-semibold"
        >
          <span>Inspect DAG</span>
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}

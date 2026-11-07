import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import {
  FileCode,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

const EXT_COLORS = {
  ".js": { text: "text-amber-600 dark:text-amber-400", border: "border-amber-500/30", bg: "bg-amber-500/10", accent: "#f59e0b" },
  ".jsx": { text: "text-sky-600 dark:text-sky-400", border: "border-sky-500/30", bg: "bg-sky-500/10", accent: "#0284c7" },
  ".ts": { text: "text-blue-600 dark:text-blue-400", border: "border-blue-500/30", bg: "bg-blue-500/10", accent: "#3b82f6" },
  ".tsx": { text: "text-indigo-600 dark:text-indigo-400", border: "border-indigo-500/30", bg: "bg-indigo-500/10", accent: "#6366f1" },
  ".mjs": { text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-500/30", bg: "bg-emerald-500/10", accent: "#10b981" },
  ".cjs": { text: "text-orange-600 dark:text-orange-400", border: "border-orange-500/30", bg: "bg-orange-500/10", accent: "#f97316" },
};

function DependencyNode({ data, selected }) {
  const extStyle = EXT_COLORS[data.extension] || {
    text: "text-muted-foreground",
    border: "border-border",
    bg: "bg-secondary",
    accent: "#64748b",
  };

  const isCircular = data.isCircular;
  const incoming = data.incomingCount ?? 0;
  const outgoing = data.outgoingCount ?? 0;

  // Calculate dependency complexity score (100 is best, lower if excessive deps or circular)
  const complexityScore = isCircular
    ? 25
    : Math.max(30, 100 - (outgoing > 5 ? (outgoing - 5) * 12 : 0));

  return (
    <div
      className={`group relative w-[275px] rounded-xl border transition-all duration-200 select-none flex flex-col justify-between p-3.5 bg-card text-card-foreground shadow-sm hover:shadow-md cursor-pointer ${
        isCircular
          ? "border-rose-500/80 ring-2 ring-rose-500/25 shadow-md scale-[1.01]"
          : selected
          ? "border-primary ring-2 ring-primary/25 shadow-lg scale-[1.01] z-30"
          : "border-border hover:border-foreground/30"
      }`}
    >
      {/* 1. Left Vertical Accent Lifeline Strip (Reference 1) */}
      <div
        className="absolute left-0 inset-y-0 w-1.5 rounded-l-xl transition-all group-hover:w-2"
        style={{ backgroundColor: isCircular ? "#f43f5e" : extStyle.accent }}
      />

      {/* Target connection handle (Input) */}
      <Handle
        type="target"
        position={data.targetPosition === "left" ? Position.Left : Position.Top}
        className="!h-3 !w-3 !border-2 !border-background !bg-muted-foreground group-hover:!bg-primary transition-all !rounded-full shadow-xs"
      />

      {/* 2. Top Header: File Icon + Ext Tag + "Details ↗" (Reference 2) */}
      <div className="flex items-center justify-between gap-2 pl-1 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <div
            className="flex h-5.5 w-5.5 flex-shrink-0 items-center justify-center rounded-md border shadow-2xs"
            style={{
              backgroundColor: extStyle.bg,
              borderColor: extStyle.border,
            }}
          >
            <FileCode className={`h-3.5 w-3.5 ${extStyle.text}`} />
          </div>

          <span className="text-[10px] font-mono font-semibold uppercase px-1.5 py-0.2 rounded border bg-secondary/60 text-foreground border-border truncate">
            {data.extension ? data.extension.replace(".", "") : "file"}
          </span>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-muted-foreground group-hover:text-foreground font-mono transition-colors">
          <span>Details</span>
          <ArrowUpRight className="h-3 w-3 opacity-60 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      {/* 3. Title & Path */}
      <div className="pl-1 mb-2.5">
        <h4 className="text-sm font-bold text-foreground tracking-tight leading-snug truncate font-mono">
          {data.label}
        </h4>
        <p className="text-[11px] text-muted-foreground font-mono truncate leading-normal mt-0.5" title={data.path}>
          {data.path || data.directory || "root"}
        </p>
      </div>

      {/* 4. Horizontal Complexity / Health Bar (Reference 2) */}
      <div className="pl-1 mb-2.5">
        <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground mb-1">
          <span>{isCircular ? "Circular Alert" : "Dependency Health"}</span>
          <span className={isCircular ? "text-rose-500 font-bold" : "text-foreground font-semibold"}>
            {complexityScore}%
          </span>
        </div>
        <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${complexityScore}%`,
              backgroundColor: isCircular ? "#f43f5e" : extStyle.accent,
            }}
          />
        </div>
      </div>

      {/* 5. Bottom 3-Column Metrics Row (Reference 2) */}
      <div className="grid grid-cols-3 pt-2 border-t border-border/70 text-[10px] font-mono pl-1">
        <div>
          <span className="text-muted-foreground block text-[9px] uppercase tracking-wider">
            Callers
          </span>
          <span className="font-bold text-foreground text-xs">{incoming}</span>
        </div>

        <div>
          <span className="text-muted-foreground block text-[9px] uppercase tracking-wider">
            Deps
          </span>
          <span className="font-bold text-foreground text-xs">{outgoing}</span>
        </div>

        <div>
          <span className="text-muted-foreground block text-[9px] uppercase tracking-wider">
            Cycle Risk
          </span>
          <span
            className={`font-bold inline-flex items-center gap-1 text-[10px] ${
              isCircular
                ? "text-rose-600 dark:text-rose-400"
                : "text-emerald-600 dark:text-emerald-400"
            }`}
          >
            {isCircular ? (
              <>
                <AlertTriangle className="h-3 w-3" />
                Cycle!
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3 w-3" />
                Clean
              </>
            )}
          </span>
        </div>
      </div>

      {/* Source connection handle (Output) */}
      <Handle
        type="source"
        position={data.sourcePosition === "right" ? Position.Right : Position.Bottom}
        className="!h-3 !w-3 !border-2 !border-background !bg-muted-foreground group-hover:!bg-primary transition-all !rounded-full shadow-xs"
      />
    </div>
  );
}

export default memo(DependencyNode);

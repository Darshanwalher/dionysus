import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { getComponentMeta } from "@/lib/graphStyles";
import { ArrowUpRight, CheckCircle2, AlertCircle } from "lucide-react";

/**
 * Modern ArchitectureNode inspired by DoubleLoop / Linear metric & causal flow cards
 * Matches the reference design with:
 * - Left vertical accent lifeline strip (Reference 1)
 * - Category badge + icon + "Details ↗" link
 * - High-contrast title and responsibility description
 * - Horizontal status / progress indicator bar (Reference 2)
 * - 3-column mini metrics row (Callers / Deps / Status)
 * - Invisible handles so sharp edge arrowheads connect cleanly to borders
 */
function ArchitectureNode({ data, selected }) {
  const meta = getComponentMeta(data.type);
  const Icon = meta.icon;

  // Incoming and outgoing connections count
  const incoming = data.incomingCount ?? data.inDegree ?? (data.dependencies ? data.dependencies.length : 1);
  const outgoing = data.outgoingCount ?? data.outDegree ?? 1;

  // Health calculation / status score
  const isHealthy = !data.isCircular && (data.errorCount || 0) === 0;
  const healthPercent = Math.min(100, Math.max(35, 100 - (outgoing > 6 ? (outgoing - 6) * 10 : 0)));

  return (
    <div
      className={`group relative w-[290px] rounded-xl border transition-all duration-200 select-none flex flex-col justify-between p-3.5 bg-card text-card-foreground shadow-sm hover:shadow-md cursor-pointer ${
        selected
          ? "border-primary ring-2 ring-primary/25 shadow-lg scale-[1.01] z-30"
          : "border-border hover:border-foreground/30"
      }`}
    >
      {/* 1. Left Vertical Accent Lifeline Strip (Reference 1) */}
      <div
        className="absolute left-0 inset-y-0 w-1.5 rounded-l-xl transition-all group-hover:w-2"
        style={{ backgroundColor: meta.color }}
      />

      {/* Target connection handle (Input) - invisible so arrowhead connects cleanly to card */}
      <Handle
        type="target"
        position={data.targetPosition === "left" ? Position.Left : Position.Top}
        className="!opacity-0 !w-1 !h-1 !border-0 !pointer-events-none"
      />

      {/* 2. Top Header: Category Icon + Tag Badge + "Details ↗" (Reference 2) */}
      <div className="flex items-center justify-between gap-2 pl-1 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <div
            className="flex h-5.5 w-5.5 flex-shrink-0 items-center justify-center rounded-md border shadow-2xs"
            style={{
              backgroundColor: meta.bg,
              borderColor: meta.border,
              color: meta.color,
            }}
          >
            <Icon className="h-3.5 w-3.5" />
          </div>

          <span
            className="text-[10px] font-mono font-semibold uppercase tracking-wider truncate"
            style={{ color: meta.color }}
          >
            {meta.label}
          </span>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-muted-foreground group-hover:text-foreground font-mono transition-colors">
          <span>Details</span>
          <ArrowUpRight className="h-3 w-3 opacity-60 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      {/* 3. Title & Primary Responsibility */}
      <div className="pl-1 mb-2.5">
        <h4 className="text-sm font-bold text-foreground tracking-tight leading-snug truncate font-sans">
          {data.label}
        </h4>
        <p className="text-xs text-muted-foreground line-clamp-1 leading-normal mt-0.5 font-normal">
          {data.responsibility || data.description || "Core application subsystem component."}
        </p>
      </div>

      {/* 4. Horizontal Status / Health Bar (Reference 2) */}
      <div className="pl-1 mb-2.5">
        <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground mb-1">
          <span>Coupling / Health</span>
          <span className="font-semibold text-foreground">{healthPercent}%</span>
        </div>
        <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${healthPercent}%`,
              backgroundColor: isHealthy ? meta.color : "#f43f5e",
            }}
          />
        </div>
      </div>

      {/* 5. Bottom 3-Column Metrics Row (Reference 2) */}
      <div className="grid grid-cols-3 pt-2 border-t border-border/70 text-[10px] font-mono pl-1">
        <div>
          <span className="text-muted-foreground block text-[9px] uppercase tracking-wider">
            Inbound
          </span>
          <span className="font-bold text-foreground text-xs">{incoming}</span>
        </div>

        <div>
          <span className="text-muted-foreground block text-[9px] uppercase tracking-wider">
            Outbound
          </span>
          <span className="font-bold text-foreground text-xs">{outgoing}</span>
        </div>

        <div>
          <span className="text-muted-foreground block text-[9px] uppercase tracking-wider">
            Status
          </span>
          <span
            className={`font-bold inline-flex items-center gap-1 text-[10px] ${
              isHealthy
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {isHealthy ? (
              <>
                <CheckCircle2 className="h-3 w-3" />
                Active
              </>
            ) : (
              <>
                <AlertCircle className="h-3 w-3" />
                Issue
              </>
            )}
          </span>
        </div>
      </div>

      {/* Source connection handle (Output) - invisible so lines originate cleanly from card */}
      <Handle
        type="source"
        position={data.sourcePosition === "right" ? Position.Right : Position.Bottom}
        className="!opacity-0 !w-1 !h-1 !border-0 !pointer-events-none"
      />
    </div>
  );
}

export default memo(ArchitectureNode);

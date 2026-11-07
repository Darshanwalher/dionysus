import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import {
  FileCode,
  ArrowDownLeft,
  ArrowUpRight,
  AlertTriangle,
  Radio,
  ArrowRight,
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
  const isIsolated = data.incomingCount === 0 && data.outgoingCount === 0;

  return (
    <div
      className={`group relative w-[260px] h-[85px] rounded-lg border transition-all duration-150 select-none flex flex-col justify-between p-2.5 bg-card shadow-2xs card-sheen ${
        isCircular
          ? "border-rose-500/80 ring-2 ring-rose-500/20 shadow-xs scale-[1.01]"
          : selected
            ? "border-foreground ring-2 ring-foreground/20 shadow-sm scale-[1.01] z-20"
            : "border-border hover:border-foreground/30 hover:shadow-xs"
      }`}
    >
      {/* Category indicator strip */}
      <div
        className="absolute left-0 inset-y-0 w-1 rounded-l-md"
        style={{ backgroundColor: isCircular ? "#f43f5e" : extStyle.accent }}
      />

      <Handle
        type="target"
        position={data.targetPosition === "left" ? Position.Left : Position.Top}
        className="!h-2.5 !w-2.5 !border-2 !border-background !bg-muted-foreground group-hover:!bg-foreground transition-transform"
      />

      {/* Header: File Name and Extension Badge */}
      <div className="flex items-center justify-between gap-1.5 pl-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <div
            className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border"
            style={{
              backgroundColor: extStyle.bg,
              borderColor: extStyle.border,
            }}
          >
            <FileCode className={`h-3 w-3 ${extStyle.text}`} />
          </div>

          <span className="text-xs font-bold text-foreground font-mono truncate">
            {data.label}
          </span>
        </div>

        <span
          className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border font-semibold flex-shrink-0 ${extStyle.text} ${extStyle.border} ${extStyle.bg}`}
        >
          {data.extension || "code"}
        </span>
      </div>

      {/* Path preview */}
      <p className="text-[10px] text-muted-foreground font-mono truncate pl-1.5" title={data.path}>
        {data.path}
      </p>

      {/* Stats footer: Incoming / Outgoing pills & Flags */}
      <div className="flex items-center justify-between pt-1 border-t border-border text-[10px] pl-1.5">
        <div className="flex items-center gap-1.5 font-mono">
          <span
            className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-semibold px-1 py-0.2 rounded bg-emerald-500/10 border border-emerald-500/20"
            title={`${data.incomingCount} callers import this`}
          >
            <ArrowDownLeft className="h-3 w-3" />
            <span>{data.incomingCount}</span>
          </span>

          <span
            className="flex items-center gap-0.5 text-sky-600 dark:text-sky-400 font-semibold px-1 py-0.2 rounded bg-sky-500/10 border border-sky-500/20"
            title={`Imports ${data.outgoingCount} files`}
          >
            <ArrowUpRight className="h-3 w-3" />
            <span>{data.outgoingCount}</span>
          </span>
        </div>

        {isCircular ? (
          <span className="flex items-center gap-1 font-mono text-[9px] text-rose-500 font-bold bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
            <AlertTriangle className="h-2.5 w-2.5" />
            Cycle
          </span>
        ) : isIsolated ? (
          <span className="flex items-center gap-1 font-mono text-[9px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded border border-border">
            <Radio className="h-2.5 w-2.5" />
            Isolated
          </span>
        ) : (
          <span className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 text-[10px] text-foreground font-sans font-medium">
            Details <ArrowRight className="h-2.5 w-2.5" />
          </span>
        )}
      </div>

      <Handle
        type="source"
        position={data.sourcePosition === "right" ? Position.Right : Position.Bottom}
        className="!h-2.5 !w-2.5 !border-2 !border-background !bg-muted-foreground group-hover:!bg-foreground transition-transform"
      />
    </div>
  );
}

export default memo(DependencyNode);

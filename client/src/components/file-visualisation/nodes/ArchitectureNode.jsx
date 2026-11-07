import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { getComponentMeta } from "@/lib/graphStyles";
import { FileText, ArrowUpRight } from "lucide-react";

function ArchitectureNode({ data, selected }) {
  const meta = getComponentMeta(data.type);
  const Icon = meta.icon;

  return (
    <div
      className={`group relative w-[270px] h-[105px] rounded-lg border transition-all duration-150 select-none flex flex-col justify-between p-3 card-sheen bg-card shadow-2xs ${
        selected
          ? "border-foreground ring-2 ring-foreground/20 shadow-md scale-[1.01] z-20"
          : "border-border hover:border-foreground/30 hover:shadow-xs"
      }`}
    >
      {/* Category indicator strip */}
      <div
        className="absolute left-0 inset-y-0 w-1 rounded-l-md"
        style={{ backgroundColor: meta.color }}
      />

      {/* Target connection handle */}
      <Handle
        type="target"
        position={data.targetPosition === "left" ? Position.Left : Position.Top}
        className="!h-2.5 !w-2.5 !border-2 !border-background !bg-muted-foreground group-hover:!bg-foreground transition-transform"
      />

      {/* Header: Icon, Label, and Type Badge */}
      <div className="flex items-start justify-between gap-2 pl-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded border shadow-2xs"
            style={{
              backgroundColor: meta.bg,
              borderColor: meta.border,
              color: meta.color,
            }}
          >
            <Icon className="h-3.5 w-3.5" />
          </div>

          <div className="min-w-0">
            <h4 className="text-xs font-bold text-foreground tracking-tight truncate leading-tight font-sans">
              {data.label}
            </h4>
          </div>
        </div>

        <span
          className={`text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border font-semibold flex-shrink-0 ${meta.badge}`}
        >
          {meta.label}
        </span>
      </div>

      {/* Responsibility text */}
      <p className="text-[11px] text-muted-foreground line-clamp-1 leading-snug pl-1.5 font-normal">
        {data.responsibility || data.description || "Core application subsystem."}
      </p>

      {/* Footer: Monospace Path and Action */}
      <div className="flex items-center justify-between pt-1.5 border-t border-border text-[10px] font-mono text-muted-foreground pl-1.5">
        <span className="flex items-center gap-1 truncate max-w-[200px]" title={data.path}>
          <FileText className="h-3 w-3 flex-shrink-0 opacity-60" />
          <span className="truncate">{data.path || "virtual"}</span>
        </span>

        <span className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 text-foreground">
          <ArrowUpRight className="h-3 w-3" />
        </span>
      </div>

      {/* Source connection handle */}
      <Handle
        type="source"
        position={data.sourcePosition === "right" ? Position.Right : Position.Bottom}
        className="!h-2.5 !w-2.5 !border-2 !border-background !bg-muted-foreground group-hover:!bg-foreground transition-transform"
      />
    </div>
  );
}

export default memo(ArchitectureNode);

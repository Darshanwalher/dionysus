import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { Database, Key, Link2, AlertTriangle, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";

/**
 * TableEntityNode - Interactive ER Diagram Card for Database Schema Intelligence
 * Features:
 * - Table header with Collection/Model name and field count
 * - Field list showing Primary Key (PK), Foreign Key (FK), Index (IDX), data types
 * - Diagnostic alert badges for missing indexes or unbounded arrays
 * - Invisible handles for clean arrowhead snapping with PillFlowEdge
 */
function TableEntityNode({ data, selected }) {
  const {
    name = "Collection",
    fields = [],
    diagnostics = [],
    sourceFile,
    description,
    isTargeted,
  } = data;

  const warningCount = diagnostics.filter((d) => d.type === "warning" || d.type === "error").length;
  const infoCount = diagnostics.filter((d) => d.type === "info").length;

  return (
    <div
      className={`group relative w-[300px] rounded-xl border bg-card text-foreground transition-all duration-200 shadow-xs select-none flex flex-col overflow-hidden ${
        selected
          ? "border-primary ring-2 ring-primary/25 shadow-lg scale-[1.01] z-30"
          : isTargeted
          ? "border-amber-500/80 ring-2 ring-amber-500/20"
          : "border-border hover:border-foreground/30"
      }`}
    >
      {/* Left accent strip for DB entities */}
      <div className="absolute left-0 inset-y-0 w-1.5 bg-gradient-to-b from-indigo-500 to-cyan-500 rounded-l-xl" />

      {/* Invisible Handles */}
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!opacity-0 !w-1 !h-1 !border-0 !pointer-events-none"
      />
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="!opacity-0 !w-1 !h-1 !border-0 !pointer-events-none"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!opacity-0 !w-1 !h-1 !border-0 !pointer-events-none"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!opacity-0 !w-1 !h-1 !border-0 !pointer-events-none"
      />

      {/* Header */}
      <div className="px-3.5 pt-3 pb-2.5 border-b border-border bg-secondary/40 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0 pl-1">
          <div className="h-6 w-6 rounded-md bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
            <Database className="h-3.5 w-3.5 text-indigo-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-bold text-xs text-foreground tracking-tight truncate">
                {name}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-secondary border border-border text-muted-foreground">
                {fields.length} cols
              </span>
            </div>
            {sourceFile && (
              <p className="text-[10px] text-muted-foreground font-mono truncate" title={sourceFile}>
                {sourceFile}
              </p>
            )}
          </div>
        </div>

        {/* Warning Badges */}
        {warningCount > 0 && (
          <Badge
            variant="outline"
            className="h-5 px-1.5 text-[10px] font-mono bg-amber-500/10 text-amber-500 border-amber-500/30 gap-1 flex items-center"
            title={`${warningCount} schema diagnostic issue(s)`}
          >
            <AlertTriangle className="h-2.5 w-2.5" />
            <span>{warningCount}</span>
          </Badge>
        )}
      </div>

      {description && (
        <div className="px-3.5 py-1.5 bg-secondary/15 border-b border-border text-[11px] text-muted-foreground italic leading-tight">
          {description}
        </div>
      )}

      {/* Field Rows */}
      <div className="divide-y divide-border/60 max-h-[260px] overflow-y-auto px-2 py-1 scrollbar-thin">
        {fields.map((field, idx) => (
          <div
            key={field.name || idx}
            className="flex items-center justify-between py-1 px-1.5 text-xs hover:bg-secondary/50 rounded transition-colors"
          >
            <div className="flex items-center gap-1.5 min-w-0">
              {field.isPrimary ? (
                <span title="Primary Key (PK)">
                  <Key className="h-3 w-3 text-amber-400 shrink-0" />
                </span>
              ) : field.isForeignKey ? (
                <span title={`Foreign Key: references ${field.refModel || 'Entity'}`}>
                  <Link2 className="h-3 w-3 text-cyan-400 shrink-0" />
                </span>
              ) : (
                <span className="w-3 inline-block" />
              )}

              <span
                className={`font-mono text-[11px] truncate ${
                  field.isPrimary ? "font-bold text-foreground" : "text-foreground/90"
                }`}
              >
                {field.name}
              </span>

              {field.isIndex && !field.isPrimary && (
                <span className="text-[8px] font-mono uppercase px-1 py-0.2 rounded bg-muted text-muted-foreground border border-border/40 font-semibold">
                  IDX
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 shrink-0 ml-2">
              <span className="text-[10px] font-mono text-muted-foreground/80">
                {field.type}
              </span>
              {field.required && (
                <span className="text-red-500 text-[11px] font-bold" title="Required">
                  *
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Summary */}
      <div className="px-3 py-1.5 bg-secondary/20 border-t border-border flex items-center justify-between text-[10px] text-muted-foreground font-mono">
        <div className="flex items-center gap-2">
          <span>Indexes: {fields.filter((f) => f.isIndex || f.unique || f.isPrimary).length}</span>
          <span>•</span>
          <span>Refs: {fields.filter((f) => f.isForeignKey).length}</span>
        </div>
        {infoCount > 0 && (
          <span className="text-cyan-400 flex items-center gap-1">
            <Info className="h-2.5 w-2.5" /> {infoCount} hints
          </span>
        )}
      </div>
    </div>
  );
}

export default memo(TableEntityNode);

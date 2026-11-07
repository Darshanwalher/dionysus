import React, { memo } from "react";
import {
  EdgeLabelRenderer,
  getBezierPath,
  getSmoothStepPath,
  Position,
} from "@xyflow/react";

/**
 * Custom PillFlowEdge inspired by modern causal & data flow diagrams (DoubleLoop / Linear)
 * Features:
 * - Curved, dotted flowing paths with ample clearance
 * - Integrated, high-visibility SVG arrowheads that are never hidden by nodes or handles
 * - Inline rounded pill badges with correlation / status scores
 * - Full Dark Mode & Light Mode support
 */
function PillFlowEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition = Position.Bottom,
  targetPosition = Position.Top,
  style = {},
  data = {},
  selected,
}) {
  const isBezier = data.curveType !== "smoothstep";
  const [edgePath, labelX, labelY] = isBezier
    ? getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
        curvature: 0.3,
      })
    : getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
        borderRadius: 14,
      });

  const isCircular = data.isCircular || data.type === "circular";
  const score = data.score !== undefined ? data.score : (isCircular ? -0.64 : null);
  const isPositive = score !== null && score >= 0;
  const isNegative = score !== null && score < 0;

  const pillLabel =
    data.pillLabel ||
    (score !== null
      ? (score > 0 ? `+${score}` : `${score}`)
      : data.label || "");

  // Determine stroke color and dotted styling
  let strokeColor = style.stroke || "#94a3b8"; // default slate
  let pillStyleClass = "bg-secondary text-foreground border-border";

  if (isCircular || isNegative) {
    strokeColor = "#f43f5e"; // Rose / Red
    pillStyleClass =
      "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/40";
  } else if (isPositive) {
    strokeColor = "#10b981"; // Emerald / Green
    pillStyleClass =
      "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40";
  } else if (data.type === "api" || data.type === "http") {
    strokeColor = "#0284c7"; // Sky / Blue
    pillStyleClass =
      "bg-sky-50 text-sky-700 border-sky-300 dark:bg-sky-500/20 dark:text-sky-300 dark:border-sky-500/40";
  } else if (data.type === "database") {
    strokeColor = "#d97706"; // Amber
    pillStyleClass =
      "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40";
  } else if (data.type === "event") {
    strokeColor = "#a855f7"; // Purple
    pillStyleClass =
      "bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/40";
  }

  const strokeDash = style.strokeDasharray || "4 4";
  const markerId = `flow-arrow-${id.replace(/[^a-zA-Z0-9-_]/g, "_")}`;

  return (
    <>
      {/* High-visibility Custom SVG Arrowhead Marker definition */}
      <defs>
        <marker
          id={markerId}
          viewBox="0 0 12 12"
          refX="9"
          refY="6"
          markerWidth="10"
          markerHeight="10"
          orient="auto-start-reverse"
        >
          <path
            d="M 1 2 L 10 6 L 1 10 Z"
            fill={strokeColor}
            stroke={strokeColor}
            strokeWidth="1"
            strokeLinejoin="round"
          />
        </marker>
      </defs>

      {/* Glow path on hover/selection */}
      {selected && (
        <path
          d={edgePath}
          fill="none"
          stroke={strokeColor}
          strokeWidth={7}
          strokeOpacity={0.25}
          className="transition-all"
        />
      )}

      {/* Main Dotted Curved Edge with visible arrowhead */}
      <path
        id={id}
        d={edgePath}
        fill="none"
        stroke={strokeColor}
        strokeWidth={selected ? 2.6 : 2}
        strokeDasharray={strokeDash}
        strokeLinecap="round"
        className={`transition-all ${data.animated ? "animate-pulse" : ""}`}
        markerEnd={`url(#${markerId})`}
      />

      {/* Floating Pill Badge at midpoint with clean shadow */}
      {pillLabel && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "all",
            }}
            className="nodrag nopan select-none group/pill cursor-pointer z-10"
            title={data.description || data.label || `Data flow: ${pillLabel}`}
          >
            <div
              className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border shadow-xs transition-transform duration-150 group-hover/pill:scale-110 ${pillStyleClass}`}
            >
              <span>{pillLabel}</span>
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export default memo(PillFlowEdge);

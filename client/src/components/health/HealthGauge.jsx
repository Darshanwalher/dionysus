import React from "react";

/**
 * Radial gauge component displaying 0-100 score and letter grade (A+, A, B, C, D, F)
 */
export default function HealthGauge({ score = 0, grade = "A", size = 180, strokeWidth = 14 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(100, Math.max(0, score));
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const getColor = (s) => {
    if (s >= 90) return { stroke: "#10b981", text: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/30" };
    if (s >= 80) return { stroke: "#06b6d4", text: "text-cyan-500", bg: "bg-cyan-500/10", border: "border-cyan-500/30" };
    if (s >= 70) return { stroke: "#f59e0b", text: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/30" };
    if (s >= 60) return { stroke: "#f97316", text: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/30" };
    return { stroke: "#ef4444", text: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/30" };
  };

  const style = getColor(score);

  return (
    <div className="relative flex flex-col items-center justify-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="w-full h-full -rotate-90 transform" viewBox={`0 0 ${size} ${size}`}>
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-secondary opacity-80"
          />
          {/* Animated Value Arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={style.stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Inner Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className={`text-4xl font-extrabold font-mono tracking-tight ${style.text}`}>
            {score}
          </span>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
              Score
            </span>
            <span
              className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full border ${style.bg} ${style.border} ${style.text}`}
            >
              Grade {grade}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}


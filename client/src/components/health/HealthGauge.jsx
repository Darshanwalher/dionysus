import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { CountUp, prefersReduced } from "@/components/motion";
import { cn } from "@/lib/utils";

/** One place that decides how a 0-100 score looks. Uses theme tokens only. */
export const scoreTone = (s) => {
  if (s >= 85) return { text: "text-accent-emerald", bar: "bg-accent-emerald", soft: "bg-accent-emerald/10", border: "border-accent-emerald/30", stroke: "var(--accent-emerald)", label: "Healthy" };
  if (s >= 70) return { text: "text-primary", bar: "bg-primary", soft: "bg-primary/10", border: "border-primary/30", stroke: "var(--primary)", label: "Good" };
  if (s >= 55) return { text: "text-accent-amber", bar: "bg-accent-amber", soft: "bg-accent-amber/10", border: "border-accent-amber/30", stroke: "var(--accent-amber)", label: "Needs attention" };
  return { text: "text-destructive", bar: "bg-destructive", soft: "bg-destructive/10", border: "border-destructive/30", stroke: "var(--destructive)", label: "At risk" };
};

/**
 * Radial score gauge with a tick ring. The arc sweeps in and the number counts up.
 * Props are unchanged: score, grade, size, strokeWidth.
 */
export default function HealthGauge({ score = 0, grade = "A", size = 200, strokeWidth = 14 }) {
  const arc = useRef(null);
  const tone = scoreTone(score);
  const progress = Math.min(100, Math.max(0, score));
  const ringGap = 14; // room for the tick ring
  const radius = (size - strokeWidth) / 2 - ringGap;
  const circumference = 2 * Math.PI * radius;
  const target = circumference - (progress / 100) * circumference;
  const c = size / 2;
  const TICKS = 48;

  useLayoutEffect(() => {
    if (!arc.current) return;
    if (prefersReduced()) {
      arc.current.style.strokeDashoffset = target;
      return;
    }
    const t = gsap.fromTo(
      arc.current,
      { strokeDashoffset: circumference },
      { strokeDashoffset: target, duration: 1.4, ease: "power3.out" }
    );
    return () => t.kill();
  }, [circumference, target]);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="h-full w-full -rotate-90" viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`Health score ${score} out of 100, grade ${grade}`}>
        {Array.from({ length: TICKS }).map((_, i) => {
          const a = (i / TICKS) * Math.PI * 2;
          const r1 = radius + strokeWidth / 2 + 5;
          const r2 = r1 + 5;
          const filled = (i / TICKS) * 100 < progress;
          return (
            <line
              key={i}
              x1={c + Math.cos(a) * r1}
              y1={c + Math.sin(a) * r1}
              x2={c + Math.cos(a) * r2}
              y2={c + Math.sin(a) * r2}
              strokeWidth={1.5}
              strokeLinecap="round"
              style={{ stroke: filled ? tone.stroke : "var(--border)" }}
            />
          );
        })}
        <circle cx={c} cy={c} r={radius} fill="none" strokeWidth={strokeWidth} style={{ stroke: "var(--secondary)" }} />
        <circle
          ref={arc}
          cx={c}
          cy={c}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
          style={{ stroke: tone.stroke }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className={cn("text-5xl font-extrabold tabular-nums tracking-tight", tone.text)}>
          <CountUp value={score} duration={1.4} />
        </span>
        <span className="mt-0.5 text-xs text-muted-foreground">out of 100</span>
        <span className={cn("mt-2 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold", tone.soft, tone.border, tone.text)}>
          Grade {grade}
        </span>
      </div>
    </div>
  );
}
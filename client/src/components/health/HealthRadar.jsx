import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { prefersReduced } from "@/components/motion";

/** Radar chart of the pillar scores. items: [{ short, score }] */
export default function HealthRadar({ items = [] }) {
  const ref = useRef(null);
  const C = 150;
  const R = 100;
  const n = items.length || 1;
  const pt = (i, v) => {
    const a = (-90 + (360 / n) * i) * (Math.PI / 180);
    return [C + ((R * v) / 100) * Math.cos(a), C + ((R * v) / 100) * Math.sin(a)];
  };
  const poly = (vals) => vals.map((v, i) => pt(i, v).join(",")).join(" ");

  useLayoutEffect(() => {
    if (!ref.current || prefersReduced()) return;
    const ctx = gsap.context(() => {
      gsap.fromTo("[data-poly]", { scale: 0, opacity: 0, svgOrigin: `${C} ${C}` }, { scale: 1, opacity: 1, svgOrigin: `${C} ${C}`, duration: 1, ease: "power3.out" });
      gsap.fromTo("[data-dot]", { opacity: 0 }, { opacity: 1, duration: 0.4, stagger: 0.08, delay: 0.7 });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <svg ref={ref} viewBox="0 0 300 300" className="mx-auto w-full max-w-[300px]" role="img" aria-label="Pillar scores radar chart">
      {[25, 50, 75, 100].map((r) => (
        <polygon key={r} points={poly(items.map(() => r))} className="fill-none stroke-border" strokeWidth={1} />
      ))}
      {items.map((_, i) => (
        <line key={i} x1={C} y1={C} x2={pt(i, 100)[0]} y2={pt(i, 100)[1]} className="stroke-border" strokeWidth={1} />
      ))}
      <polygon data-poly points={poly(items.map((it) => it.score))} className="fill-primary/20 stroke-primary" strokeWidth={2} strokeLinejoin="round" />
      {items.map((it, i) => {
        const [x, y] = pt(i, it.score);
        const [lx, ly] = pt(i, 130);
        return (
          <g key={it.short}>
            <circle data-dot cx={x} cy={y} r={3.5} className="fill-primary" />
            <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" className="fill-muted-foreground" fontSize="10.5">
              {it.short}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
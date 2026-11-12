/**
 * Dionysus motion toolkit
 * Place at: src/components/motion/index.jsx
 * Import:   import { SplitText, SpotlightCard, ... } from "@/components/motion";
 *
 * Rules every helper follows:
 * - safe under React Strict Mode (effects run twice in dev): animations live in
 *   gsap.context(...) and are reverted on cleanup, or use fromTo
 * - skipped when the user prefers reduced motion
 * - no layout work on scroll or mousemove beyond transforms
 */
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

export const prefersReduced = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ───────────── Numbers ───────────── */

/** Number that counts up once when it first appears. */
export function CountUp({ value, duration = 1 }) {
  const target = Number(value) || 0;
  const [n, setN] = useState(prefersReduced() ? target : 0);
  useEffect(() => {
    if (prefersReduced()) {
      setN(target);
      return;
    }
    const o = { v: 0 };
    const t = gsap.to(o, {
      v: target,
      duration,
      ease: "power2.out",
      onUpdate: () => setN(Math.round(o.v)),
    });
    return () => t.kill();
  }, [target, duration]);
  return <>{n.toLocaleString()}</>;
}

/** Tiny line chart that draws itself. `data` is an array of numbers. */
export function Sparkline({ data = [], className }) {
  const line = useRef(null);
  const area = useRef(null);
  const W = 120;
  const H = 24;
  const max = Math.max(1, ...data);
  const step = data.length > 1 ? W / (data.length - 1) : W;
  const pts = data.map((v, i) => [i * step, H - 3 - (v / max) * (H - 6)]);
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const fill = pts.length ? `${d} L${W} ${H} L0 ${H} Z` : "";

  useLayoutEffect(() => {
    if (prefersReduced() || !line.current) return;
    const a = gsap.fromTo(line.current, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.1, ease: "power2.out" });
    const b = gsap.fromTo(area.current, { opacity: 0 }, { opacity: 1, duration: 0.8, delay: 0.4 });
    return () => {
      a.kill();
      b.kill();
    };
  }, [d]);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className={className} aria-hidden="true">
      <path ref={area} d={fill} fill="currentColor" opacity="0.12" />
      <path
        ref={line}
        d={d}
        pathLength="1"
        strokeDasharray="1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ───────────── Entrances ───────────── */

/** Fades content in when it mounts (tab switches). */
export function FadeIn({ children, className, delay = 0 }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    if (!ref.current || prefersReduced()) return;
    const t = gsap.fromTo(
      ref.current,
      { opacity: 0, y: 8 },
      { opacity: 1, y: 0, duration: 0.3, delay, ease: "power2.out", clearProps: "opacity,transform" }
    );
    return () => t.kill();
  }, []);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

/** Unfolds to full height when it mounts. */
export function Unfold({ children, className }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    if (!ref.current || prefersReduced()) return;
    gsap.fromTo(
      ref.current,
      { height: 0, opacity: 0 },
      { height: "auto", opacity: 1, duration: 0.3, ease: "power2.out", clearProps: "height,opacity" }
    );
  }, []);
  return (
    <div ref={ref} className={cn("overflow-hidden", className)}>
      {children}
    </div>
  );
}

/** Small elastic pop, e.g. for a "copied" check icon. */
export function Pop({ children, className }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    if (!ref.current || prefersReduced()) return;
    gsap.fromTo(ref.current, { scale: 0.4, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.45, ease: "back.out(3)" });
  }, []);
  return (
    <span ref={ref} className={cn("inline-flex", className)}>
      {children}
    </span>
  );
}

/** Headline whose words rise out of a mask. */
export function SplitText({ text, as: Tag = "span", className, delay = 0 }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    if (!ref.current || prefersReduced()) return;
    const ctx = gsap.context(() => {
      gsap.from("[data-w]", { yPercent: 115, rotate: 3, duration: 0.9, stagger: 0.06, delay, ease: "power4.out" });
    }, ref);
    return () => ctx.revert();
  }, [text, delay]);
  return (
    <Tag ref={ref} aria-label={text} className={className}>
      {String(text)
        .split(" ")
        .map((w, i) => (
          <span key={i} aria-hidden="true" className="mr-[0.25em] -mb-[0.12em] inline-block overflow-hidden pb-[0.12em] align-bottom">
            <span data-w className="inline-block will-change-transform">
              {w}
            </span>
          </span>
        ))}
    </Tag>
  );
}

/** Multi-line text whose lines fade up one after another. */
export function LineReveal({ text = "", className }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    if (!ref.current || prefersReduced()) return;
    const ctx = gsap.context(() => {
      gsap.from("[data-line]", { opacity: 0, y: 6, duration: 0.35, stagger: 0.035, ease: "power2.out" });
    }, ref);
    return () => ctx.revert();
  }, [text]);
  return (
    <div ref={ref} className={className}>
      {text.split("\n").map((l, i) => (
        <div key={i} data-line className="min-h-[1em] whitespace-pre-wrap">
          {l}
        </div>
      ))}
    </div>
  );
}

/**
 * Children matching `selector` (default [data-row]) fade up as they scroll into
 * view. Change `signature` (e.g. a filter string) to replay after the list changes.
 */
export function ScrollReveal({ children, selector = "[data-row]", className, signature }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    if (!ref.current || prefersReduced()) return;
    const ctx = gsap.context(() => {
      const els = gsap.utils.toArray(selector, ref.current);
      if (!els.length) return;
      gsap.set(els, { opacity: 0, y: 14 });
      ScrollTrigger.batch(els, {
        start: "top 94%",
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, {
            opacity: 1,
            y: 0,
            duration: 0.5,
            stagger: 0.05,
            ease: "power2.out",
            overwrite: true,
            clearProps: "opacity,transform",
          }),
      });
    }, ref);
    return () => ctx.revert();
  }, [signature, selector]);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

/* ───────────── Pointer effects ───────────── */

/** Wrapper that leans toward the cursor and springs back. */
export function Magnetic({ children, strength = 0.25, className }) {
  const ref = useRef(null);
  const move = (e) => {
    if (prefersReduced() || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    gsap.to(ref.current, {
      x: (e.clientX - (r.left + r.width / 2)) * strength,
      y: (e.clientY - (r.top + r.height / 2)) * strength * 1.3,
      duration: 0.4,
      ease: "power3.out",
    });
  };
  const leave = () => ref.current && gsap.to(ref.current, { x: 0, y: 0, duration: 0.9, ease: "elastic.out(1, 0.4)" });
  return (
    <div ref={ref} onMouseMove={move} onMouseLeave={leave} className={cn("inline-block", className)}>
      {children}
    </div>
  );
}

/**
 * Card with a soft coral light that follows the cursor and a very slight 3D tilt.
 * Pass layout/padding classes through className.
 */
export function SpotlightCard({ children, className, tilt = true }) {
  const ref = useRef(null);
  const move = (e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    el.style.setProperty("--sx", `${x}px`);
    el.style.setProperty("--sy", `${y}px`);
    if (tilt && !prefersReduced()) {
      gsap.to(el, {
        rotateY: (x / r.width - 0.5) * 6,
        rotateX: -(y / r.height - 0.5) * 6,
        transformPerspective: 800,
        duration: 0.4,
        ease: "power2.out",
        overwrite: "auto",
      });
    }
  };
  const leave = () => {
    if (tilt && ref.current) gsap.to(ref.current, { rotateX: 0, rotateY: 0, duration: 0.7, ease: "power3.out" });
  };
  return (
    <div
      ref={ref}
      onMouseMove={move}
      onMouseLeave={leave}
      className={cn(
        "group relative overflow-hidden rounded-xl border border-border bg-card transition-colors duration-200 hover:border-primary/40",
        className
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(220px circle at var(--sx, 50%) var(--sy, 50%), color-mix(in srgb, var(--highlight) 16%, transparent), transparent 70%)",
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}

/* ───────────── Navigation ───────────── */

/** Tabs with one underline that glides to the active tab. tabs: [{key,label,icon,count?}] */
export function TabBar({ tabs, active, onChange }) {
  const wrap = useRef(null);
  const ind = useRef(null);
  const placed = useRef(false);
  const sig = tabs.map((t) => t.count ?? "").join("-");

  useLayoutEffect(() => {
    const w = wrap.current;
    const i = ind.current;
    if (!w || !i) return;
    const el = w.querySelector(`[data-tab="${active}"]`);
    if (!el) return;
    const vars = { x: el.offsetLeft, width: el.offsetWidth };
    gsap.killTweensOf(i);
    if (!placed.current || prefersReduced()) gsap.set(i, vars);
    else gsap.to(i, { ...vars, duration: 0.35, ease: "power3.out" });
    placed.current = true;
  }, [active, sig]);

  return (
    <div ref={wrap} role="tablist" className="relative flex items-center gap-1 overflow-x-auto border-b border-border scrollbar-none">
      {tabs.map((t) => (
        <button
          key={t.key}
          role="tab"
          aria-selected={active === t.key}
          data-tab={t.key}
          type="button"
          onClick={() => onChange(t.key)}
          className={cn(
            "flex shrink-0 cursor-pointer items-center gap-2 px-3 pb-2.5 pt-1.5 text-[13px] font-semibold transition-colors",
            active === t.key ? "text-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <t.icon className="h-3.5 w-3.5" />
          {t.label}
          {t.count !== undefined && (
            <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">{t.count}</span>
          )}
        </button>
      ))}
      <span ref={ind} className="absolute -bottom-px left-0 h-[2px] rounded-full bg-highlight" style={{ width: 0 }} />
    </div>
  );
}

/* ───────────── Bars ───────────── */

/** Progress bar whose fill grows to `value` (0-100) when it scrolls into view. */
export function GrowBar({ value = 0, className, trackClassName, delay = 0 }) {
  const ref = useRef(null);
  const v = Math.max(0, Math.min(100, Number(value) || 0));
  const reduced = prefersReduced();
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || prefersReduced()) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { width: 0 },
        {
          width: `${v}%`,
          duration: 1,
          delay,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 96%", once: true },
        }
      );
    });
    return () => ctx.revert();
  }, [v, delay]);
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-secondary", trackClassName)}>
      <div ref={ref} className={cn("h-full rounded-full", className)} style={{ width: reduced ? `${v}%` : 0 }} />
    </div>
  );
}

/** Thin coral line that sweeps across the top of a positioned parent while `active`. */
export function SweepBar({ active, className }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    if (!active || !ref.current || prefersReduced()) return;
    const t = gsap.fromTo(ref.current, { xPercent: -100 }, { xPercent: 300, duration: 1.4, repeat: -1, ease: "power1.inOut" });
    return () => t.kill();
  }, [active]);
  if (!active) return null;
  return (
    <div className={cn("pointer-events-none absolute inset-x-0 top-0 h-[2px] overflow-hidden", className)}>
      <div ref={ref} className="h-full w-1/3 bg-highlight" />
    </div>
  );
}
/**
 * Scroll animation helper used by every section.
 * Place at: client/src/pages/landing/useSectionAnim.js
 *
 * REVERSIBLE: every animation built with `st(...)` plays when the section scrolls into view
 * and plays BACKWARDS when you scroll back up past its start ("play none none reverse").
 *
 * Adapts intelligently between power modes:
 * - "high" (Plugged in / Performance mode): Full 3D transforms (rotationX, perspective, back.out,
 *   clipPath sweeps, filter blur reveals, crisp 0.2s scrub).
 * - "mid" (On Battery): Silky-smooth 2D GPU-accelerated motion (y, opacity, scale, power3.out)
 *   with 0.7s smoothed scrub that eliminates trackpad/wheel jitter on throttled CPUs.
 * - "low": Native compositor scrolling with lightweight fades.
 */
import { useLayoutEffect } from "react";
import { useReducedMotion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import usePerfTier from "./usePerfTier";
import { scrubFor } from "./useSmoothScroll";

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true, autoRefreshEvents: "visibilitychange,DOMContentLoaded,load,resize" });

export const TOGGLE = "play none none reverse";

/** scrollTrigger config: plays going down, reverses going back up. `trigger` should be an element. */
export const st = (trigger, start = "top 80%", extra = {}) => ({ trigger, start, toggleActions: TOGGLE, ...extra });

/** Adds a number count-up to a timeline. Reads the target from data-count on `el`. */
export function countTo(tl, el, duration = 1.6, at = 0) {
  if (!el) return;
  const to = Number(el.dataset.count) || 0;
  const o = { v: 0 };
  tl.to(o, { v: to, duration, ease: "power2.out", onUpdate: () => { el.textContent = Math.round(o.v); } }, at);
}

/** Adds a typewriter to a timeline. Reads the text from data-typed on `el`. Reverses by un-typing. */
export function typeInto(tl, el, at = 0) {
  if (!el) return;
  const text = el.dataset.typed || "";
  const o = { n: 0 };
  tl.to(o, { n: text.length, duration: Math.max(0.4, text.length * 0.022), ease: "none", onUpdate: () => { el.textContent = text.slice(0, Math.round(o.n)); } }, at);
}

export default function useSectionAnim(ref, build) {
  const calm = useReducedMotion();
  const tier = usePerfTier();
  // On battery ("mid") or low-power ("low"), use clean GPU transforms instead of heavy 3D/blur
  const lite = tier !== "high";
  const scrub = scrubFor(tier);

  useLayoutEffect(() => {
    const root = ref.current;
    if (calm || !root) return;

    let cleanup;
    const $ = (s) => root.querySelector(s);
    const $$ = (s) => gsap.utils.toArray(s, root);

    const ctx = gsap.context(() => {
      $$(".reveal").forEach((el) => {
        gsap.from(el, { yPercent: 105, duration: 0.9, ease: "power4.out", scrollTrigger: st(el, "top 92%") });
      });
      $$("[data-bullets]").forEach((ul) => {
        gsap.from(ul.children, { opacity: 0, x: -14, duration: 0.5, stagger: 0.1, ease: "power2.out", scrollTrigger: st(ul, "top 88%") });
      });
      cleanup = build({ gsap, ScrollTrigger, st, $, $$, countTo, typeInto, lite, scrub, tier });
    }, root);

    return () => {
      if (typeof cleanup === "function") cleanup();
      ctx.revert();
    };
  }, [calm, lite, tier, scrub]);
}

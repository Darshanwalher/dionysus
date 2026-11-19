import { useEffect, useRef } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/*
  Inertial scrolling on desktop wheel/trackpad. Touch keeps native scrolling.
  Lenis is driven by GSAP's ticker, so the pinned pipeline section,
  framer-motion's useScroll and the Hero3D camera all read the same smoothed position.

  Adapts to the power and performance state:
  - "high" (plugged-in / performance mode): snappy, responsive 0.13 lerp with crisp 0.2s scrub.
  - "mid" (on battery / energy saver): ultra-smooth 0.095 lerp with 0.7s smoothed scrub to absorb
    variable trackpad intervals and prevent micro-stutter when CPU clocks throttle down.
  - "low": native compositor scrolling.
*/
export default function useSmoothScroll(disabled = false, tier = "high") {
  const native = tier === "low";
  const lenisRef = useRef(null);
  const lerp = tier === "high" ? 0.13 : tier === "mid" ? 0.095 : 0.14;

  useEffect(() => {
    if (disabled || native) return;

    const lenis = new Lenis({
      lerp,
      wheelMultiplier: 1,
      smoothWheel: true,
      syncTouch: false,
    });
    lenisRef.current = lenis;
    lenis.on("scroll", ScrollTrigger.update);

    const tick = (t) => lenis.raf(t * 1000);
    gsap.ticker.add(tick);

    // Lag smoothing: clamps delta time when frames drop on battery, preventing jumpy stutter
    gsap.ticker.lagSmoothing(500, 33);

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisRef.current = null;
      requestAnimationFrame(() => ScrollTrigger.refresh());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled, native]);

  // Retune glide dynamically without destroying the instance
  useEffect(() => {
    if (lenisRef.current) lenisRef.current.options.lerp = lerp;
  }, [lerp]);
}

/**
 * ScrollTrigger `scrub` value:
 * - "high" (plugged in): 0.2 (crisp, near-instant tracking)
 * - "mid" (battery): 0.7 (silky smooth catch-up that absorbs frame jitter)
 * - "low": 0.5
 */
export const scrubFor = (tier) => (tier === "high" ? 0.2 : tier === "mid" ? 0.7 : 0.5);

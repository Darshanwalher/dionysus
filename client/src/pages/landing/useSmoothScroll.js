import { useEffect, useRef } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/*
  Inertial scrolling on desktop wheel/trackpad. Touch keeps native scrolling.
  Lenis is driven by GSAP's ticker, so the pinned pipeline section,
  framer-motion's useScroll and the Hero3D camera all read the same smoothed position.

  Tiers:
  - "high" (plugged-in / performance mode): buttery, long-glide 0.075 lerp with 0.9s scrub.
    There is power and CPU headroom, so we can afford the longer interpolation tail.
  - "mid" (on battery / energy saver): 0.095 lerp with 0.7s scrub to absorb
    variable trackpad intervals when CPU clocks throttle down.
  - "low": native compositor scrolling.
*/
const LERP = { high: 0.075, mid: 0.095, low: 0.14 };
const SCRUB = { high: 0.9, mid: 0.7, low: 0.5 };

export default function useSmoothScroll(disabled = false, tier = "high") {
  const native = tier === "low";
  const lenisRef = useRef(null);
  const lerp = LERP[tier] ?? LERP.high;

  useEffect(() => {
    if (disabled || native) return;

    const lenis = new Lenis({
      lerp,
      wheelMultiplier: tier === "high" ? 0.9 : 1, // slightly softer wheel steps pair well with the longer glide
      smoothWheel: true,
      syncTouch: false,
    });
    lenisRef.current = lenis;
    lenis.on("scroll", ScrollTrigger.update);

    const tick = (t) => lenis.raf(t * 1000);
    gsap.ticker.add(tick);

    // Lag smoothing: clamps delta time when frames drop, preventing jumpy stutter
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
 * - "high" (plugged in): 0.9 (soft, cinematic catch-up)
 * - "mid" (battery): 0.7
 * - "low": 0.5
 */
export const scrubFor = (tier) => SCRUB[tier] ?? SCRUB.high;
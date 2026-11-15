import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/*
  Inertial scrolling on desktop wheel/trackpad. Touch keeps native scrolling.
  Lenis is driven by GSAP's ticker, so the pinned pipeline section,
  framer-motion's useScroll and the Hero3D camera all read the same smoothed position.
*/
export default function useSmoothScroll(disabled = false) {
  useEffect(() => {
    if (disabled) return;

    const lenis = new Lenis({ lerp: 0.085, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);

    const tick = (t) => lenis.raf(t * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, [disabled]);
}
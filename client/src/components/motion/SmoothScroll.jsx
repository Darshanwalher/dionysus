/**
 * Lenis smooth scrolling, tuned per page, synced with GSAP ScrollTrigger.
 * Place at: src/components/motion/SmoothScroll.jsx
 * Install:  npm i lenis
 * Mount ONCE inside the app shell (so sign-in / sign-up pages scroll natively):
 *   import SmoothScroll from "@/components/motion/SmoothScroll";
 *   ...
 *   <SmoothScroll />
 *
 * - lerp controls the glide (lower = floatier, higher = snappier); frame-rate independent, so it feels the same on 60 / 120 / 144 Hz
 * - touch devices keep native momentum scrolling (already smooth, and no lag)
 * - dialogs and anything marked data-lenis-prevent scroll natively
 * - thin coral progress line at the very top of the window
 * - power-aware: on battery / a slow device it gets lighter ("mid"), and on a struggling one it
 *   switches to plain native scrolling ("low"). Native scrolling runs on the browser's compositor
 *   thread, so it stays steady even when the CPU/GPU is throttled. Scroll-linked animations keep working.
 * - disabled with reduced motion; jumps to top on route change; paused on /visualise
 */
import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReduced } from "./index";
import usePerfTier from "./usePerfTier";

gsap.registerPlugin(ScrollTrigger);

let instance = null;

/**
 * Glide per page. Lower lerp = floatier, higher = snappier.
 * Pages not listed use DEFAULT_LERP. Add a line to tune any other page.
 */
const DEFAULT_LERP = 0.075;
const ROUTE_LERP = [
  { match: (path) => path.endsWith("/health"), lerp: 0.12 }, // repository health: lighter
  { match: (path) => /^\/projects\/[^/]+\/?$/.test(path), lerp: 0.12 }, // project home: lighter
  { match: (path) => path.endsWith("/qna"), lerp: 0.16 }, // Q&A: long answers + code, keep it close to native
  { match: (path) => path.endsWith("/documentation"), lerp: 0.16 }, // docs: long reading + editing
  { match: (path) => path.endsWith("/wiki"), lerp: 0.16 }, // DeepWiki: long reading
];
const lerpFor = (path) => ROUTE_LERP.find((r) => r.match(path))?.lerp ?? DEFAULT_LERP;

export default function SmoothScroll() {
  const { pathname } = useLocation();
  const bar = useRef(null);
  const tier = usePerfTier();
  const native = tier === "low";
  const lerpNow = (path) => (tier === "mid" ? 0.095 : lerpFor(path));

  useEffect(() => {
    if (prefersReduced() || native) return; // low: native scrolling

    const lenis = new Lenis({
      lerp: lerpNow(window.location.pathname),
      wheelMultiplier: 1,
      smoothWheel: true,
      syncTouch: false, // keep native touch momentum
      anchors: true, // #hash links glide too
      // Dialogs, popovers and marked areas keep native scrolling
      prevent: (node) =>
        !!node.closest?.(
          "[data-lenis-prevent],[role='dialog'],[role='listbox'],[data-radix-popper-content-wrapper]"
        ),
    });
    instance = lenis;
    if (window.location.pathname.endsWith("/visualise")) lenis.stop();

    lenis.on("scroll", ScrollTrigger.update);

    // One clock for GSAP and Lenis keeps them perfectly in sync
    const tick = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(500, 33);

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      instance = null;
      requestAnimationFrame(() => ScrollTrigger.refresh());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [native]);

  // Glide per page (and lighter on "mid")
  useEffect(() => {
    if (instance) instance.options.lerp = lerpNow(pathname);
  }, [pathname, tier]);

  // New page: back to the top (works with Lenis and with native scrolling)
  useEffect(() => {
    if (instance) {
      instance.scrollTo(0, { immediate: true, force: true });
      if (pathname.endsWith("/visualise")) instance.stop();
      else instance.start();
    } else {
      window.scrollTo(0, 0);
    }
    if (bar.current) gsap.set(bar.current, { scaleX: 0 });
  }, [pathname]);

  // Progress line follows the real scroll position, so it works with or without Lenis
  useEffect(() => {
    if (prefersReduced() || !bar.current) return;
    const set = gsap.quickSetter(bar.current, "scaleX");
    let raf;
    const update = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      set(h > 0 ? Math.min(1, window.scrollY / h) : 0);
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [pathname]);

  if (prefersReduced()) return null;

  return (
    <div
      ref={bar}
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[2px] origin-left bg-highlight"
      style={{ transform: "scaleX(0)" }}
    />
  );
}

/**
 * Glide to an element (or a y position). Uses Lenis when it is running and falls back to
 * native smooth scrolling otherwise (reduced motion, auth pages).
 *   import { scrollToTarget } from "@/components/motion/SmoothScroll";
 */
export function scrollToTarget(target, offset = -88) {
  if (instance) {
    instance.scrollTo(target, { offset, duration: 1 });
    return;
  }
  const y =
    typeof target === "number"
      ? target
      : target.getBoundingClientRect().top + window.scrollY + offset;
  window.scrollTo({ top: y, behavior: prefersReduced() ? "auto" : "smooth" });
}
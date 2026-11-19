import { useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import useSectionAnim from "../useSectionAnim";
import usePerfTier from "../usePerfTier";
import { Head, Bullets } from "../ui";
import Graph from "./Graph";
import { TEAL, CORAL } from "../theme";

/* 02 · The discovery. The teal panel rises, the edges draw and the nodes pop; all of it reverses on scroll up. */
export default function DiscoverMap() {
  const root = useRef(null);
  const calm = useReducedMotion();
  const lite = usePerfTier() !== "high";

  useSectionAnim(root, ({ gsap, st, $, $$ }) => {
    gsap.from($(".map-panel"), { opacity: 0, y: 40, duration: 0.9, ease: "power3.out", scrollTrigger: st($(".map-panel"), "top 88%") });

    gsap
      .timeline({ scrollTrigger: st($(".map-panel"), "top 70%") })
      .fromTo($$(".g-edge"), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.9, stagger: 0.08, ease: "power2.inOut" }, 0)
      .from(
        $$(".g-node"),
        {
          opacity: 0, scale: 0.6, duration: 0.6, stagger: 0.07, ease: "back.out(1.8)",
          svgOrigin: (i, el) => `${el.dataset.x} ${el.dataset.y}`,
        },
        0.2
      );
  });

  return (
    <div ref={root}>
      <section id="map" className="max-w-6xl mx-auto px-5 pt-24 scroll-mt-20">
        <Head n="02" eyebrow="The discovery" l1="Give your codebase" l2="a map." />
        <div className="mt-10 max-w-2xl">
          <Bullets items={[
            "Explore project components and how they relate",
            "Follow code and dependency connections in an interactive graph",
            "See upstream callers and downstream dependents with blast-radius exploration",
            "Navigate visually instead of relying only on folders and search results",
          ]} />
          <p className="dn-m text-[11px] mt-6 opacity-50">The graph below is an illustrative sample project.</p>
        </div>
      </section>

      <section className="px-3 sm:px-5 pt-10">
        <div
          className="map-panel max-w-6xl mx-auto rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-12 relative overflow-hidden shadow-2xl"
          style={{ background: TEAL }}
        >
          <motion.div
            aria-hidden="true"
            className="absolute -right-32 -top-32 h-[32rem] w-[32rem] rounded-full pointer-events-none will-change-transform"
            style={{ background: `radial-gradient(circle, ${CORAL} 0%, transparent 65%)`, opacity: 0.24 }}
            animate={calm || lite ? undefined : { x: [0, -40, 0], y: [0, 40, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="relative z-10">
            <Graph />
          </div>
        </div>
      </section>
    </div>
  );
}
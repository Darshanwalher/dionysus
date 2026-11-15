import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Btn } from "../ui";
import { IV, TEAL, CORAL, GITHUB_URL } from "../theme";

/* Closing call to action. Its scale and corner radius are tied to scroll, so it reverses on its own. */
export default function Cta() {
  const ref = useRef(null);
  const calm = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const scale = useTransform(scrollYProgress, [0, 1], [0.88, 1]);
  const radius = useTransform(scrollYProgress, [0, 1], [60, 32]);

  return (
    <section ref={ref} className="px-3 sm:px-5 pb-8">
      <motion.div
        style={{ scale: calm ? 1 : scale, borderRadius: calm ? 32 : radius, background: TEAL, color: IV }}
        className="max-w-6xl mx-auto px-6 py-24 sm:py-32 text-center relative overflow-hidden shadow-2xl transform-gpu"
      >
        <motion.div
          aria-hidden="true"
          className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl pointer-events-none will-change-transform"
          style={{ background: CORAL, opacity: 0.25 }}
          animate={calm ? undefined : { scale: [1, 1.25, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <p className="dn-m relative z-10 text-xs uppercase tracking-widest opacity-70 mb-6">Understand the system behind the code</p>
        <h2 className="dn-d relative z-10 font-extrabold text-4xl sm:text-7xl leading-[1]">
          Stop guessing<br />what a change breaks.
        </h2>
        <div className="relative z-10 mt-10 flex flex-wrap items-center justify-center gap-4">
          <Btn to="/register">Connect your first repo</Btn>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full px-7 h-[52px] font-semibold border hover:bg-white/10 transition-colors"
            style={{ borderColor: `${IV}66` }}
          >
            View on GitHub <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
      </motion.div>
    </section>
  );
}
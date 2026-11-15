import { useRef } from "react";
import { useReducedMotion } from "framer-motion";
import useSectionAnim from "../useSectionAnim";
import { IV, TEAL, CORAL, INK } from "../theme";

const STEPS = [
  ["Connect", "Link any public or private GitHub repository with a single click. Dionysus clones and indexes file structures."],
  ["Index", "Abstract syntax trees (AST) and code chunks are vectorized into Pinecone for semantic grounding."],
  ["Synthesize", "Generates a 5-chapter Technical DeepWiki with verified file citations and interactive Mermaid diagrams."],
  ["Diagnose", "Audits MongoDB/Prisma schemas for missing indexes and computes a 0–100 repository health scorecard."],
  ["Collaborate", "Join repository-scoped real-time chat rooms with teammates and query the embedded @dionysus AI co-pilot."],
];

/* Pinned horizontal pipeline. Scroll drives it both ways, so scrolling up runs it backwards. */
export default function Pipeline() {
  const root = useRef(null);
  const calm = useReducedMotion();

  useSectionAnim(root, ({ gsap, $ }) => {
    const track = $(".hs-track");
    if (!track) return;
    gsap
      .timeline({
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: () => `+=${track.scrollWidth - window.innerWidth + 200}`,
          scrub: 0.5,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      })
      .to(track, { x: () => -(track.scrollWidth - window.innerWidth + 48), ease: "none" }, 0)
      .to($(".hs-bar"), { scaleX: 1, ease: "none" }, 0);
  });

  return (
    <section ref={root} className="hs relative overflow-hidden" style={{ background: INK, color: IV }}>
      <div className="min-h-screen flex flex-col justify-center py-20">
        <h2 className="dn-d font-extrabold text-4xl sm:text-6xl px-5 max-w-6xl mx-auto w-full leading-[1]">
          From commit to a map you can trust.
        </h2>

        <div className="mt-12 px-5 max-w-6xl mx-auto w-full">
          <div className="h-0.5 w-full bg-white/10">
            <div className="hs-bar h-1 origin-left" style={{ background: CORAL, transform: calm ? "none" : "scaleX(0)" }} />
          </div>
        </div>

        <div className={`hs-track mt-12 flex gap-6 px-5 ${calm ? "overflow-x-auto" : "w-max"}`}>
          {STEPS.map(([t, d], i) => (
            <div
              key={t}
              className="w-[82vw] sm:w-[420px] shrink-0 rounded-3xl p-8 min-h-[320px] flex flex-col justify-between border border-white/10 shadow-2xl transform-gpu"
              style={{ background: i % 2 ? TEAL : "#16302d" }}
            >
              <span className="dn-d text-7xl font-extrabold" style={{ color: CORAL }}>0{i + 1}</span>
              <div>
                <h3 className="dn-d text-3xl font-extrabold">{t}</h3>
                <p className="mt-3 opacity-80 leading-relaxed text-sm sm:text-base">{d}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
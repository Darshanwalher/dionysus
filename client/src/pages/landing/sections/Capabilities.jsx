import { useRef } from "react";
import { Activity, Database, MessagesSquare, BookOpen } from "lucide-react";
import useSectionAnim from "../useSectionAnim";
import { Line, Counter, Typed } from "../ui";
import { IV, IV2, TEAL, CORAL, INK } from "../theme";

const CHAPTERS = [
  ["Chapter 1", "Overview & Architecture (Mermaid flowchart)"],
  ["Chapter 2", "Core Workflows & Request Lifecycles"],
  ["Chapter 3", "Data Layer & Entity Dictionary"],
];

/* Bento grid. Cards are wiped open, the score counts up, the chat types out. All of it reverses on scroll up. */
export default function Capabilities() {
  const root = useRef(null);

  useSectionAnim(root, ({ gsap, st, $, $$, countTo, typeInto, lite }) => {
    const tl = gsap.timeline({ scrollTrigger: st($(".bento-grid"), "top 78%") });
    (lite
      ? tl.from($$(".bento"), { opacity: 0, y: 30, stagger: 0.1, duration: 0.6, ease: "power2.out" }, 0)
      : tl.fromTo(
          $$(".bento"),
          { clipPath: "inset(0% 0% 100% 0% round 24px)", opacity: 0 },
          { clipPath: "inset(0% 0% 0% 0% round 24px)", opacity: 1, stagger: 0.14, duration: 1.1, ease: "power4.inOut" },
          0
        )
    )
      .from($(".cap-bar"), { scaleX: 0, duration: 1.4, ease: "power2.out" }, 0.5)
      .from($$(".cap-chip"), { y: 12, opacity: 0, stagger: 0.08, duration: 0.5, ease: "power2.out" }, 1)
      .from($$(".cap-chap"), { x: 20, opacity: 0, stagger: 0.15, duration: 0.5, ease: "power2.out" }, 0.9);
    countTo(tl, $("[data-count]"), 1.6, 0.5);
    typeInto(tl, $("[data-typed]"), 1.1);
  });

  const chip = "cap-chip rounded-md border border-border bg-card px-2 py-1";

  return (
    <section ref={root} className="max-w-6xl mx-auto px-5 py-28">
      <h2 className="dn-d font-extrabold text-4xl sm:text-6xl leading-[1] max-w-3xl">
        <Line>Four core capabilities</Line>
        <Line style={{ color: TEAL }}>ready on day one.</Line>
      </h2>

      <div className="bento-grid mt-14 grid md:grid-cols-6 gap-5">
        <div className="bento md:col-span-4 rounded-3xl p-8 flex flex-col justify-between min-h-[320px] shadow-sm" style={{ background: IV2, border: `1px solid ${INK}1a` }}>
          <div className="flex items-center gap-2 font-semibold text-lg">
            <Activity className="h-5 w-5" style={{ color: CORAL }} /> 0–100 Repository Health Scorecard
          </div>
          <div className="my-auto pt-4">
            <p className="dn-d font-extrabold text-8xl sm:text-9xl leading-none">
              <Counter to={86} />
              <span className="text-3xl font-medium" style={{ color: `${INK}80` }}>/100</span>
            </p>
            <div className="mt-6 h-3 rounded-full overflow-hidden p-0.5" style={{ background: `${INK}14` }}>
              <div className="cap-bar h-full rounded-full origin-left" style={{ background: CORAL, width: "86%" }} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-xs dn-m">
              <span className={chip}>Modularity: 92%</span>
              <span className={chip}>Maintainability: 84%</span>
              <span className={chip}>Documentation: 88%</span>
              <span className={chip}>Code Smells: 0 Critical</span>
            </div>
          </div>
        </div>

        <div className="bento md:col-span-2 rounded-3xl p-8 min-h-[320px] shadow-sm flex flex-col justify-between" style={{ background: TEAL, color: IV }}>
          <div className="flex items-center gap-2 font-semibold">
            <Database className="h-5 w-5" style={{ color: CORAL }} /> Schema Intelligence
          </div>
          <div>
            <p className="dn-d text-3xl font-extrabold mt-6 leading-tight">Interactive ER Diagrams.</p>
            <p className="mt-3 text-sm opacity-80 leading-relaxed">
              AST parsers analyze Mongoose models and Prisma schemas to map collections, PK/FK links, cardinalities, and flag unindexed foreign keys.
            </p>
          </div>
        </div>

        <div className="bento md:col-span-3 rounded-3xl p-8 min-h-[280px] shadow-sm flex flex-col justify-between" style={{ background: IV2, border: `1px solid ${INK}1a` }}>
          <div className="flex items-center gap-2 font-semibold">
            <MessagesSquare className="h-5 w-5" style={{ color: CORAL }} /> Real-Time Chat &amp; @dionysus AI
          </div>
          <div className="space-y-3">
            <p className="rounded-2xl px-4 py-3 text-sm w-fit ml-auto shadow-sm" style={{ background: `${INK}0d` }}>
              @dionysus How does session verification work?
            </p>
            <p className="dn-m rounded-2xl px-4 py-3 text-xs leading-relaxed border" style={{ background: `${TEAL}14`, borderColor: `${TEAL}20` }}>
              <Typed text="In auth.middleware.js: verifies Bearer JWT token, loads req.user from MongoDB, and blocks expired sessions." />
            </p>
          </div>
        </div>

        <div className="bento md:col-span-3 rounded-3xl p-8 min-h-[280px] shadow-sm flex flex-col justify-between" style={{ background: CORAL }}>
          <div className="flex items-center gap-2 font-semibold" style={{ color: INK }}>
            <BookOpen className="h-5 w-5" /> Automated Repo DeepWiki
          </div>
          <div className="space-y-2 mt-3">
            {CHAPTERS.map(([k, v]) => (
              <div key={k} className="cap-chap rounded-2xl px-4 py-2.5 shadow-sm" style={{ background: IV2, color: INK }}>
                <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">{k}</p>
                <p className="text-xs font-semibold mt-0.5 truncate">{v}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
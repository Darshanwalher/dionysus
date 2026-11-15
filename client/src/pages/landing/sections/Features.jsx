import { useRef } from "react";
import { HeartPulse, Database, Users } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import useSectionAnim from "../useSectionAnim";
import { Head, Panel, LiveBadge } from "../ui";
import { CORAL } from "../theme";

const FEATURES = [
  [HeartPulse, "Repository Health Score", "A comprehensive 0–100 architectural grade auditing modularity, documentation density, cyclomatic complexity, God files, and circular dependencies."],
  [Database, "Schema Intelligence & ERD", "Interactive Entity-Relationship diagrams parsing Mongoose models and Prisma schemas with primary/foreign keys, cardinalities, and missing index warnings."],
  [Users, "Repository Chat & @dionysus AI", "Real-time WebSocket team rooms scoped to each repository, featuring an embedded RAG co-pilot, #file autocomplete, threaded replies, and emoji reactions."],
];

/* 06 · Unified suite. Cards flip down from the top edge and get outlined; reverses on scroll up. */
export default function Features() {
  const root = useRef(null);
  const calm = useReducedMotion();

  useSectionAnim(root, ({ gsap, st, $, $$ }) => {
    gsap
      .timeline({ scrollTrigger: st($(".rm-wrap"), "top 80%") })
      .from($$(".rm-card"), { rotationX: 80, y: 40, opacity: 0, transformPerspective: 900, transformOrigin: "50% 0%", stagger: 0.18, duration: 1, ease: "back.out(1.4)" }, 0)
      .fromTo($$(".rm-outline"), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.6, stagger: 0.18, ease: "power2.inOut" }, 0.5);
  });

  return (
    <section ref={root} id="features" className="max-w-6xl mx-auto px-5 pb-28 scroll-mt-20">
      <Head
        n="06" eyebrow="Unified Suite"
        l1="Schema, Health, &" l2="Real-Time Team Rooms."
        lead="Every dimension of your repository analyzed, diagnosed, and interactive on day one."
      />
      <div className="rm-wrap mt-12 grid md:grid-cols-3 gap-5">
        {FEATURES.map(([Icon, t, d]) => (
          <div key={t} className="rm-card relative">
            {!calm && (
              <svg aria-hidden="true" className="absolute inset-0 z-10 w-full h-full pointer-events-none">
                <rect className="rm-outline" x="1" y="1" width="99.6%" height="99.4%" rx="24" fill="none" stroke={CORAL} strokeWidth="1.5" pathLength="1" strokeDasharray="1" strokeDashoffset="1" />
              </svg>
            )}
            <Panel>
              <div className="flex items-center justify-between gap-3">
                <Icon className="h-6 w-6" style={{ color: CORAL }} aria-hidden="true" />
                <LiveBadge />
              </div>
              <h3 className="dn-d font-extrabold text-2xl mt-5">{t}</h3>
              <p className="mt-2 text-sm opacity-75 leading-relaxed">{d}</p>
            </Panel>
          </div>
        ))}
      </div>
    </section>
  );
}
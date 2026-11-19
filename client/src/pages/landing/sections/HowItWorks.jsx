import { useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { GitBranch, Lock, Sun } from "lucide-react";
import useSectionAnim from "../useSectionAnim";
import { Head, Panel } from "../ui";
import { CORAL, INK } from "../theme";

const HOW = [
  ["Create an account and workspace", "Sign in and set up a space for your work."],
  ["Organize work by project", "Keep each repository in its own project."],
  ["Explore architecture and documentation", "Follow the graph and read project knowledge."],
  ["Ask questions and review meetings", "Get answers and pull action items from discussions."],
  ["Decide what to investigate next", "Use the project context to choose your next step."],
];

const IN_PLACE = [[GitBranch, "GitHub integration"], [Lock, "Authentication and project workspaces"], [Sun, "Light and dark themes"]];

/* 07 · How it works. A scroll-scrubbed line switches on each step; scrubbing back switches them off again. */
export default function HowItWorks() {
  const root = useRef(null);
  const calm = useReducedMotion();

  useSectionAnim(root, ({ gsap, st, $, $$, lite, scrub }) => {
    const cards = $$(".how-card");
    const mm = gsap.matchMedia();

    mm.add("(min-width: 768px)", () => {
      gsap.set(cards, lite ? { opacity: 0, y: 50 } : { opacity: 0, y: 70, rotationX: -14, scale: 0.94, transformPerspective: 900, transformOrigin: "50% 100%" });
      gsap.set($$(".how-pip"), { scale: 0 });

      const tl = gsap.timeline({
        scrollTrigger: { trigger: root.current, start: "top 65%", end: "bottom 70%", scrub },
        defaults: { ease: "power3.out" },
      });
      tl.to($(".how-fill"), { scaleX: 1, ease: "none", duration: cards.length }, 0);
      cards.forEach((card, i) => {
        const at = i * 0.95;
        tl.to(card, { opacity: 1, y: 0, rotationX: 0, scale: 1, duration: 0.9 }, at)
          .to(card.querySelector(".how-pip"), { scale: 1, duration: 0.35, ease: "back.out(3)" }, at)
          .from(card.querySelector(".how-num"), { yPercent: 80, rotate: -12, opacity: 0, duration: 0.6, ease: "back.out(2)" }, at + 0.2);
      });
    });

    mm.add("(max-width: 767px)", () => {
      gsap.set($(".how-fill"), { scaleX: 1 });
      cards.forEach((card) => {
        gsap.from(card, { opacity: 0, y: 50, scale: 0.96, duration: 0.8, ease: "power3.out", scrollTrigger: st(card, "top 90%") });
      });
    });

    // A pulse that keeps travelling along the line (GPU transform to prevent layout reflows)
    const lineWrap = $(".how-fill")?.parentElement;
    if (lineWrap) {
      gsap.fromTo(
        $(".how-dot"),
        { x: 0 },
        {
          x: () => lineWrap.offsetWidth - 6,
          duration: 3.4,
          ease: "power1.inOut",
          repeat: -1,
          repeatDelay: 1,
          force3D: true,
        }
      );
    }

    // Feature chips pop in and back out
    gsap.from($$(".how-chip"), {
      y: 24, opacity: 0, scale: 0.9, stagger: 0.12, duration: 0.7, ease: "back.out(1.6)",
      scrollTrigger: st($(".how-chips"), "top 92%"),
    });

    return () => mm.revert();
  });

  return (
    <section ref={root} id="how" className="max-w-6xl mx-auto px-5 py-28 scroll-mt-20">
      <Head n="07" eyebrow="How it works" l1="From repository" l2="to understanding." />

      <div className="relative mt-12 mb-8">
        <div className="h-0.5 w-full" style={{ background: `${INK}14` }}>
          <div className="how-fill h-full origin-left" style={{ background: CORAL, transform: calm ? "none" : "scaleX(0)" }} />
        </div>
        {!calm && (
          <span
            aria-hidden="true"
            className="how-dot absolute top-1/2 -translate-y-1/2 -ml-1.5 h-3 w-3 rounded-full"
            style={{ left: 0, background: CORAL, boxShadow: `0 0 0 6px ${CORAL}33` }}
          />
        )}
      </div>

      <ol className="grid md:grid-cols-5 gap-4">
        {HOW.map(([t, d], i) => (
          <li key={t} className="how-card relative list-none">
            <span aria-hidden="true" className="how-pip hidden md:block absolute -top-[2.45rem] left-6 h-3 w-3 rounded-full" style={{ background: CORAL }} />
            <Panel pad="p-5">
              <span className="how-num inline-block dn-d font-extrabold text-4xl" style={{ color: CORAL }}>0{i + 1}</span>
              <h3 className="font-semibold mt-3 leading-snug">{t}</h3>
              <p className="mt-2 text-sm opacity-70 leading-relaxed">{d}</p>
            </Panel>
          </li>
        ))}
      </ol>

      <div className="how-chips mt-10 flex flex-wrap gap-3">
        {IN_PLACE.map(([Icon, t]) => (
          <span key={t} className="how-chip inline-flex items-center gap-2 text-sm px-4 py-2 rounded-full border" style={{ borderColor: `${INK}26` }}>
            <Icon className="h-4 w-4" style={{ color: CORAL }} aria-hidden="true" />{t}
          </span>
        ))}
      </div>
    </section>
  );
}
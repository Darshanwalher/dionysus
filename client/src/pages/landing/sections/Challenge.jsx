import { useRef } from "react";
import { Layers, EyeOff, Compass, Clock } from "lucide-react";
import useSectionAnim from "../useSectionAnim";
import { Head, Panel } from "../ui";
import { CORAL } from "../theme";

const CHALLENGES = [
  [Layers, "Knowledge is scattered", "Answers live across files, documents, and meetings, and no single place holds the whole picture."],
  [EyeOff, "Structure is hard to see", "Dependencies and architecture are rarely obvious from a folder tree."],
  [Compass, "Where do I start?", "New contributors spend their first days just finding their footing."],
  [Clock, "Decisions drift", "Meeting discussions are easy to lose before they become technical follow-up."],
];

/* 01 · The challenge. Scattered cards snap into place; scrolling back up scatters them again. */
export default function Challenge() {
  const root = useRef(null);

  useSectionAnim(root, ({ gsap, ScrollTrigger, st, $, $$ }) => {
    const cards = $$(".ch-card");
    const wrap = $(".ch-wrap");

    gsap
      .timeline({ scrollTrigger: st(wrap, "top 80%") })
      .from(cards, { opacity: 0, filter: "blur(10px)", duration: 0.7, stagger: 0.12, ease: "power1.out" }, 0)
      .from(cards, {
        x: () => gsap.utils.random(-140, 140), y: () => gsap.utils.random(-60, 90),
        rotation: () => gsap.utils.random(-14, 14), scale: 0.9,
        duration: 1.4, stagger: 0.12, ease: "elastic.out(1, 0.7)",
      }, 0);

    // A gentle float on each card's inner panel, only while the section is on screen
    $$(".ch-float").forEach((el, i) => {
      const t = gsap.to(el, { y: i % 2 ? -8 : 8, duration: 2.4 + i * 0.35, yoyo: true, repeat: -1, ease: "sine.inOut", paused: true });
      ScrollTrigger.create({ trigger: wrap, start: "top 70%", end: "bottom top", onToggle: (s) => (s.isActive ? t.play() : t.pause()) });
    });
  });

  return (
    <section ref={root} id="challenge" className="max-w-6xl mx-auto px-5 pt-28 pb-8 scroll-mt-20">
      <Head
        n="01" eyebrow="The challenge"
        l1="A new project" l2="can feel like a maze."
        lead="It isn't anyone's fault. Projects grow faster than the map of them."
      />
      <div className="ch-wrap mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {CHALLENGES.map(([Icon, t, d]) => (
          <div key={t} className="ch-card">
            <div className="ch-float h-full">
              <Panel>
                <Icon className="h-6 w-6" style={{ color: CORAL }} aria-hidden="true" />
                <h3 className="dn-d font-extrabold text-xl mt-5">{t}</h3>
                <p className="mt-2 text-sm opacity-75 leading-relaxed">{d}</p>
              </Panel>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
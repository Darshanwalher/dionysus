import { useRef } from "react";
import { BookOpen } from "lucide-react";
import useSectionAnim from "../useSectionAnim";
import { Head, Bullets, Panel, LiveBadge } from "../ui";
import { CORAL } from "../theme";

/* 05 · Repo DeepWiki. The card is revealed left to right, the icon spins in, the badge pops; reverses on scroll up. */
export default function DeepWikiSection() {
  const root = useRef(null);

  useSectionAnim(root, ({ gsap, st, $, lite }) => {
    const tl = gsap.timeline({ scrollTrigger: st($(".kn-wrap"), "top 80%") });
    (lite
      ? tl.from($(".kn-wrap"), { opacity: 0, x: -30, duration: 0.7, ease: "power3.out" })
      : tl.fromTo($(".kn-wrap"), { clipPath: "inset(0% 100% 0% 0% round 24px)" }, { clipPath: "inset(0% 0% 0% 0% round 24px)", duration: 1.1, ease: "power3.inOut" })
    )
      .from($(".kn-icon"), { rotate: -180, scale: 0, duration: 0.7, ease: "back.out(2)" }, "-=0.4")
      .from($(".kn-badge"), { scale: 0, duration: 0.5, ease: "back.out(3)" }, "-=0.3");
  });

  return (
    <section ref={root} id="deepwiki" className="max-w-6xl mx-auto px-5 pb-28 scroll-mt-20">
      <Head n="05" eyebrow="Repo DeepWiki" l1="Verified Technical Wiki." l2="Zero hallucinations." />
      <div className="mt-12 grid lg:grid-cols-2 gap-12 items-center">
        <Bullets items={[
          "Auto-synthesizes 5 structured chapters directly from verified repository files",
          "Generates clean Mermaid flowcharts, architecture diagrams, and data dictionaries",
          "Enforces strict evidence citations (Evidence: filepath) ensuring zero hallucinated code",
          "1-click Markdown export and real-time chapter re-synthesis",
        ]} />
        <div className="kn-wrap">
          <Panel>
            <div className="flex items-center justify-between gap-3">
              <BookOpen className="kn-icon h-6 w-6" style={{ color: CORAL }} aria-hidden="true" />
              <LiveBadge className="kn-badge" />
            </div>
            <h3 className="dn-d font-extrabold text-2xl mt-5">Multi-Chapter Technical DeepWiki</h3>
            <p className="mt-2 opacity-75 leading-relaxed">
              Automated technical documentation covering High-Level Architecture, Request Lifecycles, Data Layers, Setup, and Security Lifecycles with verified file evidence.
            </p>
          </Panel>
        </div>
      </div>
    </section>
  );
}
import { useRef } from "react";
import useSectionAnim from "../useSectionAnim";
import { Head, Bullets, Panel, Typed } from "../ui";
import { TEAL, INK } from "../theme";

/* 03 · Ask the codebase. Chat bubbles pop in from opposite sides, the answer types out; reverses on scroll up. */
export default function Ask() {
  const root = useRef(null);

  useSectionAnim(root, ({ gsap, st, $, $$, typeInto }) => {
    const tl = gsap.timeline({ scrollTrigger: st($(".ask-panel"), "top 80%") });
    tl.from($(".ask-b1"), { x: 60, y: 20, scale: 0.7, opacity: 0, transformOrigin: "100% 100%", duration: 0.7, ease: "back.out(1.7)" })
      .from($(".ask-b2"), { x: -60, y: 20, scale: 0.7, opacity: 0, transformOrigin: "0% 100%", duration: 0.7, ease: "back.out(1.7)" }, "+=0.15")
      .from($$(".ask-chip"), { y: 10, opacity: 0, stagger: 0.1, duration: 0.4 }, 0.3);
    typeInto(tl, $("[data-typed]"), "-=0.2");
  });

  return (
    <section ref={root} id="ask" className="max-w-6xl mx-auto px-5 pb-28 scroll-mt-20">
      <Head n="03" eyebrow="Ask the codebase" l1="Get answers grounded" l2="in your project." />
      <div className="mt-12 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <Bullets items={[
            "Ask natural-language questions about the repository",
            "Semantic code search finds relevant project context",
            "Get help understanding architecture and technical concepts",
          ]} />
          <div className="mt-8 flex flex-wrap gap-2">
            {["Gemini integration", "Pinecone semantic search"].map((t) => (
              <span key={t} className="ask-chip dn-m text-xs px-3 py-1 rounded-full border" style={{ borderColor: `${INK}26` }}>{t}</span>
            ))}
          </div>
        </div>
        <div className="ask-panel">
          <Panel className="space-y-3">
            <p className="ask-b1 rounded-2xl px-4 py-3 text-sm w-fit ml-auto" style={{ background: `${INK}0d` }}>How does a request reach the database?</p>
            <p className="ask-b2 dn-m rounded-2xl px-4 py-3 text-xs leading-relaxed border" style={{ background: `${TEAL}14`, borderColor: `${TEAL}30` }}>
              <Typed text="Requests enter through the api, which routes them to auth, search, or meetings. Those services read and write through the database." />
            </p>
            <p className="text-[11px] opacity-50">Illustrative example</p>
          </Panel>
        </div>
      </div>
    </section>
  );
}
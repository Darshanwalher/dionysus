import { useRef } from "react";
import { Mic } from "lucide-react";
import useSectionAnim from "../useSectionAnim";
import { Head, Bullets } from "../ui";
import { IV, CORAL, INK } from "../theme";

/* 04 · Meetings. The card opens like a book, then the transcript and action item follow; reverses on scroll up. */
export default function Meetings() {
  const root = useRef(null);

  useSectionAnim(root, ({ gsap, st, $, $$, lite }) => {
    gsap
      .timeline({ scrollTrigger: st($(".meet-wrap"), "top 80%") })
      .from($(".meet-card"), lite ? { opacity: 0, y: 30, duration: 0.7, ease: "power3.out" } : { rotationY: -40, opacity: 0, transformPerspective: 1200, transformOrigin: "0% 50%", duration: 1.1, ease: "power3.out" })
      .from($$(".meet-line"), { x: -24, opacity: 0, stagger: 0.25, duration: 0.5, ease: "power2.out" }, "-=0.3")
      .from($(".meet-act"), { y: 12, opacity: 0, duration: 0.5, ease: "power2.out" }, "-=0.1");
  });

  return (
    <section ref={root} id="meetings" className="max-w-6xl mx-auto px-5 pb-28 scroll-mt-20">
      <Head n="04" eyebrow="Meetings" l1="Turn conversations" l2="into next steps." />
      <div className="mt-12 grid lg:grid-cols-2 gap-12 items-center">
        <Bullets items={[
          "Meeting audio transcription with AssemblyAI",
          "Multi-speaker recognition and timestamps in transcripts",
          "AI-assisted extraction of engineering action items",
          "Meeting pages and detail views for reviewing project discussions",
        ]} />
        <div className="meet-wrap">
          <div className="meet-card rounded-3xl p-7 shadow-sm space-y-4" style={{ background: INK, color: IV }}>
            <div className="flex items-end gap-[3px] h-8" aria-hidden="true">
              {Array.from({ length: 28 }).map((_, i) => (
                <span
                  key={i}
                  className="dn-wave w-1 h-full rounded-full"
                  style={{ background: i % 5 === 0 ? CORAL : `${IV}55`, "--d": `${1.6 + (i % 5) * 0.2}s`, "--dl": `${i * 0.05}s` }}
                />
              ))}
            </div>
            <div className="space-y-2 dn-m text-xs leading-relaxed">
              <p className="meet-line"><span style={{ color: CORAL }}>00:12 Speaker 1</span> We should split search out of the api.</p>
              <p className="meet-line"><span style={{ color: CORAL }}>00:31 Speaker 2</span> Agreed. I can take the first pass this week.</p>
            </div>
            <div className="border-t pt-4" style={{ borderColor: `${IV}1a` }}>
              <p className="text-[11px] uppercase tracking-wider opacity-60">Action items</p>
              <p className="meet-act flex gap-2 text-sm mt-2"><Mic className="h-4 w-4 mt-0.5 shrink-0" style={{ color: CORAL }} aria-hidden="true" />Prototype a standalone search service</p>
            </div>
            <p className="text-[11px] opacity-50">Illustrative example</p>
          </div>
        </div>
      </div>
    </section>
  );
}
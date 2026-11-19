import { useRef } from "react";
import useSectionAnim from "../useSectionAnim";
import { CORAL, INK } from "../theme";

const LANGS = ["TypeScript", "Python", "Rust", "Go", "Java", "C++", "Kotlin", "Ruby", "Swift", "C#"];

/* Language ticker. The scrolling is a CSS animation (see theme.js), which keeps running smoothly even
   when the CPU is throttled. It slides up when it appears and back down when you scroll up. */
export default function Marquee() {
  const root = useRef(null);

  useSectionAnim(root, ({ gsap, st }) => {
    gsap.from(root.current, { opacity: 0, y: 60, duration: 0.9, ease: "power3.out", scrollTrigger: st(root.current, "top 95%") });
  });

  return (
    <div ref={root} className="mt-20">
      <div className="overflow-hidden py-4 -rotate-1 shadow-md" style={{ background: CORAL }} aria-hidden="true">
        <div className="dn-d dn-marquee flex w-max gap-10 text-2xl font-extrabold">
          {[...LANGS, ...LANGS, ...LANGS, ...LANGS].map((l, i) => (
            <span key={i} className="flex items-center gap-10">
              {l}
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: INK }} />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
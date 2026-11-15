import { useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { Check, Copy } from "lucide-react";
import useSectionAnim from "../useSectionAnim";
import { Line } from "../ui";
import { IV, CORAL, INK } from "../theme";

const COMMAND = "npx dionysus-ai init --repo github.com/org/repo";

/* Terminal call to action. The card rises and the command types itself; scrolling up un-types it. */
export default function Terminal() {
  const root = useRef(null);
  const calm = useReducedMotion();
  const [copied, setCopied] = useState(false);

  useSectionAnim(root, ({ gsap, st, $, typeInto }) => {
    const tl = gsap.timeline({ scrollTrigger: st($(".term-card"), "top 88%") });
    tl.from($(".term-card"), { y: 40, opacity: 0, scale: 0.97, duration: 0.8, ease: "power3.out" });
    typeInto(tl, $("[data-typed]"), 0.3);
  });

  const copy = () => {
    navigator.clipboard?.writeText(COMMAND);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section ref={root} className="max-w-3xl mx-auto px-5 pb-28">
      <div className="space-y-6">
        <h2 className="dn-d font-extrabold text-3xl sm:text-5xl">
          <Line>Start from your terminal.</Line>
        </h2>
        <div className="term-card dn-m flex items-center justify-between rounded-2xl p-5 text-xs sm:text-sm shadow-2xl border border-white/10" style={{ background: INK, color: IV }}>
          <span className="overflow-x-auto select-all flex items-center gap-2">
            <span style={{ color: CORAL }}>$</span>
            <span data-typed={COMMAND}>{calm ? COMMAND : ""}</span>
          </span>
          <button onClick={copy} aria-label="Copy command" className="p-2 shrink-0 hover:bg-white/10 rounded-lg transition-colors">
            {copied ? <Check className="h-4 w-4" style={{ color: CORAL }} /> : <Copy className="h-4 w-4 opacity-70" />}
          </button>
        </div>
      </div>
    </section>
  );
}
/**
 * FAQ section (own file, own content, own animation).
 * Place at: client/src/pages/landing/sections/FAQ.jsx
 *
 * Scroll: the heading rises, the top rule and every divider draw in, the rows fade up one after
 * another; scrolling back up plays all of it in reverse.
 * Interaction (framer-motion): hover nudge, coral bar down the open row, + turns into a coral x,
 * the answer unfolds and its words fade up. Keyboard: Up / Down / Home / End, Enter or Space.
 */
import { useId, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Plus } from "lucide-react";
import useSectionAnim from "../useSectionAnim";
import { INK, CORAL, ease } from "../theme";

const FAQS = [
  ["How does Dionysus understand my codebase?", "Dionysus fetches your repository tree via GitHub, parses functions and dependencies, and embeds code snippets into Pinecone. When you ask questions or trigger DeepWiki, Gemini retrieves verified file context to prevent hallucinations."],
  ["What is the Repository Chat Room?", "Each repository gets a dedicated real-time chat room powered by WebSockets. Teammates can chat, reply in threads, react with emojis, tag files using #autocomplete, and call @dionysus for instant code explanations."],
  ["How does Schema Intelligence work?", "Dionysus analyzes your Mongoose and Prisma models to generate an interactive Entity-Relationship (ER) diagram, displaying fields, types, relationships, and auditing missing foreign-key indexes."],
  ["How does Meeting Intelligence work?", "Upload meeting recordings or engineering huddles. Dionysus transcribes the audio using AssemblyAI with speaker diarization and automatically extracts engineering action items."],
  ["Is my code used to train public models?", "No. File chunks and code vectors are strictly scoped to your private project namespace in Pinecone and MongoDB, and are never used for model training."],
];

/* Answer text whose words fade up in a quick wave */
function Words({ text, calm }) {
  if (calm) return text;
  return text.split(" ").map((w, i) => (
    <span key={i}>
      <motion.span
        className="inline-block"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.12 + Math.min(i * 0.012, 0.6), ease }}
      >
        {w}
      </motion.span>{" "}
    </span>
  ));
}

export default function FAQ({ items = FAQS, title = "Questions & Answers", defaultOpen = 0 }) {
  const root = useRef(null);
  const calm = useReducedMotion();
  const uid = useId();
  const [open, setOpen] = useState(defaultOpen);
  const btns = useRef([]);

  useSectionAnim(root, ({ gsap, st, $, $$ }) => {
    gsap
      .timeline({ scrollTrigger: st($(".faq-list"), "top 82%") })
      .from($(".faq-top"), { scaleX: 0, duration: 0.9, ease: "power3.out" }, 0)
      .from($$(".faq-row"), { opacity: 0, y: 18, duration: 0.6, stagger: 0.08, ease: "power3.out" }, 0.1)
      .from($$(".faq-rule"), { scaleX: 0, duration: 0.9, stagger: 0.08, ease: "power3.out" }, 0.3);
  });

  const onKey = (e, i) => {
    const last = items.length - 1;
    const go = (n) => {
      e.preventDefault();
      btns.current[n]?.focus();
    };
    if (e.key === "ArrowDown") go(i === last ? 0 : i + 1);
    else if (e.key === "ArrowUp") go(i === 0 ? last : i - 1);
    else if (e.key === "Home") go(0);
    else if (e.key === "End") go(last);
  };

  return (
    <section ref={root} id="faq" className="max-w-3xl mx-auto px-5 pb-28 scroll-mt-20">
      <div className="mb-8 flex items-end justify-between gap-4">
        <h2 className="dn-d font-extrabold text-3xl sm:text-5xl" aria-label={title}>
          {title.split(" ").map((w, i) => (
            <span key={i} aria-hidden="true" className="mr-[0.25em] inline-block overflow-hidden pb-[0.1em] align-bottom">
              <span className="reveal inline-block">{w}</span>
            </span>
          ))}
        </h2>
        <span className="dn-m mb-2 hidden shrink-0 text-xs opacity-50 sm:block">{items.length} questions</span>
      </div>

      <div className="faq-list relative">
        <span aria-hidden="true" className="faq-top absolute inset-x-0 top-0 h-px origin-left" style={{ background: `${INK}26` }} />

        <ol>
          {items.map(([q, a], i) => {
            const isOpen = open === i;
            const bid = `${uid}-q${i}`;
            const pid = `${uid}-a${i}`;
            return (
              <li key={q} className="faq-row relative list-none">
                {/* coral bar that grows down the open row */}
                <motion.span
                  aria-hidden="true"
                  className="absolute bottom-0 left-0 top-0 w-[3px] origin-top rounded-full"
                  style={{ background: CORAL }}
                  initial={false}
                  animate={{ scaleY: isOpen ? 1 : 0 }}
                  transition={{ duration: calm ? 0 : 0.45, ease }}
                />

                <h3>
                  <button
                    ref={(el) => (btns.current[i] = el)}
                    id={bid}
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={pid}
                    onClick={() => setOpen(isOpen ? -1 : i)}
                    onKeyDown={(e) => onKey(e, i)}
                    className="group flex w-full cursor-pointer items-center gap-4 py-6 pl-5 pr-1 text-left sm:gap-6"
                  >
                    <span className="dn-m w-6 shrink-0 text-xs transition-colors duration-300" style={{ color: isOpen ? CORAL : `${INK}66` }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="flex-1 text-lg font-semibold transition-transform duration-300 group-hover:translate-x-1 sm:text-xl">{q}</span>
                    <motion.span
                      aria-hidden="true"
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-full border transform-gpu"
                      style={{ borderColor: `${INK}33` }}
                      animate={{ rotate: isOpen ? 135 : 0, backgroundColor: isOpen ? CORAL : "rgba(0,0,0,0)" }}
                      whileHover={calm ? undefined : { scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 320, damping: 22 }}
                    >
                      <Plus className="h-4 w-4" />
                    </motion.span>
                  </button>
                </h3>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={pid}
                      role="region"
                      aria-labelledby={bid}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: calm ? 0 : 0.4, ease }}
                      className="overflow-hidden"
                    >
                      <p className="max-w-xl pb-7 pl-[3.25rem] pr-4 text-sm leading-relaxed opacity-80 sm:pl-[3.75rem] sm:text-base">
                        <Words text={a} calm={calm} />
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <span aria-hidden="true" className="faq-rule absolute inset-x-0 bottom-0 h-px origin-left" style={{ background: `${INK}26` }} />
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
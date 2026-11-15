/**
 * Small shared pieces for the landing sections.
 * Place at: client/src/pages/landing/ui.jsx
 */
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Check } from "lucide-react";
import { IV2, TEAL, CORAL, INK } from "./theme";

/* A heading line that rises out of a mask (animated by useSectionAnim via .reveal) */
export const Line = ({ children, style }) => (
  <span className="block overflow-hidden pb-[0.1em]">
    <span className="reveal block" style={style}>{children}</span>
  </span>
);

export const Head = ({ n, eyebrow, l1, l2, lead }) => (
  <div>
    <p className="dn-m text-xs uppercase tracking-widest" style={{ color: TEAL }}>{n} · {eyebrow}</p>
    <h2 className="dn-d font-extrabold text-4xl sm:text-6xl leading-[1] max-w-3xl mt-4">
      <Line>{l1}</Line>
      {l2 && <Line style={{ color: TEAL }}>{l2}</Line>}
    </h2>
    {lead && <p className="mt-5 max-w-2xl text-base sm:text-lg opacity-75 leading-relaxed">{lead}</p>}
  </div>
);

/* data-bullets: items fade in one by one and back out (useSectionAnim) */
export const Bullets = ({ items }) => (
  <ul data-bullets className="space-y-3">
    {items.map((t) => (
      <li key={t} className="flex gap-3 text-base leading-relaxed" style={{ opacity: 0.85 }}>
        <Check className="h-5 w-5 mt-0.5 shrink-0" style={{ color: CORAL }} aria-hidden="true" />
        {t}
      </li>
    ))}
  </ul>
);

export const Panel = ({ children, className = "", pad = "p-7" }) => (
  <div className="rounded-3xl shadow-sm h-full" style={{ background: IV2, border: `1px solid ${INK}1a` }}>
    <div className={`h-full ${pad}`}>
      <div className={className}>{children}</div>
    </div>
  </div>
);

export const LiveBadge = ({ className = "" }) => (
  <span className={`dn-m inline-block text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border whitespace-nowrap ${className}`} style={{ borderColor: `${TEAL}66`, color: TEAL }}>
    Live
  </span>
);

/* Primary button, used by the hero and the closing call to action */
export const Btn = ({ to, children }) => (
  <motion.span whileHover={{ y: -3, scale: 1.02 }} whileTap={{ scale: 0.97 }} className="inline-block transform-gpu">
    <Link
      to={to}
      className="group inline-flex items-center gap-2 rounded-full px-7 h-[52px] font-semibold shadow-lg transition-shadow"
      style={{ background: CORAL, color: INK, boxShadow: `0 10px 30px ${CORAL}33` }}
    >
      {children}
      <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
    </Link>
  </motion.span>
);

/* The section timeline drives these (countTo / typeInto in useSectionAnim). */
export function Counter({ to }) {
  const calm = useReducedMotion();
  return <span data-count={to}>{calm ? to : 0}</span>;
}

export function Typed({ text }) {
  const calm = useReducedMotion();
  return (
    <span>
      <span data-typed={text}>{calm ? text : ""}</span>
      <span className="inline-block w-[2px] h-[1.1em] align-middle ml-0.5 animate-pulse" style={{ background: CORAL }} />
    </span>
  );
}
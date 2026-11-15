import { useEffect, useRef, useState } from "react";
import { motion, animate } from "framer-motion";
import { Sparkles } from "lucide-react";

/*
  Hero: minimal ivory page + an interactive "blast radius" playground.
  Click (or Tab + Enter) any service to "change" it. A shockwave ripples out,
  downstream services light up one hop at a time, data pulses run along the live edges,
  and the risk score counts up. When nobody touches it, it demos itself.
  Everything is static when `calm` (prefers-reduced-motion) is true.
*/

const IV = "#F3EEE8";
const TEAL = "#17645F";
const CORAL = "#FF6845";
const INK = "#10211F";
const ease = [0.22, 1, 0.36, 1];
const MONO = "'IBM Plex Mono', ui-monospace, monospace";
const HOP = 0.45; // seconds between hops of the shockwave

const P = {
  gateway: [300, 46, "api-gateway"],
  auth: [100, 156, "auth-vault"],
  billing: [300, 156, "billing"],
  rag: [500, 156, "rag-engine"],
  db: [200, 270, "postgres"],
  vec: [400, 270, "qdrant"],
};
const ORDER = ["auth", "gateway", "rag", "billing", "db", "vec"];
const EDGES = [
  ["gateway", "auth"], ["gateway", "billing"], ["gateway", "rag"],
  ["auth", "db"], ["billing", "db"], ["rag", "db"], ["rag", "vec"],
];

const edgePath = (a, b) => {
  const [x1, y1] = P[a], [x2, y2] = P[b], my = (y1 + y2) / 2;
  return `M${x1} ${y1} C${x1} ${my}, ${x2} ${my}, ${x2} ${y2}`;
};

// Points along each edge's curve so a pulse can follow it
const PTS = EDGES.map(([a, b]) => {
  const [x1, y1] = P[a], [x2, y2] = P[b], my = (y1 + y2) / 2;
  const xs = [], ys = [];
  for (let i = 0; i <= 20; i++) {
    const t = i / 20, u = 1 - t;
    xs.push(u * u * u * x1 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x2);
    ys.push(u * u * u * y1 + 3 * u * u * t * my + 3 * u * t * t * my + t * t * t * y2);
  }
  return { xs, ys };
});

// Distance (in hops) from `id` to every service it reaches
const depthsFrom = (id) => {
  const d = { [id]: 0 };
  const q = [id];
  while (q.length) {
    const c = q.shift();
    EDGES.forEach(([a, b]) => {
      if (a === c && d[b] === undefined) { d[b] = d[c] + 1; q.push(b); }
    });
  }
  return d;
};

function useTyped(text, still) {
  const [n, setN] = useState(still ? text.length : 0);
  useEffect(() => {
    if (still) { setN(text.length); return; }
    setN(0);
    let i = 0;
    const t = setInterval(() => {
      i += 1; setN(i);
      if (i >= text.length) clearInterval(t);
    }, 28);
    return () => clearInterval(t);
  }, [text, still]);
  return text.slice(0, n);
}

function useCount(to, still) {
  const [v, setV] = useState(to);
  const prev = useRef(to);
  useEffect(() => {
    if (still) { setV(to); prev.current = to; return; }
    const c = animate(prev.current, to, { duration: 0.9, ease, onUpdate: (x) => { prev.current = x; setV(Math.round(x)); } });
    return () => c.stop();
  }, [to, still]);
  return v;
}

const Mask = ({ children, delay, still }) => (
  <span className="block overflow-hidden pb-[0.14em]">
    <motion.span
      className="block"
      initial={{ y: still ? 0 : "110%" }}
      animate={{ y: 0 }}
      transition={{ duration: 0.9, delay, ease }}
    >
      {children}
    </motion.span>
  </span>
);

function Playground({ still }) {
  const [sel, setSel] = useState("auth");
  const [auto, setAuto] = useState(!still);

  useEffect(() => {
    if (!auto || still) return;
    const t = setInterval(() => setSel((s) => ORDER[(ORDER.indexOf(s) + 1) % ORDER.length]), 4200);
    return () => clearInterval(t);
  }, [auto, still]);

  const pick = (id) => { setSel(id); setAuto(false); };

  const d = depthsFrom(sel);
  const hit = Object.keys(d).filter((k) => k !== sel).sort((a, b) => d[a] - d[b]);
  const maxD = Math.max(...Object.values(d));
  const risk = hit.length === 0 ? 12 : Math.min(97, 22 + hit.length * 14 + maxD * 9);
  const level = risk >= 75 ? "High" : risk >= 40 ? "Medium" : "Low";
  const shown = useCount(risk, still);
  const cmd = useTyped(`change ${P[sel][2]}()`, still);
  const wait = (depth) => (still ? 0 : depth * HOP);

  return (
    <div>
      <div className="flex items-center justify-between text-[11px] mb-2" style={{ fontFamily: MONO, opacity: 0.7 }}>
        <span>Click a service to change it</span>
        {!still && (
          <button onClick={() => setAuto((a) => !a)} className="underline underline-offset-2 cursor-pointer">
            {auto ? "pause demo" : "play demo"}
          </button>
        )}
      </div>

      <svg viewBox="0 0 600 320" className="w-full h-auto" role="group" aria-label="Interactive service dependency graph">
        {/* base edges */}
        {EDGES.map(([a, b], i) => (
          <motion.path
            key={a + b}
            d={edgePath(a, b)}
            fill="none"
            stroke={INK}
            strokeOpacity={0.22}
            strokeWidth={1.5}
            initial={{ pathLength: still ? 1 : 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.9, delay: 0.8 + i * 0.08, ease }}
          />
        ))}

        {/* live edges + travelling pulses */}
        {EDGES.map(([a, b], i) => {
          if (d[a] === undefined || d[b] !== d[a] + 1) return null;
          return (
            <g key={sel + a + b}>
              <motion.path
                d={edgePath(a, b)}
                fill="none"
                stroke={CORAL}
                strokeWidth={2.5}
                strokeLinecap="round"
                initial={{ pathLength: still ? 1 : 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: HOP, delay: wait(d[a]), ease: "easeOut" }}
              />
              {!still && (
                <motion.circle
                  r={3.5}
                  fill={CORAL}
                  initial={{ opacity: 0 }}
                  animate={{ cx: PTS[i].xs, cy: PTS[i].ys, opacity: [0, 1, 1, 0] }}
                  transition={{ duration: 1.3, delay: wait(d[a]) + HOP, repeat: Infinity, repeatDelay: 0.5, ease: "linear" }}
                />
              )}
            </g>
          );
        })}

        {/* nodes */}
        {Object.entries(P).map(([id, [x, y, label]], i) => {
          const dep = d[id];
          const on = dep !== undefined;
          const src = dep === 0;
          return (
            <motion.g
              key={id}
              tabIndex={0}
              role="button"
              aria-label={`Change ${label}`}
              aria-pressed={src}
              onClick={() => pick(id)}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), pick(id))}
              initial={{ opacity: still ? 1 : 0 }}
              animate={{ opacity: 1 }}
              whileHover={still ? undefined : { scale: 1.15 }}
              transition={{ duration: 0.5, delay: 0.6 + i * 0.08 }}
              style={{ transformOrigin: `${x}px ${y}px`, cursor: "pointer", outline: "none" }}
            >
              <circle cx={x} cy={y} r={24} fill="transparent" />
              {on && !still && (
                <motion.circle
                  key={sel + id}
                  cx={x}
                  cy={y}
                  fill="none"
                  stroke={CORAL}
                  strokeWidth={1.5}
                  initial={{ r: 8, opacity: 0.9 }}
                  animate={{ r: src ? 36 : 28, opacity: 0 }}
                  transition={{ duration: 1.1, delay: wait(dep), repeat: src ? Infinity : 0, repeatDelay: 0.5, ease: "easeOut" }}
                />
              )}
              <motion.circle
                cx={x}
                cy={y}
                stroke={INK}
                strokeWidth={1.5}
                animate={{ r: on ? 9 : 7, fill: on ? CORAL : IV }}
                transition={{ duration: 0.35, delay: on ? wait(dep) : 0 }}
              />
              <motion.circle
                cx={x}
                cy={y}
                r={3}
                animate={{ fill: on ? INK : id === "gateway" ? CORAL : TEAL }}
                transition={{ duration: 0.35, delay: on ? wait(dep) : 0 }}
              />
              <text x={x} y={y - 18} textAnchor="middle" fontSize="12" fill={INK} opacity={src ? 1 : 0.7} fontWeight={src ? 600 : 400} fontFamily={MONO}>
                {label}
              </text>
            </motion.g>
          );
        })}
      </svg>

      {/* Readout */}
      <div className="mt-3 rounded-xl p-4" style={{ background: INK, color: IV, fontFamily: MONO }} aria-live="polite">
        <div className="text-[12px]">
          <span style={{ color: CORAL }}>$ </span>
          {cmd}
          {!still && <span className="inline-block w-[2px] h-[1em] align-middle ml-0.5 animate-pulse" style={{ background: CORAL }} />}
        </div>

        <div className="mt-3 flex items-end justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-wider opacity-60">blast radius</div>
            <div className="dn-d text-3xl font-extrabold leading-none">
              {shown}
              <span className="text-sm font-normal opacity-60">/100</span>
            </div>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: `${CORAL}22`, color: CORAL, border: `1px solid ${CORAL}55` }}>
            {level} risk
          </span>
        </div>

        <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: `${IV}1a` }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: CORAL }}
            animate={{ width: `${risk}%` }}
            transition={{ duration: still ? 0 : 0.9, ease }}
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5 min-h-[1.75rem] items-center">
          {hit.length === 0 && <span className="text-[11px] opacity-60">no downstream services</span>}
          {hit.map((id) => (
            <motion.span
              key={sel + id}
              initial={{ opacity: still ? 1 : 0, y: still ? 0 : 6, scale: still ? 1 : 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: still ? 0 : d[id] * HOP + 0.2, duration: 0.35 }}
              className="px-2 py-0.5 rounded-full text-[11px]"
              style={{ background: `${IV}14`, border: `1px solid ${IV}30` }}
            >
              {P[id][2]}
            </motion.span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Hero3D({ Btn, calm }) {
  const still = !!calm;

  return (
    <section
      className="w-full min-h-[calc(100svh-4rem)] flex flex-col justify-center"
      style={{ background: IV, color: INK }}
    >
      <div className="w-full px-5 sm:px-10 lg:px-16 py-16 sm:py-20 grid lg:grid-cols-[1.3fr_1fr] gap-12 items-center">
        {/* Left: text */}
        <div>
          <motion.div
            initial={{ opacity: still ? 1 : 0, y: still ? 0 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border mb-8 text-xs font-semibold"
            style={{ background: `${TEAL}10`, borderColor: `${TEAL}30`, color: TEAL }}
          >
            <Sparkles className="h-3.5 w-3.5" style={{ color: CORAL }} />
            Introducing Dionysus Graph Engine 2.0
          </motion.div>

          <h1 className="dn-d font-extrabold text-[2.75rem] sm:text-7xl lg:text-[5.5rem] xl:text-[6.5rem] leading-[0.95]">
            <Mask delay={0.1} still={still}>See what your code</Mask>
            <Mask delay={0.22} still={still}>
              <span className="relative inline-block" style={{ color: TEAL }}>
                touches before
                <svg viewBox="0 0 300 12" preserveAspectRatio="none" className="absolute left-0 -bottom-[0.02em] w-full h-[0.14em]" aria-hidden="true">
                  <motion.path
                    d="M2 8 C 80 2, 200 12, 298 4"
                    fill="none"
                    stroke={CORAL}
                    strokeWidth="5"
                    strokeLinecap="round"
                    initial={{ pathLength: still ? 1 : 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.8, delay: 1.1, ease }}
                  />
                </svg>
              </span>
            </Mask>
            <Mask delay={0.34} still={still}>you change it.</Mask>
          </h1>

          <motion.p
            initial={{ opacity: still ? 0.85 : 0, y: still ? 0 : 14 }}
            animate={{ opacity: 0.85, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7, ease }}
            className="mt-10 max-w-md text-base sm:text-lg leading-relaxed"
          >
            Dionysus reads your GitHub repos and draws the exact dependency graph. Every pull request gets a risk score, and every answer cites the line it came from.
          </motion.p>

          <motion.div
            initial={{ opacity: still ? 1 : 0, y: still ? 0 : 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9, ease }}
            className="mt-8"
          >
            <Btn to="/register">Start free with GitHub</Btn>
          </motion.div>
        </div>

        {/* Right: interactive playground */}
        <div className="hidden lg:block">
          <Playground still={still} />
        </div>
      </div>
    </section>
  );
}
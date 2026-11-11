import { useState, useEffect, useRef, useLayoutEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  motion, AnimatePresence, useReducedMotion, useScroll, useSpring,
  useTransform, useMotionValue, useInView, animate,
} from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ArrowUpRight, Copy, Check, Plus, GitPullRequest, Mic,
  ShieldCheck, MessageSquare, Activity, Zap,
  Layers, EyeOff, Compass, Clock, BookOpen, HeartPulse,
  Database, Users, GitBranch, Lock, Sun,
} from "lucide-react";
import Hero3D from "./Hero3D";
import useSmoothScroll from "./useSmoothScroll";

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });

/* TODO: replace with the real repository URL before launch */
const GITHUB_URL = "https://github.com/your-org/dionysus";

/* Palette Tokens */
const IV = "#F3EEE8";
const IV2 = "#FAF7F2";
const TEAL = "#17645F";
const CORAL = "#FF6845";
const CORAL_D = "#C2401F";
const INK = "#10211F";
const ease = [0.22, 1, 0.36, 1];

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,800&family=IBM+Plex+Mono:ital,wght@0,400;0,500;1,400&display=swap');
.dn, .dn-d { font-family: 'Bricolage Grotesque', system-ui, sans-serif; }
.dn-d { letter-spacing: -.035em; }
.dn-m { font-family: 'IBM Plex Mono', ui-monospace, monospace; }
.dn *:focus-visible { outline: 2px solid ${CORAL}; outline-offset: 3px; }
.dn ::selection { background: ${CORAL}; color: ${INK}; }
.glass-dark { background: rgba(16,33,31,.72); border: 1px solid rgba(243,238,232,.12); }
html.lenis, html.lenis body { height: auto; }
.lenis.lenis-smooth { scroll-behavior: auto !important; }
.lenis.lenis-stopped { overflow: hidden; }
.dn-wmc { container-type: inline-size; }
.dn-wm { font-size: 14vw; font-size: 19cqw; }
.dn .lnk { --lnk: #FF6845; display: inline-block; opacity: .8; background-image: linear-gradient(currentColor, currentColor); background-repeat: no-repeat; background-position: 0 100%; background-size: 0% 1px; transition: background-size .35s ease, color .3s ease, opacity .3s ease, transform .3s ease; }
.dn .lnk:hover { color: var(--lnk); opacity: 1; background-size: 100% 1px; transform: translateX(4px); }
@media (prefers-reduced-motion: reduce) { .dn .lnk:hover { transform: none; } }
`;

const NODES = {
  gateway: { x: 300, y: 44, label: "api-gateway", note: "Every request enters here. Validates tokens, rate-limits, and routes to downstream microservices." },
  auth: { x: 110, y: 160, label: "auth-vault", note: "Manages session tokens, OAuth providers, key rotation, and granular RBAC checks." },
  billing: { x: 300, y: 160, label: "billing", note: "Processes subscription tier changes, automated invoices, and telemetry usage metering." },
  rag: { x: 490, y: 160, label: "rag-engine", note: "AST syntax-tree parser that indexes functions and builds real-time context maps." },
  db: { x: 200, y: 276, label: "postgres", note: "Primary relational storage for tenant workspaces, repository symbols, and audit trails." },
  vec: { x: 400, y: 276, label: "qdrant", note: "High-dimensional vector search across every symbol, class definition, and method." },
};

const EDGES = [
  ["gateway", "auth"], ["gateway", "billing"], ["gateway", "rag"],
  ["auth", "db"], ["billing", "db"], ["rag", "db"], ["rag", "vec"],
];

const reach = (id) => {
  const s = new Set([id]);
  const w = (n) => EDGES.forEach(([a, b]) => { if (a === n && !s.has(b)) { s.add(b); w(b); } });
  w(id);
  s.delete(id);
  return s;
};

const LANGS = ["TypeScript", "Python", "Rust", "Go", "Java", "C++", "Kotlin", "Ruby", "Swift", "C#"];

const STEPS = [
  ["Clone", "A short-lived worker pulls your repo through the GitHub App. Zero persistent storage on disk."],
  ["Parse", "Every file is decomposed into abstract syntax trees (AST) of functions, classes, and imports."],
  ["Link", "Method calls and module dependencies merge into an enterprise-wide static call graph."],
  ["Explain", "AI models map service interactions and highlight structural tangles with exact file citations."],
  ["Watch", "Every PR recalculates the graph in real time and flags architecturally risky drift."],
];

const FAQS = [
  ["Is my source code stored?", "No. Files are parsed into ephemeral syntax trees and dependency graphs inside isolated sandboxed workers. Raw source code is purged immediately and never used to train machine learning models."],
  ["Does it work with monorepos?", "Yes. Dionysus automatically detects Turborepo, Nx, Cargo workspaces, Go modules, pnpm workspaces, and Bazel setups."],
  ["How does PR impact scoring work?", "When a pull request opens, changed symbols are projected onto the call graph to calculate reachable callers, downstream APIs, and compute a 0–100 risk assessment."],
  ["What happens to meeting recordings?", "Audio is transcribed in-memory and immediately deleted. Only structured transcript summaries, engineering decisions, and linked code references are stored."],
  ["Can I run it in my own cloud?", "Yes. We supply battle-tested Docker images and Helm charts for AWS, GCP, Azure VPCs, and air-gapped environments with Ollama or vLLM backends."],
];

/* ── Story content ─────────────────────────────────────────────────────── */
const CHALLENGES = [
  [Layers, "Knowledge is scattered", "Answers live across files, documents, and meetings, and no single place holds the whole picture."],
  [EyeOff, "Structure is hard to see", "Dependencies and architecture are rarely obvious from a folder tree."],
  [Compass, "Where do I start?", "New contributors spend their first days just finding their footing."],
  [Clock, "Decisions drift", "Meeting discussions are easy to lose before they become technical follow-up."],
];

const HOW = [
  ["Create an account and workspace", "Sign in and set up a space for your work."],
  ["Organize work by project", "Keep each repository in its own project."],
  ["Explore architecture and documentation", "Follow the graph and read project knowledge."],
  ["Ask questions and review meetings", "Get answers and pull action items from discussions."],
  ["Decide what to investigate next", "Use the project context to choose your next step."],
];

const IN_PLACE = [[GitBranch, "GitHub integration"], [Lock, "Authentication and project workspaces"], [Sun, "Light and dark themes"]];

const FOOTER_COLS = [
  ["The story", [["The challenge", "#challenge"], ["The map", "#map"], ["Ask the codebase", "#ask"], ["Meetings", "#meetings"], ["Knowledge", "#knowledge"]]],
  ["On the roadmap", [["Repository health", "#roadmap"], ["Schema intelligence", "#roadmap"], ["Repository chat rooms", "#roadmap"]]],
  ["Get started", [["Sign in", "/login"], ["Connect a repo", "/register"], ["GitHub", GITHUB_URL]]],
];

/* ── Counter ───────────────────────────────────────────────────────────── */
function Counter({ to }) {
  const ref = useRef(null);
  const seen = useInView(ref, { once: true });
  useEffect(() => {
    if (seen) animate(0, to, { duration: 1.8, ease, onUpdate: (v) => ref.current && (ref.current.textContent = Math.round(v).toString()) });
  }, [seen, to]);
  return <span ref={ref}>0</span>;
}

/* ── Typewriter ────────────────────────────────────────────────────────── */
function Typed({ text }) {
  const ref = useRef(null);
  const seen = useInView(ref, { once: true, margin: "-20%" });
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!seen) return;
    const t = setInterval(() => setN((c) => (c >= text.length ? (clearInterval(t), c) : c + 1)), 22);
    return () => clearInterval(t);
  }, [seen, text]);
  return (
    <span ref={ref}>
      {text.slice(0, n)}
      <span className="inline-block w-[2px] h-[1.1em] align-middle ml-0.5 animate-pulse" style={{ background: CORAL }} />
    </span>
  );
}

/* ── Tilt ──────────────────────────────────────────────────────────────── */
function Tilt({ children, className = "", style }) {
  return <div style={style} className={className}>{children}</div>;
}

/* ── Cursor ring ───────────────────────────────────────────────────────── */
function Cursor() {
  const x = useSpring(useMotionValue(-100), { stiffness: 700, damping: 50 });
  const y = useSpring(useMotionValue(-100), { stiffness: 700, damping: 50 });
  useEffect(() => {
    const m = (e) => { x.set(e.clientX - 14); y.set(e.clientY - 14); };
    window.addEventListener("mousemove", m, { passive: true });
    return () => window.removeEventListener("mousemove", m);
  }, [x, y]);
  return (
    <motion.div
      aria-hidden="true"
      style={{ x, y, borderColor: CORAL }}
      className="hidden md:block pointer-events-none fixed top-0 left-0 z-[60] h-7 w-7 rounded-full border-2 transform-gpu"
    />
  );
}

/* ── Full-width wordmark with a lagging cursor spotlight ───────────────── */
function FitText({ text, color }) {
  const calm = useReducedMotion();
  const box = useRef(null);
  const inner = useRef(null);
  const glow = useRef(null);

  // Size the wordmark so it spans the whole width
  useLayoutEffect(() => {
    let last = 0;
    const fit = () => {
      const b = box.current, i = inner.current;
      if (!b || !i) return;
      i.style.fontSize = "100px";
      const w = i.scrollWidth;
      if (!w) return;
      const size = `${(b.clientWidth / w) * 100 * 0.985}px`;
      i.style.fontSize = size;
      if (glow.current) glow.current.style.fontSize = size;
    };
    fit();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
    const ro = new ResizeObserver(() => {
      const w = box.current ? box.current.clientWidth : 0;
      if (w !== last) { last = w; fit(); }
    });
    ro.observe(box.current);
    return () => ro.disconnect();
  }, [text]);

  // Spotlight: follows the mouse with a deliberate lag, fades in and out slowly
  useEffect(() => {
    if (calm) return;
    const b = box.current, g = glow.current;
    if (!b || !g) return;
    const zone = b.closest(".ft") || b;
    let raf = 0, active = false;
    let tx = 0, ty = 0, cx = 0, cy = 0;

    const tick = () => {
      cx += (tx - cx) * 0.07;
      cy += (ty - cy) * 0.07;
      g.style.setProperty("--x", `${cx}px`);
      g.style.setProperty("--y", `${cy}px`);
      raf = active || Math.abs(tx - cx) > 0.5 || Math.abs(ty - cy) > 0.5 ? requestAnimationFrame(tick) : 0;
    };
    const move = (e) => {
      if (e.pointerType && e.pointerType !== "mouse") return;
      const r = b.getBoundingClientRect();
      tx = e.clientX - r.left;
      ty = e.clientY - r.top;
      if (!active) { active = true; cx = tx; cy = ty; g.style.opacity = "1"; }
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const leave = () => { active = false; g.style.opacity = "0"; };

    zone.addEventListener("pointermove", move);
    zone.addEventListener("pointerleave", leave);
    return () => {
      zone.removeEventListener("pointermove", move);
      zone.removeEventListener("pointerleave", leave);
      cancelAnimationFrame(raf);
    };
  }, [calm]);

  const cls = "dn-d font-extrabold leading-[0.85] whitespace-nowrap select-none pb-[0.3em]";
  const letters = (extra = "") => text.split("").map((c, i) => <span key={i} className={`inline-block ${extra}`}>{c}</span>);

  return (
    <div ref={box} className="relative w-full overflow-hidden" aria-hidden="true">
      <div ref={inner} className={`${cls} inline-block`} style={{ color }}>
        {text.split("").map((c, i) => <span key={i} className="ft-letter inline-block">{c}</span>)}
      </div>
      {!calm && (
        <div
          ref={glow}
          className={`${cls} absolute left-0 top-0 pointer-events-none`}
          style={{
            opacity: 0,
            transition: "opacity 0.9s ease 0.12s",
            color: "transparent",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            backgroundImage: `radial-gradient(circle 260px at var(--x, 50%) var(--y, 50%), ${CORAL} 0%, ${IV} 38%, transparent 72%)`,
          }}
        >
          {letters()}
        </div>
      )}
    </div>
  );
}

const Line = ({ children, style }) => (
  <span className="block overflow-hidden pb-[0.1em]">
    <span className="reveal block transform-gpu" style={style}>{children}</span>
  </span>
);

/* Defined at module level so it is not re-created (and re-mounted) on every render */
const Btn = ({ to, children }) => (
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

/* ── Helpers for the story sections ────────────────────────────────────── */
const Head = ({ n, eyebrow, l1, l2, lead }) => (
  <div>
    <p className="dn-m text-xs uppercase tracking-widest" style={{ color: TEAL }}>{n} · {eyebrow}</p>
    <h2 className="dn-d font-extrabold text-4xl sm:text-6xl leading-[1] max-w-3xl mt-4">
      <Line>{l1}</Line>
      {l2 && <Line style={{ color: TEAL }}>{l2}</Line>}
    </h2>
    {lead && <p className="mt-5 max-w-2xl text-base sm:text-lg opacity-75 leading-relaxed">{lead}</p>}
  </div>
);

const Planned = ({ className = "" }) => (
  <span className={`dn-m inline-block text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border whitespace-nowrap ${className}`} style={{ borderColor: `${CORAL}99`, color: CORAL_D }}>
    On the roadmap
  </span>
);

const Bullets = ({ items }) => (
  <ul className="space-y-3">
    {items.map((t, i) => (
      <motion.li
        key={t}
        initial={{ opacity: 0, x: -14 }}
        whileInView={{ opacity: 0.85, x: 0 }}
        viewport={{ once: true, margin: "-8%" }}
        transition={{ duration: 0.5, delay: i * 0.1, ease }}
        className="flex gap-3 text-base leading-relaxed"
      >
        <Check className="h-5 w-5 mt-0.5 shrink-0" style={{ color: CORAL }} aria-hidden="true" />
        {t}
      </motion.li>
    ))}
  </ul>
);

const Panel = ({ children, className = "", pad = "p-7" }) => (
  <div className="rounded-3xl shadow-sm h-full" style={{ background: IV2, border: `1px solid ${INK}1a` }}>
    <div className={`h-full ${pad}`}>
      <div className={className}>{children}</div>
    </div>
  </div>
);

/* ── Interactive Topology Graph ────────────────────────────────────────── */
function Graph() {
  const [sel, setSel] = useState("auth");
  const calm = useReducedMotion();
  const hit = useMemo(() => reach(sel), [sel]);
  const n = NODES[sel];

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-8 items-center">
      <div className="relative">
        <svg viewBox="0 0 600 330" className="w-full h-auto" role="img" aria-label="Service dependency graph">
          {EDGES.map(([a, b], i) => {
            const A = NODES[a];
            const B = NODES[b];
            const d = `M${A.x} ${A.y + 18} C${A.x} ${(A.y + B.y) / 2 + 10}, ${B.x} ${(A.y + B.y) / 2 - 10}, ${B.x} ${B.y - 18}`;
            const live = (a === sel || hit.has(a)) && hit.has(b);
            return (
              <g key={i}>
                <motion.path
                  d={d} fill="none" stroke={IV} strokeOpacity={0.22} strokeWidth={1.5}
                  initial={{ pathLength: calm ? 1 : 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.9, delay: i * 0.08, ease }}
                />
                <motion.path
                  d={d} fill="none" stroke={CORAL} strokeWidth={2.5}
                  initial={false}
                  animate={{ pathLength: live ? 1 : 0, opacity: live ? 1 : 0 }}
                  transition={{ duration: 0.4 }}
                />
                {live && !calm && (
                  <circle r="4" fill={CORAL}>
                    <animateMotion dur="1.3s" repeatCount="indefinite" path={d} />
                  </circle>
                )}
              </g>
            );
          })}
          {Object.entries(NODES).map(([id, p], i) => {
            const active = id === sel;
            const lit = hit.has(id);
            return (
              <motion.g
                key={id}
                tabIndex={0}
                role="button"
                aria-label={`Inspect ${p.label}`}
                className="cursor-pointer outline-none transform-gpu"
                onClick={() => setSel(id)}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setSel(id)}
                initial={{ opacity: calm ? 1 : 0, scale: calm ? 1 : 0.6 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                style={{ transformOrigin: `${p.x}px ${p.y}px` }}
                transition={{ delay: 0.2 + i * 0.05, type: "spring", stiffness: 280, damping: 20 }}
                whileHover={{ scale: 1.08 }}
              >
                {lit && !calm && (
                  <motion.circle
                    cx={p.x} cy={p.y} fill="none" stroke={CORAL} strokeWidth={1.5}
                    initial={{ r: 24, opacity: 0.9 }}
                    animate={{ r: 48, opacity: 0 }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
                  />
                )}
                <motion.rect
                  x={p.x - 62} y={p.y - 18} width={124} height={36} rx={18} strokeWidth={1.5}
                  animate={{ fill: active ? CORAL : lit ? IV : "#0F4A46" }}
                  stroke={lit || active ? CORAL : IV}
                  strokeOpacity={lit || active ? 1 : 0.3}
                />
                <text x={p.x} y={p.y + 4.5} textAnchor="middle" fontSize="12.5" className="dn-m font-medium" fill={active || lit ? INK : IV}>
                  {p.label}
                </text>
              </motion.g>
            );
          })}
        </svg>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={sel}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.22 }}
          className="space-y-4 rounded-2xl p-6 glass-dark text-white shadow-2xl"
        >
          <div className="flex items-center justify-between">
            <h3 className="dn-m text-lg font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4" style={{ color: CORAL }} />
              {n.label}
            </h3>
            <span className="dn-m text-[11px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 opacity-70">service</span>
          </div>
          <p className="leading-relaxed text-xs sm:text-sm opacity-85">{n.note}</p>
          <div className="pt-3 border-t border-white/10">
            <p className="text-xs sm:text-sm font-semibold flex items-center gap-2" style={{ color: CORAL }}>
              <Zap className="h-4 w-4 shrink-0" />
              {hit.size ? `Impacts ${hit.size} downstream ${hit.size === 1 ? "service" : "services"}.` : "Isolated service (no downstream dependencies)."}
            </p>
          </div>
          <p className="text-[11px] opacity-50">Select any node in the topology map to trace change vectors.</p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ── Landing Page ──────────────────────────────────────────────────────── */
export default function LandingPage() {
  const root = useRef(null);
  const ctaRef = useRef(null);
  const calm = useReducedMotion();
  const [open, setOpen] = useState(0);
  const [copied, setCopied] = useState(false);

  useSmoothScroll(calm);

  const { scrollYProgress } = useScroll();
  const bar = useSpring(scrollYProgress, { stiffness: 180, damping: 30, restDelta: 0.001 });

  const { scrollYProgress: ctaP } = useScroll({ target: ctaRef, offset: ["start end", "center center"] });
  const ctaScale = useTransform(ctaP, [0, 1], [0.88, 1]);
  const ctaRadius = useTransform(ctaP, [0, 1], [60, 32]);

  useLayoutEffect(() => {
    if (calm) return;

    let mm;
    const ctx = gsap.context(() => {
      const track = document.querySelector(".hs-track");
      if (track) {
        gsap.timeline({
          scrollTrigger: {
            trigger: ".hs",
            start: "top top",
            end: () => `+=${track.scrollWidth - window.innerWidth + 200}`,
            scrub: 0.5,
            pin: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        })
          .to(track, { x: () => -(track.scrollWidth - window.innerWidth + 48), ease: "none" }, 0)
          .to(".hs-bar", { scaleX: 1, ease: "none" }, 0);
      }

      // Bento: cards are wiped open with a clip-path (no transforms, so the tilt keeps working)
      gsap.fromTo(
        ".bento",
        { clipPath: "inset(0% 0% 100% 0% round 24px)", opacity: 0 },
        {
          clipPath: "inset(0% 0% 0% 0% round 24px)", opacity: 1, stagger: 0.14, duration: 1.1,
          ease: "power4.inOut", clearProps: "clipPath",
          scrollTrigger: { trigger: ".bento-wrap", start: "top 78%" },
        }
      );

      gsap.utils.toArray(".reveal").forEach((el) => {
        gsap.from(el, {
          yPercent: 105, duration: 0.9, ease: "power4.out",
          scrollTrigger: { trigger: el, start: "top 92%" },
        });
      });

      // How it works: a scroll-scrubbed line that "switches on" each step card
      const cards = gsap.utils.toArray(".how-card");
      if (cards.length) {
        mm = gsap.matchMedia();

        mm.add("(min-width: 768px)", () => {
          gsap.set(cards, { opacity: 0, y: 70, rotationX: -14, scale: 0.94, transformPerspective: 900, transformOrigin: "50% 100%" });
          gsap.set(".how-pip", { scale: 0 });

          const tl = gsap.timeline({
            scrollTrigger: { trigger: ".how-wrap", start: "top 65%", end: "bottom 70%", scrub: 0.7 },
            defaults: { ease: "power3.out" },
          });
          tl.to(".how-fill", { scaleX: 1, ease: "none", duration: cards.length }, 0);
          cards.forEach((card, i) => {
            const at = i * 0.95;
            tl.to(card, { opacity: 1, y: 0, rotationX: 0, scale: 1, duration: 0.9 }, at)
              .to(card.querySelector(".how-pip"), { scale: 1, duration: 0.35, ease: "back.out(3)" }, at)
              .from(card.querySelector(".how-num"), { yPercent: 80, rotate: -12, opacity: 0, duration: 0.6, ease: "back.out(2)" }, at + 0.2);
          });
        });

        mm.add("(max-width: 767px)", () => {
          gsap.set(".how-fill", { scaleX: 1 });
          cards.forEach((card) => {
            gsap.from(card, {
              opacity: 0, y: 50, scale: 0.96, duration: 0.8, ease: "power3.out",
              scrollTrigger: { trigger: card, start: "top 90%" },
            });
          });
        });

        // A pulse that keeps travelling along the line
        gsap.fromTo(".how-dot", { left: "0%" }, { left: "100%", duration: 3.4, ease: "power1.inOut", repeat: -1, repeatDelay: 1 });

        // Feature chips pop in
        gsap.from(".how-chip", {
          y: 24, opacity: 0, scale: 0.9, stagger: 0.12, duration: 0.7, ease: "back.out(1.6)",
          scrollTrigger: { trigger: ".how-chips", start: "top 92%" },
        });
      }

      // Challenge: scattered cards snap into place (a messy project becoming a map)
      const ch = gsap.utils.toArray(".ch-card");
      if (ch.length) {
        const trig = { trigger: ".ch-wrap", start: "top 80%" };
        gsap.from(ch, { opacity: 0, filter: "blur(10px)", duration: 0.7, stagger: 0.12, ease: "power1.out", clearProps: "filter", scrollTrigger: trig });
        gsap.from(ch, {
          x: () => gsap.utils.random(-140, 140), y: () => gsap.utils.random(-60, 90),
          rotation: () => gsap.utils.random(-14, 14), scale: 0.9,
          duration: 1.4, stagger: 0.12, ease: "elastic.out(1, 0.7)", scrollTrigger: trig,
          onComplete: () => ch.forEach((c, i) => gsap.to(c, { y: i % 2 ? -8 : 8, duration: 2.4 + i * 0.35, yoyo: true, repeat: -1, ease: "sine.inOut" })),
        });
      }

      // Ask: chat bubbles pop in from opposite sides
      if (document.querySelector(".ask-panel")) {
        gsap.timeline({ scrollTrigger: { trigger: ".ask-panel", start: "top 80%" } })
          .from(".ask-b1", { x: 60, y: 20, scale: 0.7, opacity: 0, transformOrigin: "100% 100%", duration: 0.7, ease: "back.out(1.7)" })
          .from(".ask-b2", { x: -60, y: 20, scale: 0.7, opacity: 0, transformOrigin: "0% 100%", duration: 0.7, ease: "back.out(1.7)" }, "+=0.15");
      }

      // Meetings: the card opens like a book, then the transcript lines and action item follow
      if (document.querySelector(".meet-wrap")) {
        gsap.timeline({ scrollTrigger: { trigger: ".meet-wrap", start: "top 80%" } })
          .from(".meet-wrap", { rotationY: -40, opacity: 0, transformPerspective: 1200, transformOrigin: "0% 50%", duration: 1.1, ease: "power3.out" })
          .from(".meet-line", { x: -24, opacity: 0, stagger: 0.25, duration: 0.5, ease: "power2.out" }, "-=0.3")
          .from(".meet-act", { y: 12, opacity: 0, duration: 0.5, ease: "power2.out" }, "-=0.1");
      }

      // Knowledge: the card is revealed left to right, the icon spins in, the badge pops
      if (document.querySelector(".kn-wrap")) {
        gsap.timeline({ scrollTrigger: { trigger: ".kn-wrap", start: "top 80%" } })
          .fromTo(".kn-wrap", { clipPath: "inset(0% 100% 0% 0% round 24px)" }, { clipPath: "inset(0% 0% 0% 0% round 24px)", duration: 1.1, ease: "power3.inOut", clearProps: "clipPath" })
          .from(".kn-icon", { rotate: -180, scale: 0, duration: 0.7, ease: "back.out(2)" }, "-=0.4")
          .from(".kn-badge", { scale: 0, duration: 0.5, ease: "back.out(3)" }, "-=0.3");
      }

      // Roadmap: cards flip down from the top edge, one after another
      if (document.querySelector(".rm-card")) {
        gsap.from(".rm-card", {
          rotationX: 80, y: 40, opacity: 0, transformPerspective: 900, transformOrigin: "50% 0%",
          stagger: 0.18, duration: 1, ease: "back.out(1.4)",
          scrollTrigger: { trigger: ".rm-wrap", start: "top 80%" },
        });
        gsap.to(".rm-outline", {
          strokeDashoffset: 0, duration: 1.6, stagger: 0.18, delay: 0.5, ease: "power2.inOut",
          scrollTrigger: { trigger: ".rm-wrap", start: "top 80%" },
        });
      }

      // Footer: columns rise, then the wordmark rolls in letter by letter
      if (document.querySelector(".ft")) {
        gsap.from(".ft-col", { y: 30, opacity: 0, stagger: 0.12, duration: 0.8, ease: "power3.out", scrollTrigger: { trigger: ".ft", start: "top 88%" } });
        gsap.from(".ft-letter", { yPercent: 150, stagger: 0.06, duration: 1, ease: "power4.out", scrollTrigger: { trigger: ".ft", start: "top 75%" } });
      }
    }, root);

    return () => { if (mm) mm.revert(); ctx.revert(); };
  }, [calm]);

  const copyCommand = () => {
    navigator.clipboard?.writeText("npx dionysus-ai init --repo github.com/org/repo");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div ref={root} className="dn min-h-screen antialiased" style={{ background: IV, color: INK }}>
      <style>{FONTS}</style>
      <Cursor />

      {/* Scroll progress */}
      <motion.div style={{ scaleX: bar, background: CORAL }} className="fixed top-0 inset-x-0 z-50 h-1 origin-left transform-gpu" />

      {/* Header (no backdrop blur: it re-blurs on every scrolled frame) */}
      <motion.header
        initial={{ y: -60 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.7, ease }}
        className="sticky top-0 z-40 border-b"
        style={{ background: `${IV}f5`, borderColor: `${INK}14` }}
      >
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link to="/" className="dn-d flex items-center gap-2.5 text-xl font-extrabold tracking-tight">
            <motion.span whileHover={{ rotate: 90 }} className="h-7 w-7 rounded-lg grid place-items-center shadow-sm" style={{ background: TEAL }}>
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: CORAL }} />
            </motion.span>
            Dionysus
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium">
            <Link to="/login" className="lnk">Sign in</Link>
            <Link to="/register" className="rounded-full px-4 py-2 hover:opacity-90 transition-opacity shadow-sm" style={{ background: INK, color: IV }}>
              Connect a repo
            </Link>
          </nav>
        </div>
      </motion.header>

      {/* Hero */}
      <Hero3D nodes={NODES} calm={calm} Btn={Btn} />

      {/* 01 · The challenge */}
      <section id="challenge" className="max-w-6xl mx-auto px-5 pt-28 pb-8 scroll-mt-20">
        <Head
          n="01" eyebrow="The challenge"
          l1="A new project" l2="can feel like a maze."
          lead="It isn't anyone's fault. Projects grow faster than the map of them."
        />
        <div className="ch-wrap mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {CHALLENGES.map(([Icon, t, d], i) => (
            <div key={t} className="ch-card">
              <Panel>
                <Icon className="h-6 w-6" style={{ color: CORAL }} aria-hidden="true" />
                <h3 className="dn-d font-extrabold text-xl mt-5">{t}</h3>
                <p className="mt-2 text-sm opacity-75 leading-relaxed">{d}</p>
              </Panel>
            </div>
          ))}
        </div>
      </section>

      {/* 02 · The discovery */}
      <section id="map" className="max-w-6xl mx-auto px-5 pt-24 scroll-mt-20">
        <Head n="02" eyebrow="The discovery" l1="Give your codebase" l2="a map." />
        <div className="mt-10 max-w-2xl">
          <Bullets items={[
            "Explore project components and how they relate",
            "Follow code and dependency connections in an interactive graph",
            "See upstream callers and downstream dependents with blast-radius exploration",
            "Navigate visually instead of relying only on folders and search results",
          ]} />
          <p className="dn-m text-[11px] mt-6 opacity-50">The graph below is an illustrative sample project.</p>
        </div>
      </section>

      {/* Interactive Graph */}
      <section className="px-3 sm:px-5 pt-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.9, ease }}
          className="max-w-6xl mx-auto rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-12 relative overflow-hidden shadow-2xl transform-gpu"
          style={{ background: TEAL }}
        >
          <motion.div
            aria-hidden="true"
            className="absolute -right-24 -top-24 h-96 w-96 rounded-full blur-3xl pointer-events-none will-change-transform"
            style={{ background: CORAL, opacity: 0.2 }}
            animate={calm ? undefined : { x: [0, -40, 0], y: [0, 40, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="relative z-10">
            <Graph />
          </div>
        </motion.div>
      </section>

      {/* Language Marquee */}
      <div className="mt-20 overflow-hidden py-4 -rotate-1 shadow-md" style={{ background: CORAL }} aria-hidden="true">
        <motion.div
          className="dn-d flex w-max gap-10 text-2xl font-extrabold transform-gpu"
          animate={calm ? undefined : { x: ["0%", "-50%"] }}
          transition={{ duration: 26, repeat: Infinity, ease: "linear" }}
        >
          {[...LANGS, ...LANGS, ...LANGS, ...LANGS].map((l, i) => (
            <span key={i} className="flex items-center gap-10">
              {l}
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: INK }} />
            </span>
          ))}
        </motion.div>
      </div>

      {/* Bento Grid */}
      <section className="bento-wrap max-w-6xl mx-auto px-5 py-28">
        <h2 className="dn-d font-extrabold text-4xl sm:text-6xl leading-[1] max-w-3xl">
          <Line>Four core capabilities</Line>
          <Line style={{ color: TEAL }}>ready on day one.</Line>
        </h2>

        <div className="mt-14 grid md:grid-cols-6 gap-5">
          <Tilt className="bento md:col-span-4 rounded-3xl p-8 flex flex-col justify-between min-h-[320px] shadow-sm" style={{ background: IV2, border: `1px solid ${INK}1a` }}>
            <div className="flex items-center gap-2 font-semibold text-lg">
              <GitPullRequest className="h-5 w-5" style={{ color: CORAL }} /> Automated PR Risk Scoring
            </div>
            <div className="my-auto pt-6">
              <p className="dn-d font-extrabold text-8xl sm:text-9xl leading-none">
                <Counter to={78} />
                <span className="text-3xl font-medium" style={{ color: `${INK}80` }}>/100</span>
              </p>
              <div className="mt-6 h-3 rounded-full overflow-hidden p-0.5" style={{ background: `${INK}14` }}>
                <motion.div
                  className="h-full rounded-full origin-left transform-gpu"
                  style={{ background: CORAL, width: "78%" }}
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.6, ease }}
                />
              </div>
              <p className="dn-m text-xs mt-4 opacity-75">PR #1429 jwt.ts reaches 4 downstream callers and 8 routes.</p>
            </div>
          </Tilt>

          <Tilt className="bento md:col-span-2 rounded-3xl p-8 min-h-[320px] shadow-sm flex flex-col justify-between" style={{ background: TEAL, color: IV }}>
            <div className="flex items-center gap-2 font-semibold">
              <ShieldCheck className="h-5 w-5" style={{ color: CORAL }} /> Zero Storage Architecture
            </div>
            <div>
              <p className="dn-d text-3xl font-extrabold mt-6 leading-tight">Parsed, mapped, then destroyed.</p>
              <p className="mt-3 text-sm opacity-80 leading-relaxed">Raw source code is evaluated strictly inside RAM sandboxes and is never retained or trained on.</p>
            </div>
          </Tilt>

          <Tilt className="bento md:col-span-3 rounded-3xl p-8 min-h-[280px] shadow-sm flex flex-col justify-between" style={{ background: IV2, border: `1px solid ${INK}1a` }}>
            <div className="flex items-center gap-2 font-semibold">
              <MessageSquare className="h-5 w-5" style={{ color: CORAL }} /> Natural Language Querying
            </div>
            <div className="space-y-3">
              <p className="rounded-2xl px-4 py-3 text-sm w-fit ml-auto shadow-sm" style={{ background: `${INK}0d` }}>
                Where do we refresh expired sessions?
              </p>
              <p className="dn-m rounded-2xl px-4 py-3 text-xs leading-relaxed border" style={{ background: `${TEAL}14`, borderColor: `${TEAL}20` }}>
                <Typed text="In auth-vault at src/session/refresh.rs:42. It is called from api-gateway/middleware/guard.ts:18." />
              </p>
            </div>
          </Tilt>

          <Tilt className="bento md:col-span-3 rounded-3xl p-8 min-h-[280px] shadow-sm flex flex-col justify-between" style={{ background: CORAL }}>
            <div className="flex items-center gap-2 font-semibold" style={{ color: INK }}>
              <Mic className="h-5 w-5" /> Architecture Decisions in Context
            </div>
            <div className="space-y-3 mt-4">
              {[
                ["Decision", "Keep getTenant() for billing metering", "services/billing.ts"],
                ["Action", "Update JWT refresh integration tests", "auth/jwt.test.ts"],
              ].map(([k, v, f], i) => (
                <motion.div
                  key={k}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.2, duration: 0.5, ease }}
                  className="rounded-2xl px-4 py-3 shadow-sm transform-gpu"
                  style={{ background: IV2, color: INK }}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider opacity-60">{k}</p>
                    <span className="dn-m text-[10px] font-semibold" style={{ color: TEAL }}>{f}</span>
                  </div>
                  <p className="text-sm font-medium mt-0.5">{v}</p>
                </motion.div>
              ))}
            </div>
          </Tilt>
        </div>
      </section>

      {/* 03 · Ask the codebase */}
      <section id="ask" className="max-w-6xl mx-auto px-5 pb-28 scroll-mt-20">
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
                <span key={t} className="dn-m text-xs px-3 py-1 rounded-full border" style={{ borderColor: `${INK}26` }}>{t}</span>
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

      {/* 04 · Meetings */}
      <section id="meetings" className="max-w-6xl mx-auto px-5 pb-28 scroll-mt-20">
        <Head n="04" eyebrow="Meetings" l1="Turn conversations" l2="into next steps." />
        <div className="mt-12 grid lg:grid-cols-2 gap-12 items-center">
          <Bullets items={[
            "Meeting audio transcription with AssemblyAI",
            "Multi-speaker recognition and timestamps in transcripts",
            "AI-assisted extraction of engineering action items",
            "Meeting pages and detail views for reviewing project discussions",
          ]} />
          <div className="meet-wrap">
            <Tilt className="rounded-3xl p-7 shadow-sm space-y-4" style={{ background: INK, color: IV }}>
              <div className="flex items-end gap-[3px] h-8" aria-hidden="true">
                {Array.from({ length: 28 }).map((_, i) => (
                  <motion.span
                    key={i}
                    className="w-1 h-full rounded-full origin-bottom"
                    style={{ background: i % 5 === 0 ? CORAL : `${IV}55` }}
                    initial={{ scaleY: 0.2 }}
                    animate={calm ? { scaleY: 0.5 } : { scaleY: [0.2, 1, 0.35, 0.8, 0.2] }}
                    transition={{ duration: 1.6 + (i % 5) * 0.2, repeat: Infinity, ease: "easeInOut", delay: i * 0.05 }}
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
            </Tilt>
          </div>
        </div>
      </section>

      {/* 05 · Knowledge */}
      <section id="knowledge" className="max-w-6xl mx-auto px-5 pb-28 scroll-mt-20">
        <Head n="05" eyebrow="Knowledge" l1="Make project knowledge" l2="easier to find." />
        <div className="mt-12 grid lg:grid-cols-2 gap-12 items-center">
          <Bullets items={[
            "Centralize technical documentation for a project",
            "Explore project documentation and wiki-style pages",
            "Help developers find knowledge during onboarding and daily work",
          ]} />
          <div className="kn-wrap">
            <Panel>
              <div className="flex items-center justify-between gap-3">
                <BookOpen className="kn-icon h-6 w-6" style={{ color: CORAL }} aria-hidden="true" />
                <Planned className="kn-badge" />
              </div>
              <h3 className="dn-d font-extrabold text-2xl mt-5">A more advanced DeepWiki experience</h3>
              <p className="mt-2 opacity-75 leading-relaxed">Planned: AI-generated wiki chapters, Mermaid diagrams, and exports.</p>
            </Panel>
          </div>
        </div>
      </section>

      {/* 06 · Coming next */}
      <section id="roadmap" className="max-w-6xl mx-auto px-5 pb-28 scroll-mt-20">
        <Head
          n="06" eyebrow="Coming next"
          l1="See what" l2="could be better."
          lead="These features are on the roadmap. They are not available yet."
        />
        <div className="rm-wrap mt-12 grid md:grid-cols-3 gap-5">
          {[
            [HeartPulse, "Repository health", "A health score and technical indicators, with findings on architecture, complexity, dead code, onboarding, and dependencies."],
            [Database, "Schema intelligence", "Database schema analysis and interactive ER diagrams, with diagnostics such as missing indexes."],
            [Users, "Keep the team in the same context", "Repository chat rooms with an embedded @dionysus assistant, file mentions, and threaded discussions."],
          ].map(([Icon, t, d], i) => (
            <div key={t} className="rm-card relative">
              {!calm && (
                <svg aria-hidden="true" className="absolute inset-0 z-10 w-full h-full pointer-events-none">
                  <rect className="rm-outline" x="1" y="1" width="99.6%" height="99.4%" rx="24" fill="none" stroke={CORAL} strokeWidth="1.5" pathLength="1" strokeDasharray="1" strokeDashoffset="1" />
                </svg>
              )}
              <Panel>
                <div className="flex items-center justify-between gap-3">
                  <Icon className="h-6 w-6" style={{ color: CORAL }} aria-hidden="true" />
                  <Planned />
                </div>
                <h3 className="dn-d font-extrabold text-2xl mt-5">{t}</h3>
                <p className="mt-2 text-sm opacity-75 leading-relaxed">{d}</p>
              </Panel>
            </div>
          ))}
        </div>
      </section>

      {/* Pinned Horizontal Pipeline */}
      <section className="hs relative overflow-hidden" style={{ background: INK, color: IV }}>
        <div className="min-h-screen flex flex-col justify-center py-20">
          <h2 className="dn-d font-extrabold text-4xl sm:text-6xl px-5 max-w-6xl mx-auto w-full leading-[1]">
            From commit to a map you can trust.
          </h2>

          <div className="mt-12 px-5 max-w-6xl mx-auto w-full">
            <div className="h-0.5 w-full bg-white/10">
              <div className="hs-bar h-1 origin-left transform-gpu" style={{ background: CORAL, transform: calm ? "none" : "scaleX(0)" }} />
            </div>
          </div>

          <div className={`hs-track mt-12 flex gap-6 px-5 ${calm ? "overflow-x-auto" : "w-max"}`}>
            {STEPS.map(([t, d], i) => (
              <div
                key={t}
                className="w-[82vw] sm:w-[420px] shrink-0 rounded-3xl p-8 min-h-[320px] flex flex-col justify-between border border-white/10 shadow-2xl transform-gpu"
                style={{ background: i % 2 ? TEAL : "#16302d" }}
              >
                <span className="dn-d text-7xl font-extrabold" style={{ color: CORAL }}>0{i + 1}</span>
                <div>
                  <h3 className="dn-d text-3xl font-extrabold">{t}</h3>
                  <p className="mt-3 opacity-80 leading-relaxed text-sm sm:text-base">{d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 07 · How it works */}
      <section id="how" className="how-wrap max-w-6xl mx-auto px-5 py-28 scroll-mt-20">
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

      {/* Terminal + FAQ */}
      <section className="max-w-3xl mx-auto px-5 pb-28 space-y-24">
        <div className="space-y-6">
          <h2 className="dn-d font-extrabold text-3xl sm:text-5xl">Start from your terminal.</h2>
          <div className="dn-m flex items-center justify-between rounded-2xl p-5 text-xs sm:text-sm shadow-2xl border border-white/10 transform-gpu" style={{ background: INK, color: IV }}>
            <span className="overflow-x-auto select-all flex items-center gap-2">
              <span style={{ color: CORAL }}>$</span>
              npx dionysus-ai init --repo github.com/org/repo
            </span>
            <button onClick={copyCommand} aria-label="Copy command" className="p-2 shrink-0 hover:bg-white/10 rounded-lg transition-colors">
              {copied ? <Check className="h-4 w-4" style={{ color: CORAL }} /> : <Copy className="h-4 w-4 opacity-70" />}
            </button>
          </div>
        </div>

        <div>
          <h2 className="dn-d font-extrabold text-3xl sm:text-5xl mb-8">Questions & Answers</h2>
          <div className="border-y" style={{ borderColor: `${INK}26` }}>
            {FAQS.map(([q, a], i) => (
              <div key={q} className="py-2" style={i ? { borderTop: `1px solid ${INK}26` } : undefined}>
                <button
                  onClick={() => setOpen(open === i ? -1 : i)}
                  aria-expanded={open === i}
                  className="w-full flex items-center justify-between py-4 text-left text-lg font-semibold group"
                >
                  <span className="group-hover:opacity-75 transition-opacity">{q}</span>
                  <motion.span
                    animate={{ rotate: open === i ? 135 : 0, backgroundColor: open === i ? CORAL : "rgba(0,0,0,0)" }}
                    className="h-8 w-8 rounded-full grid place-items-center shrink-0 ml-4 border transform-gpu"
                    style={{ borderColor: `${INK}33` }}
                  >
                    <Plus className="h-4 w-4" />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {open === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease }}
                      className="overflow-hidden"
                    >
                      <p className="pb-6 max-w-xl leading-relaxed text-sm sm:text-base opacity-80">{a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section ref={ctaRef} className="px-3 sm:px-5 pb-8">
        <motion.div
          style={{ scale: calm ? 1 : ctaScale, borderRadius: calm ? 32 : ctaRadius, background: TEAL, color: IV }}
          className="max-w-6xl mx-auto px-6 py-24 sm:py-32 text-center relative overflow-hidden shadow-2xl transform-gpu"
        >
          <motion.div
            aria-hidden="true"
            className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl pointer-events-none will-change-transform"
            style={{ background: CORAL, opacity: 0.25 }}
            animate={calm ? undefined : { scale: [1, 1.25, 1] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
          <p className="dn-m relative z-10 text-xs uppercase tracking-widest opacity-70 mb-6">Understand the system behind the code</p>
          <h2 className="dn-d relative z-10 font-extrabold text-4xl sm:text-7xl leading-[1]">
            Stop guessing<br />what a change breaks.
          </h2>
          <div className="relative z-10 mt-10 flex flex-wrap items-center justify-center gap-4">
            <Btn to="/register">Connect your first repo</Btn>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full px-7 h-[52px] font-semibold border hover:bg-white/10 transition-colors"
              style={{ borderColor: `${IV}66` }}
            >
              View on GitHub <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="ft overflow-hidden" style={{ background: INK, color: IV, "--lnk": CORAL }}>
        <div className="w-full px-5 sm:px-10 lg:px-16 pt-20 pb-8">
          <div className="grid gap-12 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
            <div className="ft-col space-y-5">
              <Link to="/" className="dn-d inline-flex items-center gap-2.5 text-2xl font-extrabold tracking-tight">
                <span className="h-8 w-8 rounded-lg grid place-items-center" style={{ background: TEAL }}>
                  <span className="h-3 w-3 rounded-full" style={{ background: CORAL }} />
                </span>
                Dionysus
              </Link>
              <p className="text-base leading-relaxed opacity-70 max-w-sm">
                Give your codebase a map. A workspace for understanding and improving complex projects.
              </p>
            </div>
            {FOOTER_COLS.map(([title, links]) => (
              <div key={title} className="ft-col">
                <h4 className="dn-m text-xs uppercase tracking-widest mb-5 opacity-50">{title}</h4>
                <ul className="space-y-3 text-base">
                  {links.map(([label, href]) => (
                    <li key={label}>
                      {href.startsWith("#") ? <a href={href} className="lnk">{label}</a>
                        : href.startsWith("http") ? <a href={href} target="_blank" rel="noopener noreferrer" className="lnk">{label}</a>
                        : <Link to={href} className="lnk">{label}</Link>}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-16">
            <FitText text="Dionysus" color={`${TEAL}b3`} />
          </div>

          <div className="pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs opacity-60" style={{ borderColor: `${IV}33` }}>
            <span>© {new Date().getFullYear()} Dionysus Technologies Inc. All rights reserved.</span>
            <span>Features marked “On the roadmap” are planned, not yet released.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
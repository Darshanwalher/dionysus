import { useEffect, useLayoutEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useReducedMotion } from "framer-motion";
import useSectionAnim from "../useSectionAnim";
import { IV, TEAL, CORAL, INK, GITHUB_URL } from "../theme";

const FOOTER_COLS = [
  ["Platform", [["Architecture Map", "#map"], ["DeepWiki", "#deepwiki"], ["Ask Codebase", "#ask"], ["Meetings", "#meetings"]]],
  ["Capabilities", [["Real-Time Chat Rooms", "#features"], ["Schema Intelligence", "#features"], ["Repository Health", "#features"]]],
  ["Get Started", [["Sign in", "/login"], ["Connect a repo", "/register"], ["GitHub", GITHUB_URL]]],
];

/* Full-width wordmark with a lagging cursor spotlight */
function FitText({ text, color }) {
  const calm = useReducedMotion();
  const box = useRef(null);
  const inner = useRef(null);
  const glow = useRef(null);

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
  const letters = () => text.split("").map((c, i) => <span key={i} className="inline-block">{c}</span>);

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

/* Footer. Columns rise and the wordmark rolls in letter by letter; scrolling up rolls it back out. */
export default function Footer() {
  const root = useRef(null);

  useSectionAnim(root, ({ gsap, st, $, $$ }) => {
    gsap.from($$(".ft-col"), { y: 30, opacity: 0, stagger: 0.12, duration: 0.8, ease: "power3.out", scrollTrigger: st(root.current, "top 88%") });
    gsap.from($$(".ft-letter"), { yPercent: 150, stagger: 0.06, duration: 1, ease: "power4.out", scrollTrigger: st(root.current, "top 75%") });
  });

  return (
    <footer ref={root} className="ft overflow-hidden" style={{ background: INK, color: IV, "--lnk": CORAL }}>
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
  );
}
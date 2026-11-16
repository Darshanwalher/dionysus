/**
 * Landing page header.
 * Place at: client/src/pages/landing/sections/Header.jsx (replaces the old one, no other file changes)
 *
 * - Sits at the top as a full-width bar, then morphs into a floating pill once you scroll
 * - Section links glide a hover highlight and keep a coral dot under the section you are reading
 * - Links scroll smoothly to their section (accounts for the header height)
 * - Under 1024px the links move into an animated menu (icon morphs to an X, links stagger in,
 *   Esc / outside click / resize closes it)
 * - Entrance: bar drops in, then the logo and links stagger in
 * - Respects prefers-reduced-motion; has a "Skip to content" link for keyboard users
 *
 * The header is fixed, so a 64px spacer keeps the page layout exactly as before.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { IV, IV2, TEAL, CORAL, INK, ease, GITHUB_URL } from "../theme";

const NAV = [
  ["The map", "map"],
  ["Ask", "ask"],
  ["Meetings", "meetings"],
  ["DeepWiki", "deepwiki"],
  ["Features", "features"],
  ["FAQ", "faq"],
];
const IDS = NAV.map(([, id]) => id);

/* The id of the section that crosses the middle of the screen (null near the very top) */
function useActiveSection(ids) {
  const [active, setActive] = useState(null);
  useEffect(() => {
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean);
    if (!els.length || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: "-40% 0px -55% 0px" }
    );
    els.forEach((el) => io.observe(el));
    const onScroll = () => window.scrollY < 300 && setActive(null);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, [ids]);
  return active;
}

/* Animated hamburger: three bars that become an X */
function Burger({ open }) {
  const bar = "absolute left-0 h-[2px] w-5 rounded-full";
  return (
    <span className="relative block h-4 w-5" aria-hidden="true">
      <motion.span className={`${bar} top-0`} style={{ background: INK }} animate={{ y: open ? 7 : 0, rotate: open ? 45 : 0 }} transition={{ duration: 0.3, ease }} />
      <motion.span className={`${bar} top-[7px]`} style={{ background: INK }} animate={{ opacity: open ? 0 : 1, scaleX: open ? 0.3 : 1 }} transition={{ duration: 0.2 }} />
      <motion.span className={`${bar} top-[14px]`} style={{ background: INK }} animate={{ y: open ? -7 : 0, rotate: open ? -45 : 0 }} transition={{ duration: 0.3, ease }} />
    </span>
  );
}

export default function Header() {
  const calm = useReducedMotion();
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  const [hover, setHover] = useState(null);
  const active = useActiveSection(IDS);

  // Bar to pill
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Esc closes the menu; it also closes when the screen becomes wide
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setMenu(false);
    const mq = window.matchMedia("(min-width: 1024px)");
    const onMq = () => mq.matches && setMenu(false);
    window.addEventListener("keydown", onKey);
    mq.addEventListener("change", onMq);
    return () => {
      window.removeEventListener("keydown", onKey);
      mq.removeEventListener("change", onMq);
    };
  }, []);

  const goTo = (id) => (e) => {
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    setMenu(false);
    const y = el.getBoundingClientRect().top + window.scrollY - 72;
    window.scrollTo({ top: y, behavior: calm ? "auto" : "smooth" });
    history.replaceState(null, "", `#${id}`);
  };

  const list = {
    hidden: {},
    show: { transition: { staggerChildren: calm ? 0 : 0.06, delayChildren: calm ? 0 : 0.35 } },
  };
  const item = {
    hidden: { opacity: calm ? 1 : 0, y: calm ? 0 : -8 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease } },
  };

  return (
    <>
      <a
        href="#challenge"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-full focus:px-4 focus:py-2 focus:text-sm focus:font-semibold"
        style={{ background: INK, color: IV }}
      >
        Skip to content
      </a>

      {/* keeps the page layout the same as before (the header itself is fixed) */}
      <div aria-hidden="true" className="h-16" />

      <motion.header
        initial={{ y: calm ? 0 : -80, opacity: calm ? 1 : 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease }}
        className={`fixed inset-x-0 top-0 z-40 flex justify-center transition-[padding] duration-500 ease-out motion-reduce:transition-none ${scrolled ? "px-3 pt-3" : "px-0 pt-0"}`}
      >
        {/* click outside to close the mobile menu */}
        <AnimatePresence>
          {menu && (
            <motion.button
              type="button"
              aria-label="Close menu"
              className="fixed inset-0 -z-10 cursor-default"
              style={{ background: `${INK}33` }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenu(false)}
            />
          )}
        </AnimatePresence>

        <div
          className={`relative w-full transition-[max-width,border-radius,box-shadow,background-color] duration-500 ease-out motion-reduce:transition-none ${
            scrolled ? "max-w-5xl rounded-full border shadow-[0_10px_40px_-14px_rgba(16,33,31,0.28)]" : "max-w-[120rem] border-b"
          }`}
          style={{ background: scrolled ? `${IV2}f5` : `${IV}f5`, borderColor: `${INK}14` }}
        >
          <motion.div
            variants={list}
            initial="hidden"
            animate="show"
            className={`mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 transition-[height] duration-500 ease-out motion-reduce:transition-none ${scrolled ? "h-14" : "h-16"}`}
          >
            {/* Logo */}
            <motion.div variants={item}>
              <Link to="/" aria-label="Dionysus home" className="dn-d flex items-center gap-2.5 text-xl font-extrabold tracking-tight">
                <motion.span
                  whileHover={calm ? undefined : { rotate: 90, scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300, damping: 18 }}
                  className="grid h-7 w-7 place-items-center rounded-lg shadow-sm"
                  style={{ background: TEAL }}
                >
                  <motion.span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: CORAL }}
                    animate={calm ? undefined : { scale: [1, 1.3, 1] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  />
                </motion.span>
                Dionysus
              </Link>
            </motion.div>

            {/* Section links (desktop) */}
            <LayoutGroup id="landing-nav">
              <nav aria-label="Sections" className="hidden items-center gap-1 lg:flex" onMouseLeave={() => setHover(null)}>
                {NAV.map(([label, id]) => {
                  const isActive = active === id;
                  return (
                    <motion.a
                      key={id}
                      variants={item}
                      href={`#${id}`}
                      onClick={goTo(id)}
                      onMouseEnter={() => setHover(id)}
                      onFocus={() => setHover(id)}
                      onBlur={() => setHover(null)}
                      aria-current={isActive ? "true" : undefined}
                      className="relative rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors duration-200"
                      style={{ color: isActive || hover === id ? INK : `${INK}b3` }}
                    >
                      {hover === id && (
                        <motion.span
                          layoutId="nav-hover"
                          className="absolute inset-0 rounded-full"
                          style={{ background: `${INK}0d` }}
                          transition={{ type: "spring", stiffness: 420, damping: 34 }}
                        />
                      )}
                      <span className="relative">{label}</span>
                      {isActive && (
                        <motion.span
                          layoutId="nav-active"
                          className="absolute -bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full"
                          style={{ background: CORAL }}
                          transition={{ type: "spring", stiffness: 420, damping: 32 }}
                        />
                      )}
                    </motion.a>
                  );
                })}
              </nav>
            </LayoutGroup>

            {/* Actions */}
            <div className="flex items-center gap-2 sm:gap-4">
              <motion.div variants={item} className="hidden lg:block">
                <Link to="/login" className="lnk text-sm font-medium">Sign in</Link>
              </motion.div>
              <motion.div variants={item}>
                <Link
                  to="/register"
                  className="group inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-sm font-semibold shadow-sm transition-colors duration-300 hover:bg-[#17645F] sm:px-5"
                  style={{ background: INK, color: IV }}
                >
                  Connect a repo
                  <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </Link>
              </motion.div>

              <motion.button
                variants={item}
                type="button"
                onClick={() => setMenu((m) => !m)}
                aria-expanded={menu}
                aria-controls="landing-menu"
                aria-label={menu ? "Close menu" : "Open menu"}
                className="grid h-10 w-10 place-items-center rounded-full lg:hidden"
                style={{ background: menu ? `${INK}0d` : "transparent" }}
              >
                <Burger open={menu} />
              </motion.button>
            </div>
          </motion.div>

          {/* Mobile menu */}
          <AnimatePresence>
            {menu && (
              <motion.div
                id="landing-menu"
                initial={{ opacity: 0, y: -12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.3, ease }}
                className="absolute left-0 right-0 top-full mt-2 origin-top overflow-hidden rounded-3xl border p-3 shadow-[0_24px_60px_-20px_rgba(16,33,31,0.4)] lg:hidden"
                style={{ background: IV2, borderColor: `${INK}14` }}
              >
                <motion.ul
                  initial="hidden"
                  animate="show"
                  variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05, delayChildren: 0.08 } } }}
                >
                  {NAV.map(([label, id], i) => (
                    <motion.li key={id} variants={{ hidden: { opacity: 0, x: -12 }, show: { opacity: 1, x: 0, transition: { duration: 0.4, ease } } }}>
                      <a
                        href={`#${id}`}
                        onClick={goTo(id)}
                        className="flex items-center justify-between rounded-2xl px-4 py-3 text-lg font-semibold transition-colors hover:bg-black/5"
                        style={{ color: active === id ? CORAL : INK }}
                      >
                        <span className="flex items-baseline gap-3">
                          <span className="dn-m text-xs opacity-40">{String(i + 1).padStart(2, "0")}</span>
                          {label}
                        </span>
                        <ArrowUpRight className="h-4 w-4 opacity-40" />
                      </a>
                    </motion.li>
                  ))}
                </motion.ul>

                <div className="mt-2 grid grid-cols-2 gap-2 border-t p-2 pt-3" style={{ borderColor: `${INK}14` }}>
                  <Link to="/login" onClick={() => setMenu(false)} className="grid h-11 place-items-center rounded-full border text-sm font-semibold" style={{ borderColor: `${INK}26` }}>
                    Sign in
                  </Link>
                  <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="grid h-11 place-items-center rounded-full border text-sm font-semibold" style={{ borderColor: `${INK}26` }}>
                    GitHub
                  </a>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.header>
    </>
  );
}
import { useLayoutEffect, useRef } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import {
  BookText,
  FileQuestion,
  Presentation,
  FolderTree,
  GitBranch,
  Zap,
  ArrowLeft,
  Shield,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/* ──────────────────────────────────────────────────────────────
   LIGHT ONLY.
   1. The root re-declares every colour token from index.css :root, so
      Input / Button / PasswordField (which read tokens) stay ivory + teal.
   2. While an auth page is mounted we remove the `dark` class from <html>
      (and put it back on leave), so `dark:` utilities cannot kick in.
   ────────────────────────────────────────────────────────────── */
const LIGHT_VARS = {
  colorScheme: "light",
  "--background": "#F3EEE8",
  "--foreground": "#10211F",
  "--card": "#FAF7F2",
  "--card-foreground": "#10211F",
  "--surface-elevated": "#FFFDFA",
  "--surface-hover": "#EBE4DA",
  "--popover": "#FAF7F2",
  "--popover-foreground": "#10211F",
  "--primary": "#17645F",
  "--primary-foreground": "#FAF7F2",
  "--secondary": "#EBE4DA",
  "--secondary-foreground": "#10211F",
  "--muted": "#EBE4DA",
  "--muted-foreground": "#5B6B68",
  "--accent": "#E6DFD3",
  "--accent-foreground": "#10211F",
  "--brand": "#17645F",
  "--highlight": "#FF6845",
  "--destructive": "#C62A3B",
  "--destructive-foreground": "#FFFFFF",
  "--border": "#DDD5C9",
  "--input": "#DDD5C9",
  "--ring": "#17645F",
};

const CAPABILITIES = [
  { icon: GitBranch, label: "Real-time GitHub commit & webhook synchronization" },
  { icon: FolderTree, label: "Deterministic AST architecture & dependency graphs" },
  { icon: Presentation, label: "Sprint meeting audio transcription & decision diarization" },
  { icon: FileQuestion, label: "Vectorized codebase Q&A with AST line citations" },
  { icon: BookText, label: "Dynamic living technical documentation engine" },
];

const TAGLINES = [
  "Your repo, finally explained.",
  "Ask your code. Get answers with receipts.",
  "Meetings end. Decisions stay.",
  "Docs that update themselves.",
  "New teammates shipping in days, not months.",
];

const WORDS = ["Map it.", "Ask it.", "Ship it."];
const SCRAMBLE_CHARS = "!<>-_\\/[]{}=+*^?#abcdefghijklmnopqrstuvwxyz";

const GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

const prefersReduced = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ───────────────────────── Shared pieces ───────────────────────── */

/** Error box: elastic shake-in whenever the message changes. */
export function AuthError({ message }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    if (!message || !ref.current || prefersReduced()) return;
    gsap.fromTo(
      ref.current,
      { opacity: 0, y: -10, x: -16 },
      { opacity: 1, y: 0, x: 0, duration: 1, ease: "elastic.out(1, 0.35)" }
    );
  }, [message]);
  if (!message) return null;
  return (
    <div
      ref={ref}
      role="alert"
      className="rounded-xl border border-[#C62A3B]/30 bg-[#C62A3B]/10 px-4 py-3 text-sm text-[#C62A3B]"
    >
      {message}
    </div>
  );
}

/** Wrapper that leans toward the cursor, then springs back. */
export function Magnetic({ children, strength = 0.3, className = "" }) {
  const ref = useRef(null);
  const move = (e) => {
    if (prefersReduced() || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    gsap.to(ref.current, {
      x: (e.clientX - (r.left + r.width / 2)) * strength,
      y: (e.clientY - (r.top + r.height / 2)) * strength * 1.4,
      duration: 0.4,
      ease: "power3.out",
    });
  };
  const leave = () => {
    if (!ref.current) return;
    gsap.to(ref.current, { x: 0, y: 0, duration: 1, ease: "elastic.out(1, 0.4)" });
  };
  return (
    <div ref={ref} onMouseMove={move} onMouseLeave={leave} data-auth-item className={className}>
      {children}
    </div>
  );
}

/** Label + icon + Input, with a coral line that draws under the field on focus. */
export function AuthField({ id, label, icon: Icon, ...inputProps }) {
  const bar = useRef(null);
  const icon = useRef(null);
  const focus = (on) => {
    if (prefersReduced()) return;
    gsap.to(bar.current, { scaleX: on ? 1 : 0, duration: 0.5, ease: "power3.out" });
    gsap.to(icon.current, { color: on ? "#FF6845" : "#5B6B68", scale: on ? 1.15 : 1, duration: 0.3 });
  };
  return (
    <div data-auth-item className="space-y-2">
      <Label htmlFor={id} className="text-xs font-semibold text-[#10211F]">
        {label}
      </Label>
      <div
        className="relative"
        onFocusCapture={() => focus(true)}
        onBlurCapture={() => focus(false)}
      >
        <Icon
          ref={icon}
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5B6B68]"
        />
        <Input
          id={id}
          className="h-12 rounded-xl border-[#DDD5C9] bg-[#FFFDFA] pl-11 text-sm text-[#10211F] placeholder:text-[#7F8C89] focus-visible:border-[#17645F] focus-visible:ring-0"
          {...inputProps}
        />
        <span
          ref={bar}
          className="pointer-events-none absolute -bottom-px left-3 right-3 h-[2px] origin-left rounded-full bg-[#FF6845]"
          style={{ transform: "scaleX(0)" }}
        />
      </div>
    </div>
  );
}

/* ───────────────────────── Layout ───────────────────────── */

export default function AuthLayout({ title, description, children, footer }) {
  const root = useRef(null);

  // Keep the page light even if the app is in dark mode.
  useLayoutEffect(() => {
    const html = document.documentElement;
    const hadDark = html.classList.contains("dark");
    html.classList.remove("dark");
    return () => {
      if (hadDark) html.classList.add("dark");
    };
  }, []);

  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const q = (s) => el.querySelectorAll(s);
    const one = (s) => el.querySelector(s);
    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      /* One orchestrated entrance */
      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
      tl.fromTo(
        one("[data-panel]"),
        { clipPath: "inset(0% 0% 0% 100% round 32px)" },
        { clipPath: "inset(0% 0% 0% 0% round 32px)", duration: 1.3, ease: "power4.inOut" },
        0
      )
        .from(q("[data-top]"), { y: -20, opacity: 0, duration: 0.8, stagger: 0.08 }, 0.2)
        .from(q("[data-word]"), { yPercent: 115, rotate: 4, duration: 1, stagger: 0.07 }, 0.35)
        .from(one("[data-desc]"), { y: 20, opacity: 0, duration: 0.8 }, 0.75)
        .from(q("[data-auth-item]"), { y: 30, opacity: 0, duration: 0.9, stagger: 0.09 }, 0.85)
        .from(q("[data-fade]"), { opacity: 0, y: 12, duration: 0.8, stagger: 0.1 }, 1.1);

      /* Kinetic headline: characters rise in */
      const chars = Array.from(q("[data-char]"));
      gsap.from(chars, {
        yPercent: 120, rotateX: -80, opacity: 0,
        duration: 1.1, stagger: 0.035, ease: "power4.out", delay: 0.9,
        transformOrigin: "50% 100%",
      });

      /* Each line drifts sideways, in opposite directions */
      q("[data-line]").forEach((line, i) => {
        gsap.to(line, { x: i % 2 ? -18 : 18, duration: 4 + i, repeat: -1, yoyo: true, ease: "sine.inOut" });
      });

      /* Drifting glow */
      gsap.to(one("[data-glow]"), {
        x: 40, y: -30, scale: 1.2, duration: 6, repeat: -1, yoyo: true, ease: "sine.inOut",
      });

      /* Decoding line: scrambles, then resolves into each tagline */
      const scr = one("[data-scramble]");
      const render = (text, p) => {
        let out = "";
        for (let i = 0; i < text.length; i++) {
          out += text[i] === " " || i < text.length * p
            ? text[i]
            : SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
        }
        scr.textContent = out;
      };
      const decode = gsap.timeline({ repeat: -1, delay: 1.8 });
      TAGLINES.forEach((t) => {
        const o = { p: 0 };
        decode
          .to(o, { p: 1, duration: 1.4, ease: "power2.inOut", onUpdate: () => render(t, o.p) })
          .to({}, { duration: 2.4 })
          .set(o, { p: 0 });
      });

/* Capability marquee */
      gsap.to(one("[data-marquee]"), { xPercent: -50, duration: 38, ease: "none", repeat: -1 });

      /* Cursor spotlight + letters that swell and warm up near the pointer */
      const panel = one("[data-panel]");
      const spot = one("[data-spot]");
      const sx = gsap.quickTo(spot, "x", { duration: 0.6, ease: "power3.out" });
      const sy = gsap.quickTo(spot, "y", { duration: 0.6, ease: "power3.out" });
      const onMove = (e) => {
        const r = panel.getBoundingClientRect();
        sx(e.clientX - r.left - 200);
        sy(e.clientY - r.top - 200);
        chars.forEach((c) => {
          const b = c.getBoundingClientRect();
          const d = Math.hypot(e.clientX - (b.left + b.width / 2), e.clientY - (b.top + b.height / 2));
          const t = Math.max(0, 1 - d / 220);
          gsap.to(c, {
            fontWeight: 500 + t * 300,
            y: -t * 20,
            scale: 1 + t * 0.12,
            color: gsap.utils.interpolate("#FAF7F2", "#FF6845", t),
            duration: 0.35, ease: "power2.out", overwrite: "auto",
          });
        });
      };
      const onLeave = () =>
        gsap.to(chars, {
          fontWeight: 500, y: 0, scale: 1, color: "#FAF7F2",
          duration: 0.9, stagger: 0.02, ease: "elastic.out(1, 0.5)", overwrite: "auto",
        });
      panel.addEventListener("mousemove", onMove);
      panel.addEventListener("mouseleave", onLeave);
      return () => {
        panel.removeEventListener("mousemove", onMove);
        panel.removeEventListener("mouseleave", onLeave);
      };
    });

    return () => mm.revert();
  }, []);

  const words = String(title).split(" ");

  return (
    <div
      ref={root}
      style={LIGHT_VARS}
      className="min-h-screen bg-[#F3EEE8] font-sans text-[#10211F] selection:bg-[#FF6845]/25"
    >
      <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        {/* ───────── Form side ───────── */}
        <main className="relative flex flex-col px-6 py-6 sm:px-10 lg:px-14 lg:py-8">
          <header className="flex items-center justify-between">
            <Link to="/" data-top className="group flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#17645F] shadow-sm transition-transform duration-300 group-hover:rotate-12">
                <Zap className="h-4 w-4 text-[#FAF7F2]" />
              </span>
              <span className="text-lg font-extrabold tracking-tight">Dionysus</span>
            </Link>
            <Link
              to="/"
              data-top
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#5B6B68] transition-colors hover:text-[#10211F]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to home
            </Link>
          </header>

          <div className="flex flex-1 items-center py-10">
            <div className="w-full max-w-md">
              <h1
                aria-label={String(title)}
                className="text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl"
              >
                {words.map((w, i) => (
                  <span
                    key={i}
                    aria-hidden="true"
                    className="mr-[0.25em] -mb-[0.14em] inline-block overflow-hidden pb-[0.14em] align-bottom"
                  >
                    <span data-word className="inline-block will-change-transform">
                      {w}
                    </span>
                  </span>
                ))}
              </h1>
              <p
                data-desc
                className="mt-4 max-w-sm text-[15px] leading-relaxed text-[#5B6B68]"
              >
                {description}
              </p>

              <div className="mt-8">{children}</div>

              {footer ? (
                <div data-fade className="mt-8 text-sm text-[#5B6B68]">
                  {footer}
                </div>
              ) : null}
            </div>
          </div>

          <p data-fade className="text-xs text-[#7F8C89]">
            Passwords are hashed with bcrypt and sessions use short-lived JWT tokens.
          </p>
        </main>

        {/* ───────── Teal showcase panel ───────── */}
        <aside className="hidden p-3 lg:block">
          <div
            data-panel
            className="relative flex h-full min-h-[calc(100vh-1.5rem)] flex-col justify-between overflow-hidden rounded-[32px] bg-[#17645F] text-[#FAF7F2]"
          >
            {/* grain, glow, spotlight */}
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.14] mix-blend-overlay"
              style={{ backgroundImage: GRAIN }}
            />
            <div
              data-glow
              className="pointer-events-none absolute -right-24 top-1/4 h-[420px] w-[420px] rounded-full bg-[#FF6845] opacity-25 blur-[120px]"
            />
            <div
              data-spot
              className="pointer-events-none absolute left-0 top-0 h-[400px] w-[400px] rounded-full opacity-70"
              style={{
                background:
                  "radial-gradient(circle, rgba(250,247,242,0.16) 0%, rgba(250,247,242,0) 65%)",
              }}
            />

            {/* top row */}
            <div className="relative flex items-center justify-between p-8 xl:p-10">
              <span
                data-top
                className="inline-flex items-center gap-2 rounded-full border border-[#FAF7F2]/25 bg-[#FAF7F2]/10 px-3.5 py-1.5 text-xs font-medium backdrop-blur"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[#FF6845] animate-pulse-dot" />
                Developer intelligence platform
              </span>
              <span data-top className="flex items-center gap-1.5 text-xs text-[#FAF7F2]/70">
                <Shield className="h-3.5 w-3.5" />
                Zero code retention · SOC2
              </span>
            </div>

            {/* kinetic headline */}
            <div className="relative flex flex-1 flex-col justify-center px-8 xl:px-10" role="img" aria-label="Map it. Ask it. Ship it.">
              {WORDS.map((w) => (
                <div
                  key={w}
                  data-line
                  aria-hidden="true"
                  className="whitespace-nowrap py-1 font-extrabold leading-[0.95] tracking-tight text-[clamp(3.5rem,8vw,8rem)]"
                  style={{ perspective: 600 }}
                >
                  {w.split("").map((c, i) => (
                    <span key={i} data-char className="inline-block will-change-transform" style={{ fontWeight: 500 }}>
                      {c === " " ? "\u00A0" : c}
                    </span>
                  ))}
                </div>
              ))}
            </div>

            {/* decoding line + marquee */}
            <div className="relative space-y-7 pb-8 xl:pb-10">
              <p className="mx-8 flex h-8 items-center font-mono text-lg text-[#FAF7F2]/85 xl:mx-10" aria-label={TAGLINES.join(" ")}>
                <span data-scramble aria-hidden="true">{TAGLINES[0]}</span>
                <span className="ml-1.5 inline-block h-5 w-2 bg-[#FF6845] animate-pulse-dot" aria-hidden="true" />
              </p>

              <div
                className="overflow-hidden border-y border-[#FAF7F2]/15 py-3.5"
                style={{
                  maskImage: "linear-gradient(90deg, transparent, #000 10%, #000 90%, transparent)",
                  WebkitMaskImage: "linear-gradient(90deg, transparent, #000 10%, #000 90%, transparent)",
                }}
              >
                <div data-marquee className="flex w-max gap-10 whitespace-nowrap">
                  {[...CAPABILITIES, ...CAPABILITIES].map(({ icon: Icon, label }, i) => (
                    <span key={i} className="flex items-center gap-2.5 text-sm text-[#FAF7F2]/85">
                      <Icon className="h-4 w-4 text-[#FF6845]" />
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
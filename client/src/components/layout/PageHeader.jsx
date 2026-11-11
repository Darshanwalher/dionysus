import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { cn } from "@/lib/utils";

const prefersReduced = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Same props as before: icon, title, description, actions, className.
 * Motion: icon tile pops, the title rises out of a mask, the description and
 * actions fade in, and a coral tick draws along the bottom rule.
 * When `title` changes later (e.g. a project is renamed) only the title re-enters.
 */
export default function PageHeader({ icon: Icon, title, description, actions, className }) {
  const root = useRef(null);
  const titleRef = useRef(null);
  const firstTitle = useRef(true);

  useLayoutEffect(() => {
    const el = root.current;
    if (!el || prefersReduced()) return;
    // gsap.context + revert keeps this safe under React Strict Mode (effects run twice in dev)
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from("[data-icon]", { scale: 0.6, rotate: -12, opacity: 0, duration: 0.6, ease: "back.out(2.4)" }, 0)
        .from("[data-title]", { yPercent: 110, duration: 0.7 }, 0.05)
        .from("[data-desc]", { opacity: 0, y: 6, duration: 0.5 }, 0.25)
        .from("[data-actions] > *", { opacity: 0, x: 12, duration: 0.5, stagger: 0.06 }, 0.2)
        .fromTo("[data-rule]", { scaleX: 0 }, { scaleX: 1, duration: 0.8, ease: "power3.inOut" }, 0.1)
        .fromTo("[data-tick]", { scaleX: 0 }, { scaleX: 1, duration: 0.6 }, 0.35);
    }, el);
    return () => ctx.revert();
  }, []);

  useLayoutEffect(() => {
    if (firstTitle.current) {
      firstTitle.current = false;
      return;
    }
    if (!titleRef.current || prefersReduced()) return;
    gsap.fromTo(titleRef.current, { yPercent: 110 }, { yPercent: 0, duration: 0.5, ease: "power3.out" });
  }, [title]);

  return (
    <div
      ref={root}
      className={cn(
        "relative flex flex-col gap-3 pb-5 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        {Icon ? (
          <div
            data-icon
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-primary shadow-[0_1px_2px_rgba(16,33,31,0.06)]"
          >
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
        <div className="min-w-0">
          <div className="-mb-0.5 overflow-hidden pb-0.5">
            <h1
              ref={titleRef}
              data-title
              className="truncate text-xl font-extrabold tracking-tight text-foreground sm:text-2xl"
            >
              {title}
            </h1>
          </div>
          {description ? (
            <p data-desc className="mt-0.5 max-w-2xl truncate text-[13px] leading-relaxed text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
      </div>

      {actions ? (
        <div data-actions className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      ) : null}

      {/* Bottom rule with a coral tick */}
      <span data-rule className="absolute bottom-0 left-0 h-px w-full origin-left bg-border" />
      <span data-tick className="absolute bottom-0 left-0 h-[2px] w-14 origin-left rounded-full bg-highlight" />
    </div>
  );
}
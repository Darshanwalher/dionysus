/**
 * Chapter navigation grouped by category, with one highlight that glides to the active chapter.
 * Place at: src/components/wiki/WikiChapterTree.jsx
 * Props are unchanged (chapters, activeSlug, onSelectChapter). Optional: allChapters keeps the
 * chapter numbers stable while you search.
 */
import { memo, useLayoutEffect, useMemo, useRef } from "react";
import gsap from "gsap";
import { BookOpen, Layers, Network, Database, Settings, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { prefersReduced } from "@/components/motion";

const CATEGORY_ICON = {
  Architecture: Layers,
  "API & Interfaces": Network,
  Persistence: Database,
  Operations: Settings,
  Security: Shield,
};

function WikiChapterTree({ chapters = [], activeSlug, onSelectChapter, allChapters }) {
  const wrap = useRef(null);
  const ind = useRef(null);
  const placed = useRef(false);

  // Group by category, in order of first appearance
  const groups = useMemo(() => {
    const map = new Map();
    chapters.forEach((c) => {
      const key = c.category || "Chapters";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(c);
    });
    return [...map.entries()];
  }, [chapters]);

  const numberOf = (slug) => ((allChapters || chapters).findIndex((c) => c.slug === slug) + 1) || 0;

  // Highlight glides to the active chapter; the list scrolls to keep it visible
  useLayoutEffect(() => {
    const w = wrap.current;
    const i = ind.current;
    if (!w || !i) return;
    const el = w.querySelector('[data-chap-active="true"]');
    if (!el) {
      gsap.set(i, { opacity: 0 });
      placed.current = false;
      return;
    }
    const vars = { y: el.offsetTop, height: el.offsetHeight, opacity: 1 };
    gsap.killTweensOf(i);
    if (!placed.current || prefersReduced()) gsap.set(i, vars);
    else gsap.to(i, { ...vars, duration: 0.35, ease: "power3.out" });
    placed.current = true;

    const box = w.closest("[data-chapter-scroll]");
    if (box) {
      if (el.offsetTop < box.scrollTop + 8) box.scrollTop = Math.max(0, el.offsetTop - 40);
      else if (el.offsetTop + el.offsetHeight > box.scrollTop + box.clientHeight - 8)
        box.scrollTop = el.offsetTop + el.offsetHeight - box.clientHeight + 16;
    }
  }, [activeSlug, chapters]);

  return (
    <div ref={wrap} className="relative">
      <span
        ref={ind}
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 rounded-lg bg-secondary"
        style={{ opacity: 0 }}
      >
        <span className="absolute bottom-2 left-0 top-2 w-[3px] rounded-r-full bg-highlight" />
      </span>

      {groups.map(([category, items]) => {
        const Icon = CATEGORY_ICON[category] || BookOpen;
        return (
          <div key={category} className="mb-3 last:mb-0">
            <div className="flex items-center gap-2 px-3 pb-1.5 pt-2 text-[11px] font-semibold text-text-muted">
              <Icon className="h-3.5 w-3.5" />
              {category}
              <span className="ml-auto font-normal">{items.length}</span>
            </div>

            {items.map((chap) => {
              const active = chap.slug === activeSlug;
              return (
                <button
                  key={chap.slug}
                  type="button"
                  data-chap-active={active}
                  aria-current={active ? "page" : undefined}
                  onClick={() => onSelectChapter(chap)}
                  className={cn(
                    "relative z-10 flex w-full cursor-pointer items-start gap-3 rounded-lg px-3 py-2 text-left transition-colors",
                    active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span className={cn("mt-0.5 w-5 shrink-0 text-[11px] tabular-nums", active ? "font-bold text-primary" : "text-text-muted")}>
                    {String(numberOf(chap.slug)).padStart(2, "0")}
                  </span>
                  <span className={cn("text-[13px] leading-snug", active && "font-semibold")}>{chap.title}</span>
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

export default memo(WikiChapterTree);
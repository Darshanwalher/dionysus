import { useState, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import gsap from "gsap";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme/ThemeProvider";
import {
  Search,
  Home,
  FolderTree,
  Presentation,
  BookText,
  FileQuestion,
  Settings,
  Sun,
  Moon,
  FolderGit2,
  Plus,
  CornerDownLeft,
} from "lucide-react";

/* ────────────────────────────────────────────────────────────
   Motion:
   - panel drops in (and out) over a fading backdrop
   - a coral scan line draws across the search bar on open
   - results stagger in, and re-stagger softly as you type
   - one highlight glides between results as you move the selection
   Skipped when the user prefers reduced motion.
   ──────────────────────────────────────────────────────────── */
const prefersReduced = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function CommandPalette({ isOpen, onClose, onOpenCreateProject, onOpenSettings }) {
  const navigate = useNavigate();
  const { toggleTheme, resolvedTheme } = useTheme();
  const { projects, currentProject } = useSelector((state) => state.project);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  const inputRef = useRef(null);
  const overlayRef = useRef(null);
  const panelRef = useRef(null);
  const lineRef = useRef(null);
  const listRef = useRef(null);
  const indRef = useRef(null);
  const placed = useRef(false);
  const prevQuery = useRef("");
  const keyboardNav = useRef(false);
  const lastAnimatedQuery = useRef("");

  // Reset + focus when opened
  useLayoutEffect(() => {
    if (isOpen) {
      setMounted(true);
      setQuery("");
      setSelectedIndex(0);
      placed.current = false;
      prevQuery.current = "";
      lastAnimatedQuery.current = "";
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [isOpen]);

  // Entrance
  useLayoutEffect(() => {
    if (!isOpen || !panelRef.current || prefersReduced()) return;
    const ctx = gsap.context(() => {
    const tl = gsap.timeline();
    tl.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.2 }, 0)
      .fromTo(
        panelRef.current,
        { opacity: 0, y: -16, scale: 0.97 },
        { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: "power3.out", clearProps: "transform" },
        0
      )
      .fromTo(
        lineRef.current,
        { scaleX: 0 },
        { scaleX: 1, duration: 0.6, ease: "power3.out" },
        0.1
      )
      .from(
        listRef.current.querySelectorAll("[data-idx]"),
        { opacity: 0, y: 6, duration: 0.3, stagger: 0.025, ease: "power2.out", clearProps: "opacity,transform" },
        0.12
      );
    });
    return () => ctx.revert();
  }, [isOpen]);

  // Exit (keeps the panel mounted until the animation ends)
  useEffect(() => {
    if (isOpen || !mounted) return;
    if (prefersReduced() || !panelRef.current) {
      setMounted(false);
      return;
    }
    const tl = gsap.timeline({ onComplete: () => setMounted(false) });
    tl.to(panelRef.current, { opacity: 0, y: -8, scale: 0.98, duration: 0.18, ease: "power2.in" }, 0).to(
      overlayRef.current,
      { opacity: 0, duration: 0.15 },
      0
    );
    return () => tl.kill();
  }, [isOpen, mounted]);

  // Escape closes
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const projectId = currentProject?._id;

  const items = useMemo(() => {
    const list = [];
    const go = (path) => () => {
      navigate(path);
      onClose();
    };

    if (projectId) {
      list.push(
        { id: "nav-overview", group: "Navigation", title: "Overview", icon: Home, action: go(`/projects/${projectId}`) },
        { id: "nav-arch", group: "Navigation", title: "Architecture & Dependencies", icon: FolderTree, action: go(`/projects/${projectId}/visualise`) },
        { id: "nav-meetings", group: "Navigation", title: "Meetings & Audio", icon: Presentation, action: go(`/projects/${projectId}/meetings`) },
        { id: "nav-docs", group: "Navigation", title: "Documentation", icon: BookText, action: go(`/projects/${projectId}/documentation`) },
        { id: "nav-qna", group: "Navigation", title: "Codebase Q & A", icon: FileQuestion, action: go(`/projects/${projectId}/qna`) }
      );
    }

    if (projects && projects.length > 0) {
      projects.forEach((p) => {
        list.push({
          id: `project-${p._id}`,
          group: "Switch project",
          title: p.name,
          icon: FolderGit2,
          mono: true,
          current: p._id === projectId,
          action: go(`/projects/${p._id}`),
        });
      });
    }

    list.push(
      {
        id: "action-theme",
        group: "Preferences",
        title: `Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`,
        icon: resolvedTheme === "dark" ? Sun : Moon,
        action: () => {
          toggleTheme();
          onClose();
        },
      },
      {
        id: "action-create",
        group: "Actions",
        title: "Create new project",
        icon: Plus,
        action: () => {
          onClose();
          onOpenCreateProject?.();
        },
      }
    );

    if (currentProject) {
      list.push({
        id: "action-settings",
        group: "Actions",
        title: "Project settings",
        icon: Settings,
        action: () => {
          onClose();
          onOpenSettings?.();
        },
      });
    }

    if (!query.trim()) return list;
    const q = query.toLowerCase();
    return list.filter(
      (item) => item.title.toLowerCase().includes(q) || item.group.toLowerCase().includes(q)
    );
  }, [projectId, currentProject, projects, query, resolvedTheme, navigate, onClose, toggleTheme, onOpenCreateProject, onOpenSettings]);

  // Highlight glides to the selected row
  useLayoutEffect(() => {
    if (!isOpen) return;
    const list = listRef.current;
    const ind = indRef.current;
    if (!list || !ind) return;
    const el = list.querySelector(`[data-idx="${selectedIndex}"]`);
    if (!el) {
      gsap.set(ind, { opacity: 0 });
      placed.current = false;
      return;
    }
    const vars = { y: el.offsetTop, height: el.offsetHeight, opacity: 1 };
    const instant = !placed.current || prevQuery.current !== query || prefersReduced();
    gsap.killTweensOf(ind);
    if (instant) gsap.set(ind, vars);
    else gsap.to(ind, { ...vars, duration: 0.22, ease: "power3.out" });
    placed.current = true;
    prevQuery.current = query;
    if (keyboardNav.current) {
      el.scrollIntoView({ block: "nearest" });
      keyboardNav.current = false;
    }
  }, [selectedIndex, items, isOpen, query]);

  // Results re-stagger softly when the query changes
  useLayoutEffect(() => {
    if (!isOpen || !listRef.current) return;
    if (lastAnimatedQuery.current === query) return;
    lastAnimatedQuery.current = query;
    if (prefersReduced()) return;
    gsap.fromTo(
      listRef.current.querySelectorAll("[data-idx]"),
      { opacity: 0, y: 4 },
      { opacity: 1, y: 0, duration: 0.2, stagger: 0.015, ease: "power2.out", clearProps: "opacity,transform" }
    );
  }, [query, isOpen]);

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      keyboardNav.current = true;
      setSelectedIndex((prev) => (prev + 1) % (items.length || 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      keyboardNav.current = true;
      setSelectedIndex((prev) => (prev - 1 + items.length) % (items.length || 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (items[selectedIndex]) items[selectedIndex].action();
    }
  };

  if (!isOpen && !mounted) return null;

  let lastGroup = null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-16 sm:pt-24">
      <div
        ref={overlayRef}
        className="fixed inset-0 bg-background/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-label="Command menu"
        className="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-card shadow-[0_24px_60px_-20px_rgba(16,33,31,0.45)]"
      >
        {/* Search */}
        <div className="relative flex items-center gap-3 border-b border-border px-4 py-3.5">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search pages, projects and actions"
            aria-label="Search commands"
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <kbd className="hidden sm:inline-flex">Esc</kbd>
          <span
            ref={lineRef}
            className="absolute -bottom-px left-0 h-[2px] w-full origin-left bg-highlight"
          />
        </div>

        {/* Results */}
        <div ref={listRef} data-lenis-prevent className="relative max-h-80 overflow-y-auto p-2">
          <span
            ref={indRef}
            aria-hidden="true"
            className="pointer-events-none absolute left-2 right-2 top-0 rounded-lg bg-secondary"
            style={{ opacity: 0 }}
          >
            <span className="absolute bottom-2 left-0 top-2 w-[3px] rounded-r-full bg-highlight" />
          </span>

          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <Search className="h-5 w-5 text-muted-foreground/60" />
              <p className="text-sm text-foreground">No results for “{query}”</p>
              <p className="text-xs text-muted-foreground">Try a page name, a project or an action.</p>
            </div>
          ) : (
            items.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              const showHead = item.group !== lastGroup;
              lastGroup = item.group;
              return (
                <div key={item.id}>
                  {showHead && (
                    <p className="px-3 pb-1 pt-2.5 text-[11px] font-medium text-text-muted">{item.group}</p>
                  )}
                  <button
                    type="button"
                    data-idx={idx}
                    onClick={item.action}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className="relative z-10 flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-left"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span
                        className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors duration-200",
                          isSelected ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <span
                        className={cn(
                          "truncate text-[13px] transition-colors duration-150",
                          item.mono && "font-mono text-xs",
                          isSelected ? "font-semibold text-foreground" : "text-foreground/90"
                        )}
                      >
                        {item.title}
                      </span>
                      {item.current && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                          Current
                        </span>
                      )}
                    </span>
                    {isSelected && <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border bg-secondary/40 px-4 py-2 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              <kbd>↑</kbd>
              <kbd>↓</kbd>
              move
            </span>
            <span className="inline-flex items-center gap-1.5">
              <kbd>↵</kbd>
              open
            </span>
          </div>
          <span>Dionysus</span>
        </div>
      </div>
    </div>
  );
}
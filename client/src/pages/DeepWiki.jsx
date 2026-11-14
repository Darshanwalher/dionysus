import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import gsap from "gsap";
import {
  fetchProject,
  fetchWikiPages,
  refreshDeepWiki,
  refreshWikiChapter,
  setCurrentWikiPage,
} from "@/store/slices/projectSlice";
import WikiChapterTree from "@/components/wiki/WikiChapterTree";
import WikiMarkdownViewer, { extractHeadings } from "@/components/wiki/WikiMarkdownViewer";
import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FadeIn, Pop, SweepBar, prefersReduced } from "@/components/motion";
import { scrollToTarget } from "@/components/motion/SmoothScroll";
import { cn } from "@/lib/utils";
import {
  RefreshCw,
  Download,
  Sparkles,
  Search,
  BookOpen,
  Copy,
  Check,
  FileText,
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
  FileCode,
} from "lucide-react";
import { toast } from "sonner";

export default function DeepWiki() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { currentProject, wikiPages, currentWikiPage, isWikiLoading } = useSelector((state) => state.project);

  const [searchTerm, setSearchTerm] = useState("");
  const [copied, setCopied] = useState(false);
  const [activeHeading, setActiveHeading] = useState(0);

  const searchRef = useRef(null);
  const articleRef = useRef(null);
  const progRef = useRef(null);
  const pctRef = useRef(null);
  const outlineRef = useRef(null);
  const indRef = useRef(null);
  const placed = useRef(false);
  const firstSlug = useRef(true);

  useEffect(() => {
    if (!currentProject || (currentProject._id !== id && currentProject.id !== id)) {
      dispatch(fetchProject(id));
    }
  }, [dispatch, id, currentProject]);

  useEffect(() => {
    if (id && (!wikiPages || wikiPages.length === 0) && !isWikiLoading) {
      dispatch(fetchWikiPages(id));
    }
  }, [dispatch, id, wikiPages, isWikiLoading]);

  // Open the first chapter automatically so the reader is never empty when chapters exist
  useEffect(() => {
    if (wikiPages?.length && !currentWikiPage) dispatch(setCurrentWikiPage(wikiPages[0]));
  }, [wikiPages, currentWikiPage, dispatch]);

  const handleSelectChapter = useCallback((chapter) => dispatch(setCurrentWikiPage(chapter)), [dispatch]);

  const handleRefreshAll = () => {
    dispatch(refreshDeepWiki(id));
    toast.info("Regenerating all DeepWiki chapters… this may take a minute.");
  };

  const handleRefreshChapter = () => {
    if (currentWikiPage?.slug) {
      dispatch(refreshWikiChapter({ projectId: id, slug: currentWikiPage.slug }));
      toast.success(`Re-synthesizing "${currentWikiPage.title}"…`);
    }
  };

  const handleExportMarkdown = () => {
    if (!currentWikiPage) return;
    const blob = new Blob([currentWikiPage.markdownContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${currentWikiPage.slug || "deepwiki-chapter"}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Chapter exported as Markdown!");
  };

  const handleCopy = () => {
    if (!currentWikiPage) return;
    navigator.clipboard.writeText(currentWikiPage.markdownContent);
    setCopied(true);
    toast.success("Markdown copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredChapters = useMemo(() => {
    if (!wikiPages) return [];
    if (!searchTerm.trim()) return wikiPages;
    const term = searchTerm.toLowerCase();
    return wikiPages.filter(
      (p) =>
        p.title.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term) ||
        (p.markdownContent || "").toLowerCase().includes(term)
    );
  }, [wikiPages, searchTerm]);

  const wordCount = useMemo(() => {
    if (!currentWikiPage?.markdownContent) return 0;
    return currentWikiPage.markdownContent.replace(/```[\s\S]*?```/g, "").split(/\s+/).filter(Boolean).length;
  }, [currentWikiPage]);
  const readTime = Math.max(1, Math.round(wordCount / 200));

  // Outline (H2 and H3) built from the chapter's own markdown
  const outline = useMemo(
    () => extractHeadings(currentWikiPage?.markdownContent).filter((h) => h.level === 2 || h.level === 3),
    [currentWikiPage?.markdownContent]
  );

  // Previous / next chapter
  const { prev, next } = useMemo(() => {
    if (!wikiPages?.length || !currentWikiPage) return {};
    const i = wikiPages.findIndex((p) => p.slug === currentWikiPage.slug);
    return { prev: wikiPages[i - 1], next: wikiPages[i + 1] };
  }, [wikiPages, currentWikiPage]);

  const files = currentWikiPage?.referencedFiles || [];

  // "/" focuses the chapter search
  useEffect(() => {
    const onKey = (e) => {
      const t = e.target;
      const typing = t instanceof HTMLElement && (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName));
      if (e.key === "/" && !typing && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // New chapter: back to the top and reset the outline
  useEffect(() => {
    if (firstSlug.current) {
      firstSlug.current = false;
      return;
    }
    setActiveHeading(0);
    scrollToTarget(0, 0);
  }, [currentWikiPage?.slug]);

  // Scroll-spy + reading progress.
  // Positions are measured once (and again when the article resizes), so the scroll handler
  // only compares numbers. It never reads layout while you scroll.
  const pos = useRef({ heads: [], top: 0, height: 0 });
  useEffect(() => {
    const card = articleRef.current;
    if (!card) return;
    const setProgress = progRef.current ? gsap.quickSetter(progRef.current, "scaleX") : null;
    let raf;

    const measure = () => {
      const sy = window.scrollY;
      pos.current.heads = outline.map((h) => {
        const el = document.getElementById(h.id);
        return el ? el.getBoundingClientRect().top + sy : Infinity;
      });
      const r = card.getBoundingClientRect();
      pos.current.top = r.top + sy;
      pos.current.height = r.height;
    };

    const update = () => {
      const sy = window.scrollY;
      const { heads, top, height } = pos.current;
      let cur = 0;
      for (let i = 0; i < heads.length; i++) if (heads[i] - sy <= 140) cur = i;
      setActiveHeading(cur); // same value: React skips the render
      const total = height - window.innerHeight + 160;
      const p = total > 0 ? Math.min(1, Math.max(0, (160 - (top - sy)) / total)) : 0;
      if (setProgress) setProgress(p);
      if (pctRef.current) pctRef.current.textContent = `${Math.round(p * 100)}% read`;
    };

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    const remeasure = () => {
      measure();
      update();
    };

    const t = setTimeout(remeasure, 60); // after the article has laid out
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(remeasure) : null;
    ro?.observe(card);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", remeasure);
    return () => {
      clearTimeout(t);
      cancelAnimationFrame(raf);
      ro?.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", remeasure);
    };
  }, [outline, currentWikiPage?.slug]);

  // Outline highlight glides to the active heading
  useLayoutEffect(() => {
    const w = outlineRef.current;
    const i = indRef.current;
    if (!w || !i) return;
    const el = w.querySelector('[data-out-active="true"]');
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
  }, [activeHeading, outline]);

  const jumpTo = (hid, i) => {
    const el = document.getElementById(hid);
    if (!el) return;
    setActiveHeading(i);
    scrollToTarget(el);
  };

  const noChapters = !isWikiLoading && (!wikiPages || wikiPages.length === 0);
  const initialLoading = isWikiLoading && (!wikiPages || wikiPages.length === 0);

  return (
    <div className="w-full space-y-6">
      <PageHeader
        icon={BookOpen}
        title="Repo DeepWiki"
        description={`AI-synthesized technical documentation for ${currentProject?.name || "this repository"}.`}
        actions={
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefreshAll}
            disabled={isWikiLoading}
            className="h-8 gap-1.5 text-xs font-semibold"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isWikiLoading && "animate-spin text-primary")} />
            {isWikiLoading ? "Generating…" : "Regenerate all"}
          </Button>
        }
      />

      <div className="grid items-start gap-6 lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[250px_minmax(0,1fr)_210px]">
        {/* ─── Left: chapters ─────────────────────────────────── */}
        <aside className="lg:sticky lg:top-16 lg:self-start">
          <FadeIn delay={0.05} className="space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                ref={searchRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search chapters"
                aria-label="Search chapters"
                className="h-9 w-full rounded-lg border border-border bg-card pl-9 pr-9 text-xs text-foreground placeholder:text-muted-foreground transition-colors focus:border-primary/50 focus:outline-none"
              />
              {searchTerm ? (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : (
                <kbd className="absolute right-2 top-1/2 hidden -translate-y-1/2 sm:inline-flex">/</kbd>
              )}
            </div>

            <section className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <h2 className="text-[13px] font-bold text-foreground">Chapters</h2>
                <span className="text-[11px] text-muted-foreground">
                  {wikiPages?.length || 0} · AI-synthesized
                </span>
              </div>

              <div data-chapter-scroll data-lenis-prevent className="max-h-72 overflow-y-auto p-2 lg:max-h-[calc(100vh-15rem)]">
                {initialLoading ? (
                  <div className="space-y-1.5 p-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-9 w-full rounded-lg" />
                    ))}
                  </div>
                ) : filteredChapters.length === 0 ? (
                  <div className="p-6 text-center text-xs text-muted-foreground">
                    <BookOpen className="mx-auto mb-2 h-6 w-6 opacity-30" />
                    {noChapters ? "No chapters yet. Use Regenerate all." : `No chapters match “${searchTerm}”.`}
                  </div>
                ) : (
                  <WikiChapterTree
                    chapters={filteredChapters}
                    allChapters={wikiPages}
                    activeSlug={currentWikiPage?.slug}
                    onSelectChapter={handleSelectChapter}
                  />
                )}
              </div>
            </section>
          </FadeIn>
        </aside>

        {/* ─── Center: reader ─────────────────────────────────── */}
        <main className="min-w-0">
          {initialLoading || (isWikiLoading && !currentWikiPage) ? (
            <section className="relative overflow-hidden rounded-2xl border border-border bg-card p-8">
              <SweepBar active />
              <div className="space-y-4">
                <Skeleton className="h-8 w-64 rounded-lg" />
                <Skeleton className="h-3 w-full rounded" />
                <Skeleton className="h-3 w-4/5 rounded" />
                <Skeleton className="h-3 w-3/5 rounded" />
                <Skeleton className="mt-4 h-40 w-full rounded-xl" />
                <Skeleton className="h-3 w-full rounded" />
                <Skeleton className="h-3 w-5/6 rounded" />
              </div>
            </section>
          ) : !currentWikiPage ? (
            <FadeIn>
              <section className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/60 px-6 py-20 text-center">
                <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <BookOpen className="h-6 w-6" />
                </span>
                <h3 className="text-base font-bold text-foreground">Generate your DeepWiki</h3>
                <p className="mx-auto mt-1.5 max-w-sm text-xs leading-relaxed text-muted-foreground">
                  Dionysus indexes your codebase and writes technical documentation for you: architecture diagrams, API
                  references, entity dictionaries and more.
                </p>
                <Button size="sm" onClick={handleRefreshAll} disabled={isWikiLoading} className="mt-5 gap-1.5 text-xs font-semibold">
                  <Sparkles className="h-3.5 w-3.5" />
                  Synthesize DeepWiki
                </Button>
              </section>
            </FadeIn>
          ) : (
            <FadeIn key={currentWikiPage.slug}>
              <article ref={articleRef} className="relative rounded-2xl border border-border bg-card">
                {/* reading progress + generating sweep */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] overflow-hidden rounded-t-2xl">
                  <div ref={progRef} className="h-full origin-left bg-highlight" style={{ transform: "scaleX(0)" }} />
                </div>
                <SweepBar active={isWikiLoading} />

                {/* Chapter header */}
                <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3.5 sm:px-8">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                      {currentWikiPage.category}
                    </span>
                    {currentWikiPage.lastGeneratedAt && (
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(currentWikiPage.lastGeneratedAt).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5" />
                      {readTime} min read
                    </span>
                    {isWikiLoading && (
                      <span className="flex items-center gap-1.5 text-primary">
                        <span className="h-1.5 w-1.5 rounded-full bg-highlight animate-pulse-dot" />
                        Updating…
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button variant="outline" size="sm" onClick={handleCopy} className="h-8 gap-1.5 text-xs">
                      {copied ? <Pop><Check className="h-3.5 w-3.5 text-accent-emerald" /></Pop> : <Copy className="h-3.5 w-3.5" />}
                      <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExportMarkdown} className="h-8 gap-1.5 text-xs">
                      <Download className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Export</span>
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleRefreshChapter} disabled={isWikiLoading} className="h-8 gap-1.5 text-xs">
                      <RefreshCw className={cn("h-3.5 w-3.5", isWikiLoading && "animate-spin")} />
                      <span className="hidden sm:inline">Re-synthesize</span>
                    </Button>
                  </div>
                </header>

                {/* Analyzed files (small screens; the right column shows them on wide screens) */}
                {files.length > 0 && (
                  <div data-lenis-prevent className="flex items-center gap-2 overflow-x-auto border-b border-border px-5 py-2.5 scrollbar-none sm:px-8 xl:hidden">
                    <span className="shrink-0 text-[11px] font-medium text-muted-foreground">Analyzed</span>
                    {files.map((f, i) => (
                      <span key={i} title={f} className="shrink-0 rounded-md border border-border bg-secondary px-2 py-0.5 font-mono text-[11px] text-foreground/70">
                        {f.split("/").pop()}
                      </span>
                    ))}
                  </div>
                )}

                {/* Content. The markdown already starts with its own # title. */}
                <div className="px-5 py-8 sm:px-8 lg:px-12 2xl:px-16">
                  <WikiMarkdownViewer content={currentWikiPage.markdownContent} />
                </div>

                {/* Previous / next */}
                {(prev || next) && (
                  <nav aria-label="Chapter navigation" className="grid gap-3 border-t border-border p-5 sm:grid-cols-2 sm:px-8">
                    {prev ? (
                      <button
                        type="button"
                        onClick={() => handleSelectChapter(prev)}
                        className="group flex cursor-pointer items-center gap-3 rounded-xl border border-border p-3.5 text-left transition-colors hover:border-primary/40 hover:bg-secondary/50"
                      >
                        <ChevronLeft className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-x-0.5" />
                        <span className="min-w-0">
                          <span className="block text-[11px] text-muted-foreground">Previous</span>
                          <span className="block truncate text-[13px] font-semibold text-foreground">{prev.title}</span>
                        </span>
                      </button>
                    ) : (
                      <span />
                    )}
                    {next && (
                      <button
                        type="button"
                        onClick={() => handleSelectChapter(next)}
                        className="group flex cursor-pointer items-center justify-end gap-3 rounded-xl border border-border p-3.5 text-right transition-colors hover:border-primary/40 hover:bg-secondary/50"
                      >
                        <span className="min-w-0">
                          <span className="block text-[11px] text-muted-foreground">Next</span>
                          <span className="block truncate text-[13px] font-semibold text-foreground">{next.title}</span>
                        </span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                      </button>
                    )}
                  </nav>
                )}
              </article>
            </FadeIn>
          )}
        </main>

        {/* ─── Right: outline + sources (wide screens) ───────── */}
        <aside className="hidden xl:sticky xl:top-16 xl:block xl:self-start">
          {currentWikiPage && (
            <FadeIn delay={0.1} className="space-y-3">
              <section className="overflow-hidden rounded-2xl border border-border bg-card">
                <div className="border-b border-border px-4 py-3">
                  <h2 className="text-[13px] font-bold text-foreground">On this page</h2>
                  <p ref={pctRef} className="mt-0.5 text-[11px] tabular-nums text-muted-foreground">0% read</p>
                </div>
                <div data-lenis-prevent className="max-h-[calc(100vh-19rem)] overflow-y-auto p-2">
                  {outline.length === 0 ? (
                    <p className="px-2 py-3 text-xs text-muted-foreground">No sections in this chapter.</p>
                  ) : (
                    <div ref={outlineRef} className="relative">
                      <span
                        ref={indRef}
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-x-0 top-0 rounded-lg bg-secondary"
                        style={{ opacity: 0 }}
                      >
                        <span className="absolute bottom-2 left-0 top-2 w-[3px] rounded-r-full bg-highlight" />
                      </span>
                      {outline.map((h, i) => (
                        <button
                          key={h.id}
                          type="button"
                          data-out-active={i === activeHeading}
                          onClick={() => jumpTo(h.id, i)}
                          className={cn(
                            "relative z-10 block w-full cursor-pointer rounded-lg py-1.5 pr-2 text-left text-xs leading-snug transition-colors",
                            h.level === 3 ? "pl-6" : "pl-3 font-medium",
                            i === activeHeading ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {h.text}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              {files.length > 0 && (
                <section className="rounded-2xl border border-border bg-card">
                  <div className="flex items-center justify-between border-b border-border px-4 py-3">
                    <h2 className="text-[13px] font-bold text-foreground">Analyzed files</h2>
                    <span className="text-[11px] text-muted-foreground">{files.length}</span>
                  </div>
                  <ul data-lenis-prevent className="max-h-56 space-y-0.5 overflow-y-auto p-2">
                    {files.map((f, i) => (
                      <li key={i} title={f} className="flex items-center gap-2 rounded-md px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                        <FileCode className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate font-mono">{f.split("/").pop()}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </FadeIn>
          )}
        </aside>
      </div>
    </div>
  );
}
import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchProject,
  fetchWikiPages,
  refreshDeepWiki,
  refreshWikiChapter,
  setCurrentWikiPage,
} from "@/store/slices/projectSlice";
import WikiChapterTree from "@/components/wiki/WikiChapterTree";
import WikiMarkdownViewer from "@/components/wiki/WikiMarkdownViewer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  Zap,
} from "lucide-react";
import { toast } from "sonner";

export default function DeepWiki() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { currentProject, wikiPages, currentWikiPage, isWikiLoading } =
    useSelector((state) => state.project);

  const [searchTerm, setSearchTerm] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (
      !currentProject ||
      (currentProject._id !== id && currentProject.id !== id)
    ) {
      dispatch(fetchProject(id));
    }
  }, [dispatch, id, currentProject]);

  useEffect(() => {
    if (id && (!wikiPages || wikiPages.length === 0) && !isWikiLoading) {
      dispatch(fetchWikiPages(id));
    }
  }, [dispatch, id, wikiPages, isWikiLoading]);

  const handleSelectChapter = (chapter) => dispatch(setCurrentWikiPage(chapter));

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
    const blob = new Blob([currentWikiPage.markdownContent], {
      type: "text/markdown",
    });
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
    return currentWikiPage.markdownContent
      .replace(/```[\s\S]*?```/g, "")
      .split(/\s+/)
      .filter(Boolean).length;
  }, [currentWikiPage]);

  const readTime = Math.max(1, Math.round(wordCount / 200));

  return (
    <div className="flex flex-col h-full animate-fade-up">
      {/* ── Top Header Bar ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-5 gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
            <BookOpen className="h-4.5 w-4.5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-foreground leading-tight">
                Repo DeepWiki
              </h1>
              <Badge
                variant="outline"
                className="font-mono text-[9px] uppercase tracking-wider text-primary border-primary/30 bg-primary/5"
              >
                AI Engine
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              AI-synthesized technical documentation for{" "}
              <span className="font-semibold text-foreground">
                {currentProject?.name || "this repository"}
              </span>
            </p>
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={handleRefreshAll}
          disabled={isWikiLoading}
          className="gap-1.5 text-xs font-semibold cursor-pointer shrink-0"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${
              isWikiLoading ? "animate-spin text-primary" : ""
            }`}
          />
          {isWikiLoading ? "Generating…" : "Regenerate All"}
        </Button>
      </div>

      {/* ── 2-Column Layout ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-1 min-h-[700px]">
        {/* Left — Chapter Sidebar */}
        <div className="md:col-span-4 lg:col-span-3 flex flex-col gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search chapters…"
              className="w-full h-9 pl-9 pr-3 text-xs rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 shadow-sm transition"
            />
          </div>

          {/* Chapter List */}
          <div className="rounded-xl border border-border bg-card shadow-sm flex-1 p-1.5 overflow-auto">
            {isWikiLoading && (!wikiPages || wikiPages.length === 0) ? (
              <div className="space-y-1.5 p-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-lg" />
                ))}
              </div>
            ) : filteredChapters.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">
                <BookOpen className="h-6 w-6 mx-auto mb-2 opacity-30" />
                {wikiPages?.length === 0
                  ? "No chapters yet. Click Regenerate All."
                  : "No matching chapters."}
              </div>
            ) : (
              <WikiChapterTree
                chapters={filteredChapters}
                activeSlug={currentWikiPage?.slug}
                onSelectChapter={handleSelectChapter}
              />
            )}
          </div>

          {/* Chapter count badge */}
          {wikiPages?.length > 0 && (
            <p className="text-[10px] text-muted-foreground text-center font-mono">
              {wikiPages.length} chapter{wikiPages.length !== 1 ? "s" : ""} •{" "}
              AI-synthesized
            </p>
          )}
        </div>

        {/* Right — Reader Pane */}
        <div className="md:col-span-8 lg:col-span-9 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          {/* Loading skeleton */}
          {isWikiLoading && !currentWikiPage ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-6 w-56 rounded-lg" />
              <Skeleton className="h-3 w-full rounded" />
              <Skeleton className="h-3 w-4/5 rounded" />
              <Skeleton className="h-3 w-3/5 rounded" />
              <Skeleton className="h-40 w-full rounded-xl mt-4" />
              <Skeleton className="h-3 w-full rounded" />
              <Skeleton className="h-3 w-5/6 rounded" />
            </div>
          ) : !currentWikiPage ? (
            /* Empty state */
            <div className="flex-1 flex flex-col items-center justify-center p-14 text-center">
              <div className="relative mb-5">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
                  <BookOpen className="h-7 w-7 text-primary/60" />
                </div>
                <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-amber-400/80 border-2 border-card flex items-center justify-center">
                  <Zap className="h-2.5 w-2.5 text-white" />
                </div>
              </div>
              <h3 className="text-sm font-bold text-foreground mb-1.5">
                Select or Generate a Chapter
              </h3>
              <p className="text-xs text-muted-foreground max-w-xs leading-relaxed mb-5">
                DeepWiki uses Gemini AI to index your codebase and produce
                comprehensive technical documentation — architecture diagrams,
                API references, entity dictionaries, and more.
              </p>
              <Button
                size="sm"
                onClick={handleRefreshAll}
                disabled={isWikiLoading}
                className="gap-1.5 text-xs font-semibold cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Synthesize DeepWiki
              </Button>
            </div>
          ) : (
            /* Chapter reader */
            <div className="flex flex-col flex-1 min-h-0">
              {/* ── Chapter toolbar ── */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/20 select-none shrink-0 flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    variant="secondary"
                    className="font-mono text-[9px] uppercase tracking-widest"
                  >
                    {currentWikiPage.category}
                  </Badge>
                  {currentWikiPage.lastGeneratedAt && (
                    <span className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {new Date(currentWikiPage.lastGeneratedAt).toLocaleString(
                        [],
                        {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
                    <FileText className="h-3 w-3" />
                    ~{readTime} min read
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {[
                    {
                      onClick: handleCopy,
                      icon: copied ? (
                        <Check className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      ),
                      label: copied ? "Copied" : "Copy",
                      title: "Copy Markdown",
                    },
                    {
                      onClick: handleExportMarkdown,
                      icon: <Download className="h-3 w-3" />,
                      label: "Export",
                      title: "Export .md",
                    },
                    {
                      onClick: handleRefreshChapter,
                      icon: <RefreshCw className="h-3 w-3" />,
                      label: "Re-synthesize",
                      title: "Re-synthesize this chapter",
                    },
                  ].map((btn, i) => (
                    <button
                      key={i}
                      onClick={btn.onClick}
                      title={btn.title}
                      className="flex items-center gap-1 h-7 px-2.5 rounded-lg border border-border bg-card hover:bg-secondary text-[11px] text-muted-foreground hover:text-foreground font-mono transition-all cursor-pointer"
                    >
                      {btn.icon}
                      <span className="hidden sm:inline">{btn.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Analyzed files strip ── */}
              {currentWikiPage.referencedFiles?.length > 0 && (
                <div className="px-5 py-2.5 border-b border-border/60 bg-muted/10 flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0">
                  <span className="text-[10px] font-mono font-semibold text-muted-foreground shrink-0 uppercase tracking-wider">
                    Analyzed:
                  </span>
                  <div className="flex items-center gap-1.5 flex-nowrap">
                    {currentWikiPage.referencedFiles.map((f, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md bg-card border border-border/60 text-[10px] font-mono text-foreground/70 shrink-0 hover:text-primary hover:border-primary/30 transition-colors cursor-default"
                      >
                        {f.split("/").pop()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Markdown content ── */}
              {/* NOTE: No hardcoded h1 here — the AI markdown starts with # Title already */}
              <div className="flex-1 overflow-y-auto px-6 py-6">
                <WikiMarkdownViewer
                  content={currentWikiPage.markdownContent}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

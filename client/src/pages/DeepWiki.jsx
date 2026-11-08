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
import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
} from "lucide-react";
import { toast } from "sonner";

export default function DeepWiki() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const {
    currentProject,
    wikiPages,
    currentWikiPage,
    isWikiLoading,
  } = useSelector((state) => state.project);

  const [searchTerm, setSearchTerm] = useState("");
  const [copied, setCopied] = useState(false);

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

  const handleSelectChapter = (chapter) => {
    dispatch(setCurrentWikiPage(chapter));
  };

  const handleRefreshAll = () => {
    dispatch(refreshDeepWiki(id));
  };

  const handleRefreshChapter = () => {
    if (currentWikiPage?.slug) {
      dispatch(refreshWikiChapter({ projectId: id, slug: currentWikiPage.slug }));
      toast.success(`Synthesizing fresh content for ${currentWikiPage.title}...`);
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
    if (!searchTerm.trim()) return wikiPages;
    const term = searchTerm.toLowerCase();
    return wikiPages.filter(
      (p) =>
        p.title.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term) ||
        p.markdownContent.toLowerCase().includes(term)
    );
  }, [wikiPages, searchTerm]);

  return (
    <div className="space-y-4 animate-fade-up">
      {/* Top Header */}
      <PageHeader
        title="Repo DeepWiki"
        description="Multi-chapter AI-synthesized technical wiki with interactive diagrams, data dictionaries, and architectural contracts."
        badge="DeepWiki Engine"
        action={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleRefreshAll}
              disabled={isWikiLoading}
              className="gap-1.5 text-xs font-semibold cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isWikiLoading ? "animate-spin text-primary" : ""}`} />
              <span>{isWikiLoading ? "Generating Wiki..." : "Regenerate All Chapters"}</span>
            </Button>
          </div>
        }
      />

      {/* Main 2-Column Reader Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 min-h-[750px]">
        {/* Left Column: Chapters Navigation Sidebar */}
        <div className="md:col-span-4 lg:col-span-3 flex flex-col gap-3">
          {/* Search Chapters */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search wiki chapters..."
              className="w-full h-8 pl-8 pr-2 text-xs rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
            />
          </div>

          <Card className="p-2 bg-card border-border shadow-xs flex-1">
            {isWikiLoading && (!wikiPages || wikiPages.length === 0) ? (
              <div className="space-y-2 p-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-9 w-full rounded-md" />
                ))}
              </div>
            ) : filteredChapters.length === 0 ? (
              <div className="p-4 text-center text-xs text-muted-foreground">
                No matching chapters found.
              </div>
            ) : (
              <WikiChapterTree
                chapters={filteredChapters}
                activeSlug={currentWikiPage?.slug}
                onSelectChapter={handleSelectChapter}
              />
            )}
          </Card>
        </div>

        {/* Right Column: Markdown Reader & Visualizer Viewport */}
        <Card className="md:col-span-8 lg:col-span-9 p-6 bg-card border-border shadow-xs flex flex-col">
          {isWikiLoading && !currentWikiPage ? (
            <div className="space-y-4 py-8">
              <Skeleton className="h-8 w-64 rounded" />
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-4/5 rounded" />
              <Skeleton className="h-48 w-full rounded-xl" />
            </div>
          ) : !currentWikiPage ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
              <BookOpen className="h-10 w-10 text-muted-foreground mb-3 opacity-60" />
              <h3 className="text-sm font-bold text-foreground">Select or Generate a Chapter</h3>
              <p className="text-xs text-muted-foreground max-w-sm mt-1">
                DeepWiki automatically indexes codebase architectures, routes, and data models into comprehensive onboarding documentation.
              </p>
              <Button size="sm" onClick={handleRefreshAll} className="mt-4 gap-1.5 text-xs font-semibold cursor-pointer">
                <Sparkles className="h-3.5 w-3.5" /> Synthesize DeepWiki
              </Button>
            </div>
          ) : (
            <div className="flex flex-col flex-1">
              {/* Chapter Action Bar */}
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-border select-none">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-[10px] uppercase">
                    {currentWikiPage.category}
                  </Badge>
                  {currentWikiPage.lastGeneratedAt && (
                    <span className="text-[10px] font-mono text-muted-foreground">
                      Updated {new Date(currentWikiPage.lastGeneratedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 h-7 px-2 rounded-md border border-border bg-secondary hover:bg-surface-hover text-[11px] text-muted-foreground hover:text-foreground font-mono transition-colors cursor-pointer"
                    title="Copy Markdown"
                  >
                    {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                    <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
                  </button>

                  <button
                    onClick={handleExportMarkdown}
                    className="flex items-center gap-1 h-7 px-2 rounded-md border border-border bg-secondary hover:bg-surface-hover text-[11px] text-muted-foreground hover:text-foreground font-mono transition-colors cursor-pointer"
                    title="Export .md file"
                  >
                    <Download className="h-3 w-3" />
                    <span className="hidden sm:inline">Export</span>
                  </button>

                  <button
                    onClick={handleRefreshChapter}
                    className="flex items-center gap-1 h-7 px-2 rounded-md border border-border bg-card hover:bg-secondary text-[11px] text-muted-foreground hover:text-foreground font-mono transition-colors cursor-pointer"
                    title="Re-synthesize this chapter"
                  >
                    <RefreshCw className="h-3 w-3" />
                    <span className="hidden sm:inline">Re-synthesize</span>
                  </button>
                </div>
              </div>

              {/* Referenced Source Files Pill Strip */}
              {currentWikiPage.referencedFiles?.length > 0 && (
                <div className="mb-5 p-2.5 rounded-lg border border-border/80 bg-secondary/30 flex items-center gap-2 overflow-x-auto text-[11px] font-mono scrollbar-none">
                  <span className="text-muted-foreground shrink-0 font-semibold">Analyzed Files:</span>
                  {currentWikiPage.referencedFiles.map((f, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-card border border-border/60 text-foreground/80 shrink-0 hover:text-primary transition-colors cursor-default"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              )}

              {/* Markdown Content Viewer with Mermaid */}
              <div className="flex-1">
                <WikiMarkdownViewer content={currentWikiPage.markdownContent} />
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

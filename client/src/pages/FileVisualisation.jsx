import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchProject,
  generateArchitecture,
  generateDependencies,
  fetchSchema,
  refreshSchema,
} from "@/store/slices/projectSlice";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  FolderTree,
  Maximize2,
  Minimize2,
  Network,
  ListTree,
  Boxes,
  GitBranch,
  ExternalLink,
  GitFork,
  Database,
} from "lucide-react";
import { parseFileTree } from "@/lib/fileTree";
import FileTreeExplorer from "@/components/file-visualisation/FileTreeExplorer";
import ArchitectureMap from "@/components/file-visualisation/ArchitectureMap";
import ArchitectureOverview from "@/components/file-visualisation/ArchitectureOverview";
import DependencyGraph from "@/components/file-visualisation/DependencyGraph";
import DatabaseSchemaView from "@/components/file-visualisation/DatabaseSchemaView";
import { VizStyles } from "@/components/file-visualisation/VizShared";

const MODES = [
  { key: "architecture", label: "Architecture Overview", icon: Boxes, badge: "AI Synthesis", hint: "Microservices & Subsystem Boundaries" },
  { key: "dependencies", label: "Dependency DAG", icon: GitBranch, badge: "Code Imports", hint: "AST Import/Export Graph" },
  { key: "schema", label: "Schema ER", icon: Database, badge: "Data Models", hint: "Mongoose / Prisma Relational Entity Diagram" },
  { key: "tree", label: "File Tree", icon: ListTree, badge: "Directory", hint: "Directory Hierarchy" },
  { key: "diagram", label: "Interactive Flow", icon: Network, badge: "Mermaid", hint: "Directory Hierarchy" },
];

export default function FileVisualisation() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const {
    currentProject,
    isLoading,
    architectureGraph,
    dependencyGraph,
    schemaIntelligence,
    isArchitectureLoading,
    isDependencyLoading,
    isSchemaLoading,
    architectureError,
    dependencyError,
    schemaError,
  } = useSelector((state) => state.project);

  const [viewMode, setViewMode] = useState("architecture");
  const [isFullscreen, setIsFullscreen] = useState(false);

  const showSkeleton = isLoading && !currentProject;

  /* ── data loading (unchanged behaviour) ── */
  useEffect(() => {
    if (!currentProject || (currentProject._id !== id && currentProject.id !== id)) {
      dispatch(fetchProject(id));
    }
  }, [dispatch, id, currentProject]);

  useEffect(() => {
    if (
      viewMode === "architecture" &&
      currentProject?.githubUrl &&
      !currentProject?.architectureGraph &&
      !architectureGraph &&
      !isArchitectureLoading
    ) {
      dispatch(generateArchitecture({ projectId: id, force: false }));
    }
  }, [viewMode, currentProject, architectureGraph, isArchitectureLoading, dispatch, id]);

  useEffect(() => {
    if (
      viewMode === "dependencies" &&
      currentProject?.githubUrl &&
      !currentProject?.dependencyGraph &&
      !dependencyGraph &&
      !isDependencyLoading
    ) {
      dispatch(generateDependencies({ projectId: id, force: false }));
    }
  }, [viewMode, currentProject, dependencyGraph, isDependencyLoading, dispatch, id]);

  useEffect(() => {
    if (
      viewMode === "schema" &&
      currentProject?.githubUrl &&
      !currentProject?.schemaIntelligence &&
      !schemaIntelligence &&
      !isSchemaLoading
    ) {
      dispatch(fetchSchema(id));
    }
  }, [viewMode, currentProject, schemaIntelligence, isSchemaLoading, dispatch, id]);

  const handleRefreshArchitecture = useCallback(
    (force = true) => dispatch(generateArchitecture({ projectId: id, force })),
    [dispatch, id]
  );
  const handleRefreshDependencies = useCallback(
    (force = true) => dispatch(generateDependencies({ projectId: id, force })),
    [dispatch, id]
  );
  const handleRefreshSchema = useCallback(() => dispatch(refreshSchema(id)), [dispatch, id]);

  const fileTree = useMemo(
    () => parseFileTree(currentProject?.mermaidGraph, currentProject?.name || "Repository"),
    [currentProject]
  );

  const currentArchitectureData = architectureGraph || currentProject?.architectureGraph;
  const currentDependencyData = dependencyGraph || currentProject?.dependencyGraph;
  const currentSchemaData = schemaIntelligence || currentProject?.schemaIntelligence;

  const repoDisplay = useMemo(() => {
    if (!currentProject?.githubUrl) return null;
    return currentProject.githubUrl.replace(/\.git$/i, "").replace(/^https?:\/\/github\.com\//i, "");
  }, [currentProject?.githubUrl]);

  const activeMode = MODES.find((m) => m.key === viewMode) || MODES[0];
  const isViewLoading =
    (viewMode === "architecture" && isArchitectureLoading) ||
    (viewMode === "dependencies" && isDependencyLoading) ||
    (viewMode === "schema" && isSchemaLoading);

  /* ── ESC exits fullscreen ── */
  useEffect(() => {
    if (!isFullscreen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setIsFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isFullscreen]);

  /* ── sliding highlight behind the active tab ── */
  const tabsRef = useRef(null);
  const tabRefs = useRef({});
  const pillRef = useRef(null);
  const pillReady = useRef(false);

  const placePill = useCallback(() => {
    const btn = tabRefs.current[viewMode];
    const pill = pillRef.current;
    if (!btn || !pill) return;
    pill.style.width = `${btn.offsetWidth}px`;
    pill.style.transform = `translateX(${btn.offsetLeft}px)`;
    if (!pillReady.current) {
      // first placement: don't slide in from the left edge
      requestAnimationFrame(() => {
        pill.classList.remove("viz-pill-still");
        pillReady.current = true;
      });
    }
  }, [viewMode]);

  useLayoutEffect(() => {
    placePill();
  }, [placePill, showSkeleton]);

  useEffect(() => {
    const el = tabsRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(placePill);
    ro.observe(el);
    return () => ro.disconnect();
  }, [placePill, showSkeleton]);

  if (showSkeleton) {
    return (
      <div className="flex flex-col h-full w-full">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
          <Skeleton className="h-7 w-48 rounded" />
          <Skeleton className="h-8 w-72 rounded" />
        </div>
        <Skeleton className="flex-1 m-0 rounded-none" />
      </div>
    );
  }

  return (
    <div
      className={
        isFullscreen
          ? "viz-fs-in fixed inset-0 z-50 bg-background flex flex-col font-sans selection:bg-foreground/15"
          : "w-full h-full flex flex-col font-sans selection:bg-foreground/15 overflow-hidden"
      }
    >
      <VizStyles />

      {/* ─── Toolbar ─── */}
      <div className="relative flex items-center justify-between px-4 py-2 border-b border-border bg-card flex-shrink-0 select-none">
        {/* indeterminate loading line along the bottom edge */}
        <div
          aria-hidden
          className={`absolute inset-x-0 bottom-0 h-0.5 overflow-hidden transition-opacity duration-300 ${
            isViewLoading ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="viz-bar h-full bg-primary" />
        </div>

        {/* Left: repo pill & live status */}
        <div className="flex items-center gap-3 min-w-0">
          {repoDisplay ? (
            <a
              href={currentProject.githubUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border bg-secondary hover:bg-surface-hover text-xs font-mono text-foreground transition-[background-color,transform] active:scale-[0.97] group"
              title="Open GitHub Repository"
            >
              <GitFork className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground flex-shrink-0" />
              <span className="truncate max-w-[150px] font-semibold">{repoDisplay}</span>
              <ExternalLink className="h-2.5 w-2.5 opacity-50 flex-shrink-0 transition-transform duration-200 group-hover:translate-x-px group-hover:-translate-y-px" />
            </a>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
              <FolderTree className="h-3.5 w-3.5" />
              <span className="font-semibold text-foreground">Visualizer</span>
            </div>
          )}

          <div className="hidden md:flex items-center gap-1.5">
            <span
              className={`h-1.5 w-1.5 rounded-full animate-pulse-dot transition-colors duration-300 ${
                isViewLoading ? "bg-amber-500" : "bg-emerald-500"
              }`}
            />
            <span key={viewMode} className="viz-fade text-[11px] font-mono text-muted-foreground">
              {isViewLoading ? "Analyzing repository…" : activeMode.hint}
            </span>
          </div>
        </div>

        {/* Center: segmented tabs with sliding highlight */}
        <div
          ref={tabsRef}
          className="relative flex items-center p-0.5 rounded-md border border-border bg-secondary shadow-2xs"
        >
          <div
            ref={pillRef}
            aria-hidden
            className="viz-pill viz-pill-still absolute top-0.5 bottom-0.5 left-0 rounded bg-foreground shadow-xs pointer-events-none"
            style={{ width: 0 }}
          />
          {MODES.map((m) => {
            const MIcon = m.icon;
            const active = viewMode === m.key;
            return (
              <button
                key={m.key}
                ref={(el) => (tabRefs.current[m.key] = el)}
                onClick={() => setViewMode(m.key)}
                className={`relative z-10 flex items-center gap-1.5 px-3 py-1 rounded text-xs cursor-pointer transition-[color,transform] duration-200 active:scale-95 ${
                  active ? "text-background font-semibold" : "text-muted-foreground hover:text-foreground"
                }`}
                title={`${m.label} · ${m.badge}`}
              >
                <MIcon className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline">{m.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right: fullscreen */}
        <div className="flex items-center gap-2">
          <button
            className="flex items-center justify-center h-7.5 w-7.5 rounded-md border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-secondary transition-[color,background-color,transform] active:scale-90 cursor-pointer"
            onClick={() => setIsFullscreen((v) => !v)}
            title={isFullscreen ? "Exit Fullscreen (ESC)" : "Enter Fullscreen"}
          >
            {isFullscreen ? (
              <Minimize2 key="min" className="viz-pop h-3.5 w-3.5" />
            ) : (
              <Maximize2 key="max" className="viz-pop h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* ─── Canvas viewport ─── */}
      {currentProject?.githubUrl ? (
        <div className="flex-1 min-h-0 overflow-hidden relative bg-background">
          {/* key → each view fades/rises in when you switch tabs */}
          <div key={viewMode} className="viz-view-in absolute inset-0">
            {viewMode === "architecture" && (
              <ArchitectureOverview
                architectureData={currentArchitectureData}
                githubUrl={currentProject.githubUrl}
                isLoading={isArchitectureLoading}
                error={architectureError}
                onRefresh={handleRefreshArchitecture}
                isFullscreen={isFullscreen}
              />
            )}

            {viewMode === "dependencies" && (
              <DependencyGraph
                dependencyData={currentDependencyData}
                githubUrl={currentProject.githubUrl}
                isLoading={isDependencyLoading}
                error={dependencyError}
                onRefresh={handleRefreshDependencies}
                isFullscreen={isFullscreen}
              />
            )}

            {viewMode === "schema" && (
              <DatabaseSchemaView
                schemaData={currentSchemaData}
                githubUrl={currentProject.githubUrl}
                isLoading={isSchemaLoading}
                error={schemaError}
                onRefresh={handleRefreshSchema}
                isFullscreen={isFullscreen}
              />
            )}

            {viewMode === "tree" && (
              <FileTreeExplorer
                fileTree={fileTree}
                githubUrl={currentProject.githubUrl}
                isFullscreen={isFullscreen}
              />
            )}

            {viewMode === "diagram" && (
              <ArchitectureMap
                fileTree={fileTree}
                githubUrl={currentProject.githubUrl}
                isFullscreen={isFullscreen}
              />
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-background">
          <div className="viz-in text-center max-w-sm space-y-4 p-8 rounded-lg border border-border bg-card shadow-xs">
            <div className="mx-auto h-12 w-12 rounded-lg bg-secondary border border-border flex items-center justify-center">
              <FolderTree className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-foreground tracking-tight">No Repository Linked</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Connect a GitHub repository to automatically compile architecture graphs and file dependency DAGs.
              </p>
            </div>
            <Link to={`/projects/${id}`} className="block pt-2">
              <Button size="sm" className="w-full text-xs font-semibold transition-transform active:scale-95">
                Go to Workspace Settings
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
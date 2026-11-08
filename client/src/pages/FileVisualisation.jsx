import { useEffect, useMemo, useState, useCallback } from "react";
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

  useEffect(() => {
    if (!currentProject || (currentProject._id !== id && currentProject.id !== id)) {
      dispatch(fetchProject(id));
    }
  }, [dispatch, id, currentProject]);

  // Load architecture when user enters architecture tab if not already present
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

  // Load dependencies when user enters dependencies tab if not already present
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

  // Load schema intelligence when user enters schema tab if not already present
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
    (force = true) => {
      dispatch(generateArchitecture({ projectId: id, force }));
    },
    [dispatch, id]
  );

  const handleRefreshDependencies = useCallback(
    (force = true) => {
      dispatch(generateDependencies({ projectId: id, force }));
    },
    [dispatch, id]
  );

  const handleRefreshSchema = useCallback(() => {
    dispatch(refreshSchema(id));
  }, [dispatch, id]);

  const fileTree = useMemo(
    () => parseFileTree(currentProject?.mermaidGraph, currentProject?.name || "Repository"),
    [currentProject]
  );

  const currentArchitectureData = architectureGraph || currentProject?.architectureGraph;
  const currentDependencyData = dependencyGraph || currentProject?.dependencyGraph;
  const currentSchemaData = schemaIntelligence || currentProject?.schemaIntelligence;

  const repoDisplay = useMemo(() => {
    if (!currentProject?.githubUrl) return null;
    const clean = currentProject.githubUrl.replace(/\.git$/i, "").replace(/^https?:\/\/github\.com\//i, "");
    return clean;
  }, [currentProject?.githubUrl]);

  const modes = [
    { key: "architecture", label: "Architecture Overview", icon: Boxes, badge: "AI Synthesis" },
    { key: "dependencies", label: "Dependency DAG", icon: GitBranch, badge: "Code Imports" },
    { key: "schema", label: "Schema ER", icon: Database, badge: "Data Models" },
    { key: "tree", label: "File Tree", icon: ListTree, badge: "Directory" },
    { key: "diagram", label: "Interactive Flow", icon: Network, badge: "Mermaid" },
  ];

  if (isLoading && !currentProject) {
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
          ? "fixed inset-0 z-50 bg-background flex flex-col font-sans selection:bg-foreground/15"
          : "w-full h-full flex flex-col font-sans selection:bg-foreground/15 overflow-hidden"
      }
    >
      {/* ─── Compact Refined Toolbar Header ─── */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card flex-shrink-0 select-none">
        {/* Left: Repo pill & Breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          {repoDisplay ? (
            <a
              href={currentProject.githubUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border bg-secondary hover:bg-surface-hover text-xs font-mono text-foreground transition-colors group"
              title="Open GitHub Repository"
            >
              <GitFork className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground flex-shrink-0" />
              <span className="truncate max-w-[150px] font-semibold">{repoDisplay}</span>
              <ExternalLink className="h-2.5 w-2.5 opacity-50 flex-shrink-0" />
            </a>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
              <FolderTree className="h-3.5 w-3.5" />
              <span className="font-semibold text-foreground">Visualizer</span>
            </div>
          )}

          <div className="hidden md:flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse-dot" />
            <span className="text-[11px] font-mono text-muted-foreground">
              {viewMode === "architecture"
                ? "Microservices & Subsystem Boundaries"
                : viewMode === "dependencies"
                ? "AST Import/Export Graph"
                : viewMode === "schema"
                ? "Mongoose / Prisma Relational Entity Diagram"
                : "Directory Hierarchy"}
            </span>
          </div>
        </div>

        {/* Center: Mode Selector Segmented Tabs */}
        <div className="flex items-center p-0.5 rounded-md border border-border bg-secondary shadow-2xs">
          {modes.map((m) => {
            const MIcon = m.icon;
            const active = viewMode === m.key;
            return (
              <button
                key={m.key}
                onClick={() => setViewMode(m.key)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs transition-all duration-150 cursor-pointer ${
                  active
                    ? "bg-foreground text-background font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title={m.label}
              >
                <MIcon className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline">{m.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Controls & Fullscreen */}
        <div className="flex items-center gap-2">
          <button
            className="flex items-center justify-center h-7.5 w-7.5 rounded-md border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? "Exit Fullscreen (ESC)" : "Enter Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* ─── Graph Canvas Viewport ─── */}
      {currentProject?.githubUrl ? (
        <div className="flex-1 min-h-0 overflow-hidden relative bg-background">
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
      ) : (
        <div className="flex-1 flex items-center justify-center bg-background">
          <div className="text-center max-w-sm space-y-4 p-8 rounded-lg border border-border bg-card shadow-xs animate-fade-up">
            <div className="mx-auto h-12 w-12 rounded-lg bg-secondary border border-border flex items-center justify-center">
              <FolderTree className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-foreground tracking-tight">
                No Repository Linked
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Connect a GitHub repository to automatically compile architecture graphs and file dependency DAGs.
              </p>
            </div>
            <Link to={`/projects/${id}`} className="block pt-2">
              <Button size="sm" className="w-full text-xs font-semibold">
                Go to Workspace Settings
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

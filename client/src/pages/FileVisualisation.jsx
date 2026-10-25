import { useEffect, useRef, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchProject } from "@/store/slices/projectSlice";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  FolderTree,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  Maximize2,
  Minimize2,
  Network,
  ListTree,
  Search,
  File,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import mermaid from "mermaid";

mermaid.initialize({
  startOnLoad: false,
  securityLevel: "loose",
  theme: "dark",
  themeVariables: {
    darkMode: true,
    background: "#0a0d14",
    primaryColor: "#8b5cf6",
    primaryTextColor: "#f8fafc",
    primaryBorderColor: "#7c3aed",
    lineColor: "#64748b",
    secondaryColor: "#1e1b4b",
    tertiaryColor: "#0f172a",
    fontSize: "13px",
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
  },
});

// Helper component for collapsible tree view
function TreeNode({ item, depth = 0, searchTerm = "" }) {
  const [isOpen, setIsOpen] = useState(depth < 2);
  const isFolder = item.type === "folder";

  const matchesSearch =
    searchTerm === "" ||
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (isFolder &&
      item.children?.some((c) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
      ));

  if (!matchesSearch) return null;

  return (
    <div className="select-none text-xs">
      <div
        onClick={() => isFolder && setIsOpen(!isOpen)}
        style={{ paddingLeft: `${depth * 18 + 8}px` }}
        className={`flex items-center gap-2 py-1.5 px-2 rounded-lg cursor-pointer transition-colors ${
          isFolder
            ? "hover:bg-accent/60 text-foreground font-medium"
            : "hover:bg-muted/40 text-muted-foreground hover:text-foreground"
        }`}
      >
        {isFolder ? (
          <>
            <span className="text-muted-foreground/80">
              {isOpen ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </span>
            {isOpen ? (
              <FolderOpen className="h-4 w-4 text-purple-400 flex-shrink-0" />
            ) : (
              <Folder className="h-4 w-4 text-purple-400 flex-shrink-0" />
            )}
            <span className="truncate">{item.name}</span>
            <span className="text-[10px] text-muted-foreground ml-auto font-mono">
              {item.children?.length || 0}
            </span>
          </>
        ) : (
          <>
            <span className="w-3.5" />
            <File className="h-4 w-4 text-blue-400 flex-shrink-0" />
            <span className="truncate font-mono">{item.name}</span>
          </>
        )}
      </div>

      {isFolder && isOpen && item.children && (
        <div className="border-l border-border/40 ml-4">
          {item.children.map((child, idx) => (
            <TreeNode
              key={child.path || idx}
              item={child}
              depth={depth + 1}
              searchTerm={searchTerm}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function FileVisualisation() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { currentProject, isLoading } = useSelector((state) => state.project);
  const mermaidRef = useRef(null);

  const [viewMode, setViewMode] = useState("diagram"); // 'diagram' | 'tree'
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [renderError, setRenderError] = useState(null);
  const [isRendering, setIsRendering] = useState(false);

  useEffect(() => {
    if (!currentProject) {
      dispatch(fetchProject(id));
    }
  }, [dispatch, id, currentProject]);

  // Render Mermaid Graph safely with unique ID
  useEffect(() => {
    let isMounted = true;

    const renderMermaid = async () => {
      if (!currentProject?.mermaidGraph || !mermaidRef.current) return;

      setIsRendering(true);
      setRenderError(null);

      try {
        const uniqueId = `mermaid-svg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        mermaidRef.current.innerHTML = "";

        const { svg } = await mermaid.render(uniqueId, currentProject.mermaidGraph);

        if (isMounted && mermaidRef.current) {
          mermaidRef.current.innerHTML = svg;

          // Adjust SVG for responsiveness
          const svgEl = mermaidRef.current.querySelector("svg");
          if (svgEl) {
            svgEl.style.maxWidth = "100%";
            svgEl.style.height = "auto";
            svgEl.style.transition = "transform 0.2s ease";
          }
        }
      } catch (error) {
        console.error("Mermaid render error:", error);
        if (isMounted) {
          setRenderError(error.message || "Failed to render visual diagram");
        }
      } finally {
        if (isMounted) setIsRendering(false);
      }
    };

    renderMermaid();

    return () => {
      isMounted = false;
    };
  }, [currentProject?.mermaidGraph, viewMode]);

  // Apply zoom to SVG
  useEffect(() => {
    if (mermaidRef.current) {
      const svgEl = mermaidRef.current.querySelector("svg");
      if (svgEl) {
        svgEl.style.transform = `scale(${zoom})`;
        svgEl.style.transformOrigin = "top center";
      }
    }
  }, [zoom]);

  // Convert Mermaid graph lines into a nested folder/file tree structure for Tree view
  const fileTree = useMemo(() => {
    if (!currentProject?.mermaidGraph) return null;

    const root = { name: currentProject.name || "Repository", type: "folder", children: [] };
    const lines = currentProject.mermaidGraph.split("\n");

    const pathMap = new Map();
    pathMap.set("root_dir", root);

    // Collect all labeled nodes
    for (const line of lines) {
      // Matches pattern: n_123["📄 index.js"] or root_dir["📁 Project"]
      const nodeMatch = line.match(/^\s*([a-zA-Z0-9_]+)\["(?:📄\s*|📁\s*)?(.*?)"\]/);
      if (nodeMatch) {
        const [, id, label] = nodeMatch;
        const isFile = line.includes(":::file") || label.endsWith(".js") || label.endsWith(".jsx") || label.endsWith(".html") || label.endsWith(".css") || label.endsWith(".json") || label.endsWith(".md") || line.includes("📄");
        const node = { id, name: label.trim(), type: isFile ? "file" : "folder", children: [] };
        pathMap.set(id, node);
      }
    }

    // Connect edges
    for (const line of lines) {
      const edgeMatch = line.match(/^\s*([a-zA-Z0-9_]+)\s*-->\s*([a-zA-Z0-9_]+)/);
      if (edgeMatch) {
        const [, parentId, childId] = edgeMatch;
        const parent = pathMap.get(parentId);
        const child = pathMap.get(childId);
        if (parent && child && !parent.children.some((c) => c.id === child.id)) {
          parent.children.push(child);
        }
      }
    }

    return root;
  }, [currentProject]);

  const handleDownloadSVG = () => {
    if (!mermaidRef.current) return;
    const svgEl = mermaidRef.current.querySelector("svg");
    if (!svgEl) return;

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgEl);
    const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${currentProject?.name || "project"}-architecture.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Architecture diagram downloaded!");
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[600px] w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${isFullscreen ? "fixed inset-0 z-50 bg-background p-6 overflow-auto" : ""}`}>
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <FolderTree className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">File Visualisation</h1>
              {currentProject?.name && (
                <Badge variant="outline" className="border-border/60 text-xs font-mono">
                  {currentProject.name}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Interactive architecture flowchart & hierarchical directory explorer
            </p>
          </div>
        </div>

        {/* View Mode Switcher & Tools */}
        <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
          <div className="flex items-center p-1 rounded-lg border border-border/60 bg-card/60">
            <button
              onClick={() => setViewMode("diagram")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === "diagram"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Network className="h-3.5 w-3.5" />
              Diagram View
            </button>
            <button
              onClick={() => setViewMode("tree")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === "tree"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ListTree className="h-3.5 w-3.5" />
              Tree Explorer
            </button>
          </div>

          {viewMode === "diagram" && (
            <div className="flex items-center gap-1 border border-border/60 rounded-lg p-1 bg-card/60">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setZoom((z) => Math.max(0.4, z - 0.15))}
                title="Zoom Out"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </Button>
              <span className="text-[10px] font-mono px-1 text-muted-foreground">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setZoom((z) => Math.min(2.5, z + 0.15))}
                title="Zoom In"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setZoom(1)}
                title="Reset Zoom"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}

          {viewMode === "diagram" && (
            <Button
              variant="outline"
              size="sm"
              className="h-9"
              onClick={handleDownloadSVG}
              title="Export as SVG image"
            >
              <Download className="h-4 w-4 mr-1.5" />
              Export SVG
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            className="h-9 w-9 p-0"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Main Content Card */}
      {currentProject?.mermaidGraph ? (
        <Card className="glass border-border/50 shadow-xl overflow-hidden">
          <CardContent className="p-0">
            {viewMode === "diagram" ? (
              /* Mermaid Diagram View */
              <div className="relative min-h-[550px] w-full overflow-auto p-8 flex items-center justify-center bg-card/20">
                {isRendering && (
                  <div className="absolute inset-0 flex items-center justify-center bg-card/60 backdrop-blur-sm z-10">
                    <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                  </div>
                )}

                {renderError ? (
                  <div className="text-center p-8 max-w-md space-y-3">
                    <p className="text-red-400 text-sm font-medium">
                      Failed to render visual diagram
                    </p>
                    <p className="text-xs text-muted-foreground">{renderError}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setViewMode("tree")}
                    >
                      Switch to Tree View
                    </Button>
                  </div>
                ) : (
                  <div
                    ref={mermaidRef}
                    className="mermaid-wrapper flex justify-center items-center select-none"
                  />
                )}
              </div>
            ) : (
              /* Collapsible Tree Explorer View */
              <div className="p-6 space-y-4">
                <div className="relative max-w-sm">
                  <Search className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Filter files or folders..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-muted/40 border border-border/60 rounded-lg focus:outline-none focus:border-primary text-foreground"
                  />
                </div>

                <div className="border border-border/40 rounded-xl p-4 bg-card/40 max-h-[600px] overflow-y-auto font-mono">
                  {fileTree ? (
                    <TreeNode item={fileTree} depth={0} searchTerm={searchTerm} />
                  ) : (
                    <p className="text-xs text-muted-foreground">No file structure parsed.</p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="glass border-border/50">
          <CardContent className="py-16 text-center">
            <FolderTree className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-60" />
            <h3 className="text-base font-semibold mb-1">No file tree available</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Connect a GitHub repository to generate the file tree and architecture diagram.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

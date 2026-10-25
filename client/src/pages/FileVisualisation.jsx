import { useEffect, useRef, useState, useMemo, useCallback } from "react";
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
  Move,
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

// ─── Interactive pan/zoom diagram canvas ───────────────────────────────────
function DiagramCanvas({ mermaidGraph, isFullscreen }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const mermaidRef = useRef(null);

  const [zoom, setZoom] = useState(0.85);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isRendering, setIsRendering] = useState(false);
  const [renderError, setRenderError] = useState(null);

  // Render Mermaid diagram
  useEffect(() => {
    let isMounted = true;
    const renderMermaid = async () => {
      if (!mermaidGraph || !mermaidRef.current) return;
      setIsRendering(true);
      setRenderError(null);
      try {
        const uniqueId = `mermaid-svg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        mermaidRef.current.innerHTML = "";
        const { svg } = await mermaid.render(uniqueId, mermaidGraph);
        if (isMounted && mermaidRef.current) {
          mermaidRef.current.innerHTML = svg;
          const svgEl = mermaidRef.current.querySelector("svg");
          if (svgEl) {
            svgEl.style.display = "block";
            svgEl.removeAttribute("width");
            svgEl.removeAttribute("height");
            svgEl.style.width = "100%";
            svgEl.style.height = "auto";
          }
        }
      } catch (error) {
        console.error("Mermaid render error:", error);
        if (isMounted) setRenderError(error.message || "Failed to render visual diagram");
      } finally {
        if (isMounted) setIsRendering(false);
      }
    };
    renderMermaid();
    return () => { isMounted = false; };
  }, [mermaidGraph]);

  // Scroll-wheel zoom
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.08 : 0.08;
    setZoom((z) => Math.min(3, Math.max(0.2, z + delta)));
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  // Mouse drag pan
  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  }, [pan]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  // Touch drag pan
  const touchRef = useRef(null);
  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 1) {
      touchRef.current = { x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y };
    }
  }, [pan]);
  const handleTouchMove = useCallback((e) => {
    if (e.touches.length === 1 && touchRef.current) {
      e.preventDefault();
      setPan({ x: e.touches[0].clientX - touchRef.current.x, y: e.touches[0].clientY - touchRef.current.y });
    }
  }, []);

  const resetView = () => { setZoom(0.85); setPan({ x: 0, y: 0 }); };

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
    a.download = "architecture.svg";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Architecture diagram downloaded!");
  };

  return (
    <div className="relative flex flex-col" style={{ height: isFullscreen ? "calc(100vh - 120px)" : "680px" }}>
      {/* Embedded toolbar */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/40 bg-card/40 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center gap-1 border border-border/60 rounded-lg p-0.5 bg-background/40">
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setZoom((z) => Math.max(0.2, z - 0.1))} title="Zoom Out">
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          <span className="text-[10px] font-mono px-2 text-muted-foreground min-w-[40px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setZoom((z) => Math.min(3, z + 0.1))} title="Zoom In">
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
          <div className="w-px h-4 bg-border/60 mx-0.5" />
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={resetView} title="Reset View">
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground border border-border/40 rounded-md px-2.5 py-1 bg-background/20">
          <Move className="h-3 w-3" />
          <span>Drag to pan · Scroll to zoom</span>
        </div>

        <div className="ml-auto">
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={handleDownloadSVG}>
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export SVG
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="relative flex-1 overflow-hidden"
        style={{
          cursor: isDragging ? "grabbing" : "grab",
          backgroundImage: `
            radial-gradient(ellipse at center, rgba(139,92,246,0.05) 0%, transparent 70%),
            linear-gradient(rgba(148,163,184,0.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(148,163,184,0.035) 1px, transparent 1px)
          `,
          backgroundSize: "100% 100%, 36px 36px, 36px 36px",
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={() => { touchRef.current = null; }}
      >
        {isRendering && (
          <div className="absolute inset-0 flex items-center justify-center bg-card/60 backdrop-blur-sm z-10">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="h-6 w-6 animate-spin text-primary" />
              <span className="text-xs text-muted-foreground">Rendering diagram…</span>
            </div>
          </div>
        )}

        {renderError ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center p-8 max-w-md space-y-3">
              <p className="text-red-400 text-sm font-medium">Failed to render visual diagram</p>
              <p className="text-xs text-muted-foreground">{renderError}</p>
            </div>
          </div>
        ) : (
          <div
            ref={canvasRef}
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px)) scale(${zoom})`,
              transformOrigin: "center center",
              transition: isDragging ? "none" : "transform 0.06s ease-out",
              userSelect: "none",
              willChange: "transform",
            }}
          >
            <div ref={mermaidRef} className="mermaid-wrapper" style={{ minWidth: "420px" }} />
          </div>
        )}

        {/* Corner hint */}
        {!isRendering && !renderError && (
          <div className="absolute bottom-3 right-3 text-[9px] font-mono text-muted-foreground/40 bg-background/30 border border-border/20 rounded px-1.5 py-0.5 select-none pointer-events-none">
            {Math.round(zoom * 100)}% · scroll = zoom · drag = pan
          </div>
        )}
      </div>
    </div>
  );
}

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
        className={`flex items-center gap-2 py-1.5 px-2 rounded-lg cursor-pointer transition-colors ${isFolder
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

  const [viewMode, setViewMode] = useState("diagram"); // 'diagram' | 'tree'
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!currentProject) {
      dispatch(fetchProject(id));
    }
  }, [dispatch, id, currentProject]);

  // Convert Mermaid graph lines into a nested folder/file tree structure for Tree view
  const fileTree = useMemo(() => {
    if (!currentProject?.mermaidGraph) return null;

    const root = { id: "root_dir", name: currentProject.name || "Repository", type: "folder", children: [] };
    const lines = currentProject.mermaidGraph.split("\n");
    const pathMap = new Map();
    pathMap.set("root_dir", root);

    const FILE_EXTS = [
      ".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs",
      ".html", ".css", ".scss", ".sass", ".less",
      ".json", ".jsonc", ".json5",
      ".md", ".mdx", ".txt", ".rst",
      ".py", ".rb", ".go", ".rs", ".java", ".kt",
      ".c", ".cpp", ".h", ".hpp", ".cs",
      ".php", ".sh", ".bash", ".zsh", ".fish",
      ".yaml", ".yml", ".toml", ".ini", ".env",
      ".lock", ".svg", ".png", ".jpg", ".jpeg", ".gif", ".ico",
      ".wasm", ".sql", ".prisma", ".graphql",
    ];

    // Strip all emoji/unicode symbols from a string
    const stripEmoji = (s) =>
      s.replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE00}-\u{FEFF}]/gu, "").trim();

    const isFilePath = (rawLabel, fullLine) => {
      const clean = stripEmoji(rawLabel).toLowerCase();
      return (
        fullLine.includes(":::file") ||
        rawLabel.includes("\uD83D\uDCC4") || // 📄 as surrogate pair
        FILE_EXTS.some((ext) => clean.endsWith(ext))
      );
    };

    // --- Pass 1: collect all node definitions ---
    // Node lines look like:   n_abcd1234["📄 index.js"]:::file
    // or:                     root_dir["📁 myproject"]:::root
    for (const line of lines) {
      // Skip header / classDef / style / comment lines
      if (/^\s*(graph|flowchart|classDef|style|linkStyle|%%)/i.test(line.trim())) continue;

      // Find pattern:  IDENTIFIER["...]
      const idEnd = line.indexOf('["');
      if (idEnd === -1) continue; // no node bracket on this line

      const rawId = line.slice(0, idEnd).trim();
      // Validate it's a simple alphanumeric+underscore id
      if (!/^[A-Za-z0-9_]+$/.test(rawId)) continue;
      if (pathMap.has(rawId)) continue; // already registered (root_dir)

      const labelStart = idEnd + 2; // after ["
      const labelEnd = line.indexOf('"]', labelStart);
      if (labelEnd === -1) continue;

      const rawLabel = line.slice(labelStart, labelEnd);
      const cleanLabel = stripEmoji(rawLabel).replace(/\s+/g, " ").trim() || rawLabel.trim();
      const type = isFilePath(rawLabel, line) ? "file" : "folder";

      pathMap.set(rawId, { id: rawId, name: cleanLabel, type, children: [] });
    }

    // --- Pass 2: connect edges ---
    // Edge lines look like:   root_dir --> n_abcd1234
    const edgeRe = /^\s*([A-Za-z0-9_]+)\s*-->\s*([A-Za-z0-9_]+)/;
    for (const line of lines) {
      const m = line.match(edgeRe);
      if (!m) continue;
      const [, parentId, childId] = m;
      const parent = pathMap.get(parentId);
      const child = pathMap.get(childId);
      if (!parent || !child || parent === child) continue;
      if (!parent.children.some((c) => c.id === childId)) {
        parent.children.push(child);
      }
    }

    return root;
  }, [currentProject]);




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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${viewMode === "diagram"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
                }`}
            >
              <Network className="h-3.5 w-3.5" />
              Diagram View
            </button>
            <button
              onClick={() => setViewMode("tree")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${viewMode === "tree"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
                }`}
            >
              <ListTree className="h-3.5 w-3.5" />
              Tree Explorer
            </button>
          </div>



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
              /* Interactive Pan/Zoom Diagram Canvas */
              <DiagramCanvas
                mermaidGraph={currentProject.mermaidGraph}
                isFullscreen={isFullscreen}
              />
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

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
  ArrowDownUp,
  ArrowLeftRight,
  Layers,
} from "lucide-react";
import mermaid from "mermaid";
import { useTheme } from "@/components/theme/ThemeProvider";

const MERMAID_FONT =
  "'JetBrains Mono', 'Plus Jakarta Sans', Inter, system-ui, sans-serif";

const MERMAID_PALETTES = {
  dark: {
    themeVariables: {
      darkMode: true,
      background: "transparent",
      primaryColor: "#18181b",
      primaryTextColor: "#f4f4f5",
      primaryBorderColor: "#3f3f46",
      lineColor: "#52525b",
      secondaryColor: "#18181b",
      tertiaryColor: "#0f1117",
      mainBkg: "#18181b",
      nodeBorder: "#3f3f46",
      nodeTextColor: "#e4e4e7",
      edgeLabelBackground: "#18181b",
      fontSize: "12px",
      fontFamily: MERMAID_FONT,
    },
    classDefs: `
  classDef root fill:#18181b,stroke:#52525b,stroke-width:2px,color:#ffffff,rx:6px,ry:6px;
  classDef folder fill:#18181b,stroke:#3f3f46,stroke-width:1.5px,color:#e4e4e7,rx:6px,ry:6px;
  classDef file fill:#0f1117,stroke:#27272a,stroke-width:1px,color:#a1a1aa,rx:4px,ry:4px;
  linkStyle default stroke:#52525b,stroke-width:1.2px;
`,
  },
  light: {
    themeVariables: {
      darkMode: false,
      background: "transparent",
      primaryColor: "#f4f4f5",
      primaryTextColor: "#18181b",
      primaryBorderColor: "#d4d4d8",
      lineColor: "#a1a1aa",
      secondaryColor: "#fafafa",
      tertiaryColor: "#ffffff",
      mainBkg: "#f4f4f5",
      nodeBorder: "#d4d4d8",
      nodeTextColor: "#27272a",
      edgeLabelBackground: "#fafafa",
      fontSize: "12px",
      fontFamily: MERMAID_FONT,
    },
    classDefs: `
  classDef root fill:#f4f4f5,stroke:#a1a1aa,stroke-width:2px,color:#18181b,rx:6px,ry:6px;
  classDef folder fill:#fafafa,stroke:#d4d4d8,stroke-width:1.5px,color:#27272a,rx:6px,ry:6px;
  classDef file fill:#ffffff,stroke:#e4e4e7,stroke-width:1px,color:#52525b,rx:4px,ry:4px;
  linkStyle default stroke:#a1a1aa,stroke-width:1.2px;
`,
  },
};

function initMermaid(resolvedTheme) {
  const palette = MERMAID_PALETTES[resolvedTheme] || MERMAID_PALETTES.dark;
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: "loose",
    theme: "base",
    themeVariables: palette.themeVariables,
  });
}

/**
 * Format and sanitize raw Mermaid graph:
 * - Strips all legacy hardcoded purple/rainbow classDef and styles
 * - Replaces with professional minimal monochrome 2-3 colors
 * - Supports orientation (TD = vertical, LR = horizontal)
 * - Supports scope (architecture = clean high-level view, all = all files)
 */
function prepareMermaidGraph(rawGraph, orientation = "TD", mode = "architecture", classDefs = MERMAID_PALETTES.dark.classDefs) {
  if (!rawGraph) return "";

  const lines = rawGraph.split("\n");
  const filteredLines = [];

  const isExcludedInArchitecture = (label) => {
    if (mode !== "architecture") return false;
    const lower = label.toLowerCase();
    const staticExts = [
      ".png", ".jpg", ".jpeg", ".gif", ".ico", ".svg", ".webp",
      ".lock", ".map", ".woff", ".woff2", ".ttf", ".eot",
      ".min.js", ".min.css", "-chunk-",
    ];
    return staticExts.some((ext) => lower.includes(ext));
  };

  const excludedNodeIds = new Set();

  for (const line of lines) {
    const trimmed = line.trim();
    // Drop existing graph declaration, classDefs, styles, linkStyles, and comments
    if (/^\s*(graph|flowchart|classDef|style|linkStyle|%%)/i.test(trimmed)) continue;
    if (!trimmed) continue;

    // Detect excluded nodes for architecture view
    const nodeMatch = trimmed.match(/^([A-Za-z0-9_]+)\["([^"]+)"\]/);
    if (nodeMatch) {
      const [, nodeId, label] = nodeMatch;
      if (isExcludedInArchitecture(label)) {
        excludedNodeIds.add(nodeId);
        continue;
      }
    }

    // Exclude edges pointing to or from excluded nodes
    const edgeMatch = trimmed.match(/^([A-Za-z0-9_]+)\s*-->\s*([A-Za-z0-9_]+)/);
    if (edgeMatch) {
      const [, parentId, childId] = edgeMatch;
      if (excludedNodeIds.has(parentId) || excludedNodeIds.has(childId)) {
        continue;
      }
    }

    filteredLines.push("  " + trimmed);
  }

  return `graph ${orientation};\n${classDefs}${filteredLines.join("\n")}\n`;
}

// ─── Interactive pan/zoom diagram canvas ───────────────────────────────────
function DiagramCanvas({ rawMermaidGraph, isFullscreen }) {
  const { resolvedTheme } = useTheme();
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const mermaidRef = useRef(null);

  const [zoom, setZoom] = useState(0.85);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isRendering, setIsRendering] = useState(false);
  const [renderError, setRenderError] = useState(null);

  // Layout controls
  const [orientation, setOrientation] = useState("TD"); // 'TD' (Vertical) | 'LR' (Horizontal)
  const [diagramScope, setDiagramScope] = useState("architecture"); // 'architecture' | 'all'

  // Generate cleaned & minimalized mermaid diagram string
  const processedGraph = useMemo(() => {
    const palette = MERMAID_PALETTES[resolvedTheme] || MERMAID_PALETTES.dark;
    return prepareMermaidGraph(rawMermaidGraph, orientation, diagramScope, palette.classDefs);
  }, [rawMermaidGraph, orientation, diagramScope, resolvedTheme]);

  // Render Mermaid diagram
  useEffect(() => {
    let isMounted = true;
    const renderMermaid = async () => {
      if (!processedGraph || !mermaidRef.current) return;
      setIsRendering(true);
      setRenderError(null);
      try {
        initMermaid(resolvedTheme);
        const uniqueId = `mermaid-svg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        mermaidRef.current.innerHTML = "";
        const { svg } = await mermaid.render(uniqueId, processedGraph);
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
  }, [processedGraph, resolvedTheme]);

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
    a.download = "architecture-diagram.svg";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Architecture diagram downloaded!");
  };

  return (
    <div className="relative flex flex-col" style={{ height: isFullscreen ? "calc(100vh - 120px)" : "680px" }}>
      {/* Embedded Minimal Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/50 bg-card/60 backdrop-blur-sm flex-shrink-0 flex-wrap">
        {/* Zoom controls */}
        <div className="flex items-center gap-1 border border-border/60 rounded-lg p-0.5 bg-background/50">
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground" onClick={() => setZoom((z) => Math.max(0.2, z - 0.1))} title="Zoom Out">
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          <span className="text-[11px] font-mono px-2 text-muted-foreground min-w-[42px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground" onClick={() => setZoom((z) => Math.min(3, z + 0.1))} title="Zoom In">
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
          <div className="w-px h-4 bg-border/60 mx-0.5" />
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground" onClick={resetView} title="Reset View">
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Orientation Toggle: Vertical (TD) vs Horizontal (LR) */}
        <div className="flex items-center p-0.5 rounded-lg border border-border/60 bg-background/50">
          <button
            onClick={() => setOrientation("TD")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${orientation === "TD"
                ? "bg-muted text-foreground font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground"
              }`}
            title="Vertical Layout (Top-to-Bottom)"
          >
            <ArrowDownUp className="h-3 w-3" />
            Vertical
          </button>
          <button
            onClick={() => setOrientation("LR")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${orientation === "LR"
                ? "bg-muted text-foreground font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground"
              }`}
            title="Horizontal Layout (Left-to-Right)"
          >
            <ArrowLeftRight className="h-3 w-3" />
            Horizontal
          </button>
        </div>

        {/* Scope Toggle: Architecture Overview vs All Files */}
        <div className="flex items-center p-0.5 rounded-lg border border-border/60 bg-background/50">
          <button
            onClick={() => setDiagramScope("architecture")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${diagramScope === "architecture"
                ? "bg-muted text-foreground font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground"
              }`}
            title="Clean System Architecture View"
          >
            <Layers className="h-3 w-3" />
            Architecture
          </button>
          <button
            onClick={() => setDiagramScope("all")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${diagramScope === "all"
                ? "bg-muted text-foreground font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground"
              }`}
            title="Full File Hierarchy"
          >
            All Files
          </button>
        </div>

        {/* Canvas instruction hint */}
        <div className="hidden md:flex items-center gap-1.5 text-[11px] text-muted-foreground border border-border/40 rounded-md px-2.5 py-1 bg-background/30">
          <Move className="h-3 w-3" />
          <span>Drag to pan · Scroll to zoom</span>
        </div>

        {/* Palette Indicator */}
        <div className="hidden lg:flex items-center gap-1.5 text-[10px] text-muted-foreground/80 border border-border/40 rounded-md px-2 py-1 font-mono">
          <span className="w-2 h-2 rounded-full bg-muted-foreground inline-block" />
          <span>Minimal Slate</span>
        </div>

        <div className="ml-auto">
          <Button variant="outline" size="sm" className="h-7 text-xs border-border/60 text-muted-foreground hover:text-foreground" onClick={handleDownloadSVG}>
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export SVG
          </Button>
        </div>
      </div>

      {/* Clean Minimal Canvas */}
      <div
        ref={containerRef}
        className="relative flex-1 overflow-hidden"
        style={{
          cursor: isDragging ? "grabbing" : "grab",
          backgroundColor: "var(--background)",
          backgroundImage: `
            radial-gradient(circle at 1px 1px, color-mix(in oklch, var(--foreground) 8%, transparent) 1px, transparent 0)
          `,
          backgroundSize: "24px 24px",
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
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-xs z-10">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-mono">Rendering diagram…</span>
            </div>
          </div>
        )}

        {renderError ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center p-8 max-w-md space-y-3">
              <p className="text-foreground text-sm font-medium">Failed to render visual diagram</p>
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
          <div className="absolute bottom-3 right-3 text-[9px] font-mono text-muted-foreground/50 bg-background/40 border border-border/30 rounded px-2 py-0.5 select-none pointer-events-none">
            {Math.round(zoom * 100)}% · {orientation === "TD" ? "Vertical" : "Horizontal"} · {diagramScope === "architecture" ? "Architecture" : "Full"}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Collapsible Tree View with Minimal Monochrome Styling ─────────────────
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
        className={`flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer transition-colors ${isFolder
            ? "hover:bg-muted/50 text-foreground font-medium"
            : "hover:bg-muted/30 text-muted-foreground hover:text-foreground"
          }`}
      >
        {isFolder ? (
          <>
            <span className="text-muted-foreground/70">
              {isOpen ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </span>
            {isOpen ? (
              <FolderOpen className="h-4 w-4 text-foreground flex-shrink-0" />
            ) : (
              <Folder className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            )}
            <span className="truncate text-foreground">{item.name}</span>
            <span className="text-[10px] text-muted-foreground ml-auto font-mono">
              {item.children?.length || 0}
            </span>
          </>
        ) : (
          <>
            <span className="w-3.5" />
            <File className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <span className="truncate font-mono text-muted-foreground">{item.name}</span>
          </>
        )}
      </div>

      {isFolder && isOpen && item.children && (
        <div className="border-l border-border/40 ml-4">
          {item.children.map((child, idx) => (
            <TreeNode
              key={child.path || child.id || idx}
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

// ─── Main Page Component ───────────────────────────────────────────────────
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

  // Robust nested folder/file tree structure parser
  const fileTree = useMemo(() => {
    if (!currentProject?.mermaidGraph) return null;

    const lines = currentProject.mermaidGraph.split("\n");
    const pathMap = new Map();
    const childIds = new Set();
    const parentIds = new Set();

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

    const stripEmoji = (s) =>
      s.replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE00}-\u{FEFF}]/gu, "").trim();

    const isFilePath = (rawLabel, fullLine) => {
      const clean = stripEmoji(rawLabel).toLowerCase();
      return (
        fullLine.includes(":::file") ||
        rawLabel.includes("\uD83D\uDCC4") ||
        FILE_EXTS.some((ext) => clean.endsWith(ext))
      );
    };

    // Pass 1: Parse all nodes
    for (const line of lines) {
      if (/^\s*(graph|flowchart|classDef|style|linkStyle|%%)/i.test(line.trim())) continue;
      const idEnd = line.indexOf('["');
      if (idEnd === -1) continue;

      const rawId = line.slice(0, idEnd).trim();
      if (!/^[A-Za-z0-9_]+$/.test(rawId)) continue;

      const labelStart = idEnd + 2;
      const labelEnd = line.indexOf('"]', labelStart);
      if (labelEnd === -1) continue;

      const rawLabel = line.slice(labelStart, labelEnd);
      const cleanLabel = stripEmoji(rawLabel).replace(/\s+/g, " ").trim() || rawLabel.trim();
      const type = line.includes(":::root")
        ? "folder"
        : isFilePath(rawLabel, line)
          ? "file"
          : "folder";

      pathMap.set(rawId, { id: rawId, name: cleanLabel, type, children: [] });
    }

    // Pass 2: Connect parent-child edges
    const edgeRe = /^\s*([A-Za-z0-9_]+)\s*-->\s*([A-Za-z0-9_]+)/;
    for (const line of lines) {
      const m = line.match(edgeRe);
      if (!m) continue;
      const [, parentId, childId] = m;
      childIds.add(childId);
      parentIds.add(parentId);

      const parent = pathMap.get(parentId);
      const child = pathMap.get(childId);
      if (!parent || !child || parent === child) continue;
      if (!parent.children.some((c) => c.id === childId)) {
        parent.children.push(child);
      }
    }

    // Identify root node
    let rootNode = null;
    for (const [id, node] of pathMap.entries()) {
      if (id === "root_dir" || id === "root_0" || id.startsWith("root")) {
        rootNode = node;
        break;
      }
    }

    if (!rootNode) {
      for (const [id, node] of pathMap.entries()) {
        if (!childIds.has(id) && parentIds.has(id)) {
          rootNode = node;
          break;
        }
      }
    }

    // Fallback: build root containing all unparented nodes so tree is never empty
    if (!rootNode) {
      rootNode = {
        id: "root_dir",
        name: currentProject.name || "Repository",
        type: "folder",
        children: Array.from(pathMap.values()).filter((n) => !childIds.has(n.id)),
      };
    } else {
      // Connect any orphan nodes without incoming edges
      for (const [id, node] of pathMap.entries()) {
        if (node !== rootNode && !childIds.has(id)) {
          if (!rootNode.children.some((c) => c.id === id)) {
            rootNode.children.push(node);
          }
        }
      }
    }

    return rootNode;
  }, [currentProject]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64 bg-muted/40" />
        <Skeleton className="h-[600px] w-full rounded-xl bg-muted/30" />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${isFullscreen ? "fixed inset-0 z-50 bg-background p-6 overflow-auto" : ""}`}>
      {/* Header & Controls with Clean Minimal Monochrome Styling */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-muted border border-border flex items-center justify-center text-foreground">
            <FolderTree className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">File Visualisation</h1>
              {currentProject?.name && (
                <Badge variant="outline" className="border-border/60 text-xs font-mono text-muted-foreground bg-background/50">
                  {currentProject.name}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              System architecture flowchart & hierarchical directory explorer
            </p>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
          <div className="flex items-center p-1 rounded-lg border border-border/60 bg-card/60">
            <button
              onClick={() => setViewMode("diagram")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${viewMode === "diagram"
                  ? "bg-muted text-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
                }`}
            >
              <Network className="h-3.5 w-3.5" />
              Diagram View
            </button>
            <button
              onClick={() => setViewMode("tree")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${viewMode === "tree"
                  ? "bg-muted text-foreground font-semibold shadow-xs"
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
            className="h-9 w-9 p-0 border-border/60 text-muted-foreground hover:text-foreground"
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
              /* Interactive Minimal Diagram Canvas */
              <DiagramCanvas
                rawMermaidGraph={currentProject.mermaidGraph}
                isFullscreen={isFullscreen}
              />
            ) : (
              /* Collapsible Minimal Tree Explorer View */
              <div className="p-6 space-y-4">
                <div className="relative max-w-sm">
                  <Search className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Filter files or folders..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-muted/40 border border-border/60 rounded-lg focus:outline-none focus:border-ring text-foreground"
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

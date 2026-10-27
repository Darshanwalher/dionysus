import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  RefreshCw,
  Move,
  ArrowDownUp,
  ArrowLeftRight,
  Folder,
  File,
  ChevronRight,
} from "lucide-react";
import mermaid from "mermaid";
import { useTheme } from "@/components/theme/ThemeProvider";
import {
  buildMermaidFromTree,
  findNodeById,
  getPathToNode,
} from "@/lib/fileTree";

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

function extractNodeId(svgNode) {
  const raw = svgNode.getAttribute("id") || svgNode.getAttribute("data-id") || "";
  const match = raw.match(/^(?:flowchart-)?([A-Za-z0-9_]+?)(?:-\d+)?$/);
  return match ? match[1] : raw || null;
}

export default function ArchitectureMap({ fileTree, isFullscreen }) {
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
  const [orientation, setOrientation] = useState("TD");
  const [maxDepth, setMaxDepth] = useState(2);
  const [includeFiles, setIncludeFiles] = useState(false);
  const [focusNodeId, setFocusNodeId] = useState(fileTree?.id || null);

  useEffect(() => {
    setFocusNodeId(fileTree?.id || null);
  }, [fileTree]);

  const focusNode = useMemo(
    () => findNodeById(fileTree, focusNodeId) || fileTree,
    [fileTree, focusNodeId]
  );

  const breadcrumbs = useMemo(
    () => getPathToNode(fileTree, focusNode?.id) || (fileTree ? [fileTree] : []),
    [fileTree, focusNode]
  );

  const processedGraph = useMemo(() => {
    const palette = MERMAID_PALETTES[resolvedTheme] || MERMAID_PALETTES.dark;
    return buildMermaidFromTree(focusNode, {
      maxDepth,
      includeFiles,
      orientation,
      classDefs: palette.classDefs,
      nodeCap: 80,
    });
  }, [focusNode, maxDepth, includeFiles, orientation, resolvedTheme]);

  const drillInto = useCallback(
    (nodeId) => {
      if (!nodeId || nodeId.endsWith("_more")) return;
      const target = findNodeById(fileTree, nodeId);
      if (!target || target.type !== "folder") return;
      if (target.id === focusNode?.id) return;
      setFocusNodeId(target.id);
      setPan({ x: 0, y: 0 });
      setZoom(0.85);
    },
    [fileTree, focusNode]
  );

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
          mermaidRef.current.querySelectorAll(".node").forEach((el) => {
            const nodeId = extractNodeId(el);
            const target = findNodeById(fileTree, nodeId);
            if (target?.type === "folder" && target.id !== focusNode?.id) {
              el.style.cursor = "pointer";
              el.addEventListener("click", (event) => {
                event.stopPropagation();
                drillInto(nodeId);
              });
            }
          });
        }
      } catch (error) {
        console.error("Mermaid render error:", error);
        if (isMounted) setRenderError(error.message || "Failed to render visual diagram");
      } finally {
        if (isMounted) setIsRendering(false);
      }
    };
    renderMermaid();
    return () => {
      isMounted = false;
    };
  }, [processedGraph, resolvedTheme, drillInto, fileTree, focusNode]);

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

  const handleMouseDown = useCallback(
    (e) => {
      if (e.button !== 0) return;
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    },
    [pan]
  );

  const handleMouseMove = useCallback(
    (e) => {
      if (!isDragging) return;
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    },
    [isDragging, dragStart]
  );

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  const touchRef = useRef(null);
  const handleTouchStart = useCallback(
    (e) => {
      if (e.touches.length === 1) {
        touchRef.current = {
          x: e.touches[0].clientX - pan.x,
          y: e.touches[0].clientY - pan.y,
        };
      }
    },
    [pan]
  );
  const handleTouchMove = useCallback((e) => {
    if (e.touches.length === 1 && touchRef.current) {
      e.preventDefault();
      setPan({
        x: e.touches[0].clientX - touchRef.current.x,
        y: e.touches[0].clientY - touchRef.current.y,
      });
    }
  }, []);

  const resetView = () => {
    setZoom(0.85);
    setPan({ x: 0, y: 0 });
  };

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
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/50 bg-card/60 backdrop-blur-sm flex-shrink-0 flex-wrap">
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

        <div className="flex items-center p-0.5 rounded-lg border border-border/60 bg-background/50">
          <button
            onClick={() => setOrientation("TD")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              orientation === "TD"
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
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              orientation === "LR"
                ? "bg-muted text-foreground font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="Horizontal Layout (Left-to-Right)"
          >
            <ArrowLeftRight className="h-3 w-3" />
            Horizontal
          </button>
        </div>

        <div className="flex items-center p-0.5 rounded-lg border border-border/60 bg-background/50">
          <button
            onClick={() => setIncludeFiles(false)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              !includeFiles
                ? "bg-muted text-foreground font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="Folders only"
          >
            <Folder className="h-3 w-3" />
            Folders
          </button>
          <button
            onClick={() => setIncludeFiles(true)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              includeFiles
                ? "bg-muted text-foreground font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="Include files in the focused folder"
          >
            <File className="h-3 w-3" />
            Include files
          </button>
        </div>

        <div className="flex items-center p-0.5 rounded-lg border border-border/60 bg-background/50">
          {[1, 2, 3].map((depth) => (
            <button
              key={depth}
              onClick={() => setMaxDepth(depth)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                maxDepth === depth
                  ? "bg-muted text-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title={`Show ${depth} level${depth > 1 ? "s" : ""} from this folder`}
            >
              Depth {depth}
            </button>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-1.5 text-[11px] text-muted-foreground border border-border/40 rounded-md px-2.5 py-1 bg-background/30">
          <Move className="h-3 w-3" />
          <span>Click a folder to drill in · Drag to pan</span>
        </div>

        <div className="ml-auto">
          <Button variant="outline" size="sm" className="h-7 text-xs border-border/60 text-muted-foreground hover:text-foreground" onClick={handleDownloadSVG}>
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export SVG
          </Button>
        </div>
      </div>

      {breadcrumbs.length > 0 && (
        <div className="flex items-center gap-1 px-4 py-2 border-b border-border/40 bg-background/40 overflow-x-auto text-xs">
          {breadcrumbs.map((crumb, idx) => (
            <span key={crumb.id} className="flex items-center gap-1 flex-shrink-0">
              {idx > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
              <button
                onClick={() => {
                  setFocusNodeId(crumb.id);
                  setPan({ x: 0, y: 0 });
                  setZoom(0.85);
                }}
                className={
                  crumb.id === focusNode?.id
                    ? "font-semibold text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }
              >
                {crumb.name}
              </button>
            </span>
          ))}
        </div>
      )}

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
        onTouchEnd={() => {
          touchRef.current = null;
        }}
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

        {!isRendering && !renderError && (
          <div className="absolute bottom-3 right-3 text-[9px] font-mono text-muted-foreground/50 bg-background/40 border border-border/30 rounded px-2 py-0.5 select-none pointer-events-none">
            {Math.round(zoom * 100)}% · {orientation === "TD" ? "Vertical" : "Horizontal"} · Depth {maxDepth}
          </div>
        )}
      </div>
    </div>
  );
}

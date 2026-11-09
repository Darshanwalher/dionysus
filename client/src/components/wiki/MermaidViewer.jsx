import React, { useEffect, useRef, useId, useState } from "react";
import mermaid from "mermaid";
import { useTheme } from "@/components/theme/ThemeProvider";
import { AlertTriangle, GitBranch, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";

/**
 * Module-level singleton — mermaid.initialize() must only run ONCE per theme.
 */
let _mermaidTheme = null;

function ensureMermaidInit(isDark) {
  const desired = isDark ? "dark" : "default";
  if (_mermaidTheme === desired) return;
  _mermaidTheme = desired;
  mermaid.initialize({
    startOnLoad: false,
    theme: desired,
    themeVariables: {
      darkMode: isDark,
      background: "transparent",
      primaryColor: isDark ? "#1e293b" : "#dbeafe",
      primaryTextColor: isDark ? "#f8fafc" : "#1e3a5f",
      primaryBorderColor: isDark ? "#334155" : "#93c5fd",
      lineColor: isDark ? "#64748b" : "#60a5fa",
      secondaryColor: isDark ? "#0f172a" : "#eff6ff",
      tertiaryColor: isDark ? "#1e293b" : "#f0f9ff",
      fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
      fontSize: "13px",
    },
    securityLevel: "loose",
    flowchart: { curve: "basis", padding: 16 },
    er: { diagramPadding: 20, layoutDirection: "TB", minEntityWidth: 100, minEntityHeight: 75 },
  });
}

function getDiagramType(code) {
  const firstLine = code.trim().split("\n")[0].trim().toLowerCase();
  if (firstLine.startsWith("flowchart") || firstLine.startsWith("graph")) return "flowchart";
  if (firstLine.startsWith("sequencediagram")) return "sequence";
  if (firstLine.startsWith("erdiagram")) return "er";
  if (firstLine.startsWith("classdiagram")) return "class";
  if (firstLine.startsWith("statediagram")) return "state";
  return "other";
}

function sanitizeMermaidCode(raw) {
  if (!raw) return "";
  let code = raw.trim();
  code = code.replace(/^```(?:mermaid)?\s*/i, "").replace(/```\s*$/i, "").trim();

  // Remove lines that are markdown image badges (invalid inside mermaid blocks)
  code = code
    .split("\n")
    .filter((line) => !/^!\[.*\]\(https?:\/\//.test(line.trim()))
    .join("\n");

  const diagType = getDiagramType(code);

  if (diagType === "flowchart") {
    // Auto-quote square-bracket node labels with special chars
    code = code.replace(
      /(\b\w[\w-]*)\[([^\]"[]+[\/\{\}\(\)|&<>][^\]"[]*)\]/g,
      (match, id, label) => {
        if (label.startsWith('"') && label.endsWith('"')) return match;
        return `${id}["${label.replace(/"/g, "'")}"]`;
      }
    );
    // Auto-quote curly-brace (rhombus) nodes with special chars
    code = code.replace(
      /(\b\w[\w-]*)\{([^\}"{}]+[\/\(\)|&<>][^\}"{}]*)\}/g,
      (match, id, label) => {
        if (label.startsWith('"') && label.endsWith('"')) return match;
        return `${id}{"${label.replace(/"/g, "'")}"}`;
      }
    );
  }

  return code.trim();
}

export default function MermaidViewer({ code }) {
  const containerRef = useRef(null);
  const mountedRef = useRef(true);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [renderError, setRenderError] = useState(false);
  const [isEmpty, setIsEmpty] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [isLarge, setIsLarge] = useState(false);

  const reactId = useId();
  const diagramId = `mm_${reactId.replace(/[^a-zA-Z0-9_-]/g, "_")}`;

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!code || !containerRef.current) return;

    ensureMermaidInit(isDark);
    const cleanCode = sanitizeMermaidCode(code);

    const lines = cleanCode.split("\n").filter((l) => l.trim());
    if (lines.length <= 1) {
      setIsEmpty(true);
      return;
    }

    setRenderError(false);
    setIsEmpty(false);
    setZoom(1);
    if (containerRef.current) containerRef.current.innerHTML = "";

    mermaid
      .render(diagramId, cleanCode)
      .then(({ svg }) => {
        if (!mountedRef.current || !containerRef.current) return;
        containerRef.current.innerHTML = svg;

        const svgEl = containerRef.current.querySelector("svg");
        if (svgEl) {
          // Check if actually empty
          const nodes = svgEl.querySelectorAll("path, rect, circle, polygon, text, line, ellipse");
          if (nodes.length === 0) {
            setIsEmpty(true);
            return;
          }

          // Make SVG responsive — remove fixed width/height, use viewBox for scaling
          const w = svgEl.getAttribute("width") || svgEl.viewBox?.baseVal?.width;
          const h = svgEl.getAttribute("height") || svgEl.viewBox?.baseVal?.height;

          // If dimensions exceed the container threshold, mark as "large" for zoom controls
          if ((parseFloat(w) > 700 || parseFloat(h) > 400)) {
            setIsLarge(true);
          }

          // Keep intrinsic dimensions in viewBox but remove hard pixel attrs
          const vb = svgEl.getAttribute("viewBox");
          if (!vb && w && h) {
            svgEl.setAttribute("viewBox", `0 0 ${parseFloat(w)} ${parseFloat(h)}`);
          }
          svgEl.removeAttribute("width");
          svgEl.removeAttribute("height");
          svgEl.style.width = "100%";
          svgEl.style.height = "auto";
          svgEl.style.display = "block";
        }
      })
      .catch((err) => {
        console.warn("[MermaidViewer] Render failed:", err?.message || err);
        if (mountedRef.current) setRenderError(true);
      });
  }, [code, isDark, diagramId]);

  if (isEmpty) {
    return (
      <div className="my-4 rounded-xl border border-border bg-muted/20 p-6 flex flex-col items-center justify-center gap-2 text-center min-h-[80px]">
        <GitBranch className="h-6 w-6 text-muted-foreground/40" />
        <p className="text-xs text-muted-foreground">
          Diagram has no renderable content. Re-synthesize this chapter to generate a fresh diagram.
        </p>
      </div>
    );
  }

  if (renderError) {
    const cleanCode = sanitizeMermaidCode(code);
    return (
      <div className="my-4 rounded-xl border border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20 overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-amber-500/20 bg-amber-100/50 dark:bg-amber-900/20">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="text-[11px] font-mono text-amber-700 dark:text-amber-400">
            Diagram syntax error — showing source
          </span>
        </div>
        <pre className="p-4 text-[11px] font-mono text-amber-900 dark:text-amber-300 overflow-x-auto leading-relaxed whitespace-pre-wrap">
          {cleanCode}
        </pre>
      </div>
    );
  }

  return (
    <div className="my-5 rounded-xl border border-border bg-gradient-to-br from-card to-secondary/20 shadow-sm overflow-hidden">
      {/* Zoom toolbar — only shown when diagram is naturally large */}
      {isLarge && (
        <div className="flex items-center justify-end gap-1 px-3 py-1.5 border-b border-border/60 bg-muted/30">
          <span className="text-[10px] text-muted-foreground font-mono mr-auto">
            Diagram — scroll or zoom to explore
          </span>
          <button
            onClick={() => setZoom((z) => Math.max(0.3, parseFloat((z - 0.15).toFixed(2))))}
            className="h-6 w-6 rounded flex items-center justify-center hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Zoom out"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <span className="text-[10px] font-mono text-muted-foreground w-10 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(2, parseFloat((z + 0.15).toFixed(2))))}
            className="h-6 w-6 rounded flex items-center justify-center hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Zoom in"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setZoom(1)}
            className="h-6 w-6 rounded flex items-center justify-center hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Reset zoom"
          >
            <Maximize2 className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Scrollable diagram viewport — max 480px tall, then scrolls */}
      <div
        className="overflow-auto p-4"
        style={{ maxHeight: isLarge ? "480px" : "none" }}
      >
        <div
          ref={containerRef}
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: "top center",
            transition: "transform 0.15s ease",
          }}
        />
      </div>
    </div>
  );
}

import React, { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { useTheme } from "@/components/theme/ThemeProvider";
import { AlertTriangle, ZoomIn, ZoomOut, Maximize2, Copy, Check } from "lucide-react";

/**
 * Module-level singleton — mermaid.initialize() must only run ONCE per theme.
 */
let _mermaidTheme = null;

// Sequential queue prevents concurrent renders from clobbering Mermaid's shared DOM sandbox
let _renderQueue = Promise.resolve();

function queueRender(renderId, codeToRender) {
  const result = _renderQueue
    .catch(() => {})
    .then(() => mermaid.render(renderId, codeToRender));
  _renderQueue = result.catch(() => {});
  return result;
}

function ensureMermaidInit(isDark) {
  const desired = isDark ? "dark" : "default";
  if (_mermaidTheme === desired) return;
  _mermaidTheme = desired;
  mermaid.initialize({
    startOnLoad: false,
    suppressErrorRendering: true, // Prevents Mermaid from injecting red "Syntax error in text" into DOM
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

/**
 * Converts fragile classDiagram into a robust flowchart TD
 */
function classDiagramToFlowchart(rawCode) {
  const lines = rawCode.split("\n");
  const classes = [];
  const relations = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("classDiagram") || trimmed.startsWith("direction")) continue;

    // Detect class declaration: class user {
    const classMatch = trimmed.match(/^class\s+([a-zA-Z0-9_]+)/i);
    if (classMatch && !trimmed.includes("-->") && !trimmed.includes("--")) {
      const cls = classMatch[1];
      if (!classes.includes(cls)) classes.push(cls);
      continue;
    }

    // Detect relationship: user --> product : seller
    const relMatch = trimmed.match(/^([a-zA-Z0-9_]+)\s*(-->|--|\.\.>|\.\.|<--)\s*([a-zA-Z0-9_]+)(?:\s*:\s*(.*))?$/);
    if (relMatch) {
      const [, from, , to, label] = relMatch;
      relations.push({
        from,
        to,
        label: (label || "").replace(/[".()@]/g, " ").trim(),
      });
      if (!classes.includes(from)) classes.push(from);
      if (!classes.includes(to)) classes.push(to);
      continue;
    }
  }

  if (classes.length === 0) return null;

  let fc = "flowchart TD\n";
  classes.forEach((c) => {
    fc += `    ${c}["${c}"]\n`;
  });
  relations.forEach(({ from, to, label }) => {
    if (label) {
      fc += `    ${from} -->|${label}| ${to}\n`;
    } else {
      fc += `    ${from} --> ${to}\n`;
    }
  });
  return fc;
}

function sanitizeMermaidCode(raw) {
  if (!raw) return "";
  let code = raw.trim();
  code = code.replace(/^```(?:mermaid)?\s*/i, "").replace(/```\s*$/i, "").trim();

  // Remove lines that are markdown image badges
  code = code
    .split("\n")
    .filter((line) => !/^!\[.*\]\(https?:\/\//.test(line.trim()))
    .join("\n");

  const diagType = getDiagramType(code);

  if (diagType === "flowchart") {
    // 1. Strip quotes inside arrow text pipes: -->|"text"| -> -->|text|
    code = code.replace(/(-->|--|-\.->|==>)\s*\|["'](.*?)["']\|/g, '$1|$2|');

    // 2. Clean forbidden tokens inside arrow pipe labels |...|:
    // Parentheses ( ) trigger PS node tokens, @ triggers LINK_ID, brackets [ ] trigger node boxes
    code = code.replace(/\|([^|\n]+)\|/g, (match, label) => {
      const cleanLabel = label
        .replace(/@/g, '')
        .replace(/[()]/g, ' ')
        .replace(/[{}[\]]/g, ' ')
        .replace(/["']/g, '')
        .replace(/\s{2,}/g, ' ')
        .trim();
      return `|${cleanLabel}|`;
    });

    // 3. Auto-quote square-bracket node labels that have special chars and aren't already quoted
    code = code.replace(
      /(\b\w[\w-]*)\[([^\]"[]+[\/\{\}\(\)|&<>][^\]"[]*)\]/g,
      (match, id, label) => {
        if (label.startsWith('"') && label.endsWith('"')) return match;
        return `${id}["${label.replace(/"/g, "'")}"]`;
      }
    );

    // 4. Auto-quote rhombus node labels
    code = code.replace(
      /(\b\w[\w-]*)\{([^\}"{}]+[\/\(\)|&<>][^\}"{}]*)\}/g,
      (match, id, label) => {
        if (label.startsWith('"') && label.endsWith('"')) return match;
        return `${id}{"${label.replace(/"/g, "'")}"}`;
      }
    );
  }

  // Class diagram label sanitization: dots in relationship labels cause parser crash
  if (diagType === "class") {
    code = code
      .split("\n")
      .map((line) => {
        const trimmed = line.trim();
        if (trimmed.includes("-->") || trimmed.includes("--") || trimmed.includes("..>")) {
          const parts = trimmed.split(":");
          if (parts.length === 2) {
            return `${parts[0]}: ${parts[1].replace(/[\.()@]/g, "_").trim()}`;
          }
        }
        return line;
      })
      .join("\n");
  }

  return code.trim();
}

function isSvgValid(svgEl) {
  if (!svgEl) return false;
  if (
    svgEl.getAttribute("aria-roledescription") === "error" ||
    svgEl.classList.contains("error-icon") ||
    svgEl.querySelector(".error-icon") ||
    svgEl.querySelector(".error-text")
  ) {
    return false;
  }
  const nodes = svgEl.querySelectorAll("path, rect, circle, polygon, text, line, ellipse");
  return nodes.length > 0;
}

export default function MermaidViewer({ code }) {
  const containerRef = useRef(null);
  const mountedRef = useRef(true);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const [renderError, setRenderError] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [isLarge, setIsLarge] = useState(false);
  const [copied, setCopied] = useState(false);

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
      setRenderError(true);
      return;
    }

    setRenderError(false);
    setZoom(1);
    if (containerRef.current) containerRef.current.innerHTML = "";

    const attemptRender = (codeToRender, isFallback = false) => {
      const renderId = `mm_${Math.random().toString(36).slice(2, 9)}_${Date.now()}`;

      queueRender(renderId, codeToRender)
        .then(({ svg }) => {
          if (!mountedRef.current || !containerRef.current) return;

          // Check if Mermaid returned an error SVG string before inserting
          if (svg.includes('class="error-text"') || svg.includes('Syntax error in text')) {
            throw new Error("Mermaid error SVG detected");
          }

          containerRef.current.innerHTML = svg;

          const svgEl = containerRef.current.querySelector("svg");
          if (!isSvgValid(svgEl)) {
            if (!isFallback && getDiagramType(codeToRender) === "class") {
              const fallbackFlowchart = classDiagramToFlowchart(codeToRender);
              if (fallbackFlowchart) {
                attemptRender(fallbackFlowchart, true);
                return;
              }
            }
            if (mountedRef.current) setRenderError(true);
            return;
          }

          // Make SVG responsive
          const w = svgEl.getAttribute("width") || svgEl.viewBox?.baseVal?.width;
          const h = svgEl.getAttribute("height") || svgEl.viewBox?.baseVal?.height;

          if (parseFloat(w) > 700 || parseFloat(h) > 400) {
            setIsLarge(true);
          }

          const vb = svgEl.getAttribute("viewBox");
          if (!vb && w && h) {
            svgEl.setAttribute("viewBox", `0 0 ${parseFloat(w)} ${parseFloat(h)}`);
          }
          svgEl.removeAttribute("width");
          svgEl.removeAttribute("height");
          svgEl.style.width = "100%";
          svgEl.style.height = "auto";
          svgEl.style.display = "block";
        })
        .catch((err) => {
          console.warn("[MermaidViewer] Render failed:", err?.message || err);
          if (!isFallback && getDiagramType(codeToRender) === "class") {
            const fallbackFlowchart = classDiagramToFlowchart(codeToRender);
            if (fallbackFlowchart) {
              attemptRender(fallbackFlowchart, true);
              return;
            }
          }
          if (mountedRef.current) setRenderError(true);
        });
    };

    attemptRender(cleanCode, false);
  }, [code, isDark]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (renderError) {
    const clean = sanitizeMermaidCode(code);
    return (
      <div className="my-4 rounded-xl border border-border bg-card shadow-xs overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/40 text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
            <span className="font-mono text-[11px]">Diagram Preview</span>
          </div>
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground hover:text-foreground cursor-pointer px-2 py-0.5 rounded border border-border bg-secondary"
          >
            {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
        </div>
        <pre className="p-4 text-[11px] font-mono text-foreground/80 overflow-x-auto leading-relaxed bg-zinc-950/5 dark:bg-zinc-900/30">
          {clean}
        </pre>
      </div>
    );
  }

  return (
    <div className="my-5 rounded-xl border border-border bg-gradient-to-br from-card to-secondary/20 shadow-sm overflow-hidden">
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

/**
 * Mermaid diagram viewer.
 * Place at: src/components/wiki/MermaidViewer.jsx
 *
 * Rendering and the repair logic (sanitizing, class-diagram fallback) are unchanged.
 * What is new: Dionysus colours for diagrams, an always-visible toolbar (zoom, fit,
 * view source, copy, full screen) and the rendered SVG is kept in state so the same
 * diagram can be shown full screen.
 */
import React, { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { useTheme } from "@/components/theme/ThemeProvider";
import { cn } from "@/lib/utils";
import { AlertTriangle, ZoomIn, ZoomOut, Maximize2, Copy, Check, Code2, X, RotateCcw } from "lucide-react";

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
  const desired = isDark ? "dark" : "light";
  if (_mermaidTheme === desired) return;
  _mermaidTheme = desired;
  mermaid.initialize({
    startOnLoad: false,
    suppressErrorRendering: true, // Prevents Mermaid from injecting red "Syntax error in text" into DOM
    theme: "base", // "base" fully honours the Dionysus palette below
    themeVariables: {
      darkMode: isDark,
      background: "transparent",
      primaryColor: isDark ? "#16302d" : "#DCEBE8",
      primaryTextColor: isDark ? "#FFFFFF" : "#10211F",
      primaryBorderColor: isDark ? "#A8C9C8" : "#17645F",
      lineColor: isDark ? "#7C8685" : "#5B6B68",
      secondaryColor: isDark ? "#0E100F" : "#FAF7F2",
      tertiaryColor: isDark ? "#141716" : "#F3EEE8",
      noteBkgColor: isDark ? "#1A1E1D" : "#FFF1EC",
      noteTextColor: isDark ? "#FFFFFF" : "#10211F",
      fontFamily: "'Bricolage Grotesque', ui-sans-serif, system-ui, sans-serif",
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

const TYPE_LABEL = { flowchart: "Flowchart", sequence: "Sequence diagram", er: "ER diagram", class: "Class diagram", state: "State diagram", other: "Diagram" };

function ToolBtn({ onClick, title, active, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={cn(
        "inline-flex h-7 min-w-7 cursor-pointer items-center justify-center gap-1 rounded-md px-1.5 text-[11px] font-medium transition-colors",
        active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

function MermaidViewer({ code }) {
  const mountedRef = useRef(true);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const [svgHtml, setSvgHtml] = useState("");
  const [renderError, setRenderError] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [isLarge, setIsLarge] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showSource, setShowSource] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!code) return;

    ensureMermaidInit(isDark);
    const cleanCode = sanitizeMermaidCode(code);

    const lines = cleanCode.split("\n").filter((l) => l.trim());
    if (lines.length <= 1) {
      setRenderError(true);
      return;
    }

    setRenderError(false);
    setZoom(1);
    setSvgHtml("");

    const attemptRender = (codeToRender, isFallback = false) => {
      const renderId = `mm_${Math.random().toString(36).slice(2, 9)}_${Date.now()}`;

      queueRender(renderId, codeToRender)
        .then(({ svg }) => {
          if (!mountedRef.current) return;

          // Check if Mermaid returned an error SVG string before using it
          if (svg.includes('class="error-text"') || svg.includes("Syntax error in text")) {
            throw new Error("Mermaid error SVG detected");
          }

          // Work on a detached copy, then keep the result in state
          const tmp = document.createElement("div");
          tmp.innerHTML = svg;
          const svgEl = tmp.querySelector("svg");

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

          setIsLarge(parseFloat(w) > 700 || parseFloat(h) > 400);

          const vb = svgEl.getAttribute("viewBox");
          if (!vb && w && h) {
            svgEl.setAttribute("viewBox", `0 0 ${parseFloat(w)} ${parseFloat(h)}`);
          }
          svgEl.removeAttribute("width");
          svgEl.removeAttribute("height");
          svgEl.style.width = "100%";
          svgEl.style.height = "auto";
          svgEl.style.display = "block";

          setSvgHtml(tmp.innerHTML);
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

  // Esc closes full screen
  useEffect(() => {
    if (!expanded) return;
    const onKey = (e) => e.key === "Escape" && setExpanded(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expanded]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const clean = sanitizeMermaidCode(code);
  const label = TYPE_LABEL[getDiagramType(clean)] || "Diagram";

  /* Source view, also used when a diagram cannot be drawn */
  if (renderError) {
    return (
      <div className="my-6 overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border bg-secondary/60 px-3 py-2">
          <span className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
            <AlertTriangle className="h-3.5 w-3.5 text-accent-amber" />
            Diagram preview unavailable. Showing source.
          </span>
          <ToolBtn onClick={handleCopyCode} title="Copy source">
            {copied ? <Check className="h-3.5 w-3.5 text-accent-emerald" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy"}
          </ToolBtn>
        </div>
        <pre className="overflow-x-auto bg-surface-elevated p-4 font-mono text-[12px] leading-relaxed text-foreground/80">{clean}</pre>
      </div>
    );
  }

  const zoomOut = () => setZoom((z) => Math.max(0.3, parseFloat((z - 0.15).toFixed(2))));
  const zoomIn = () => setZoom((z) => Math.min(2.5, parseFloat((z + 0.15).toFixed(2))));

  const renderToolbar = (full) => (
    <div className="flex items-center gap-1 border-b border-border bg-secondary/60 px-3 py-1.5">
      <span className="mr-auto flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
        <span className="h-1.5 w-1.5 rounded-full bg-highlight" />
        {label}
      </span>
      <ToolBtn onClick={zoomOut} title="Zoom out"><ZoomOut className="h-3.5 w-3.5" /></ToolBtn>
      <span className="w-11 text-center text-[11px] tabular-nums text-muted-foreground">{Math.round(zoom * 100)}%</span>
      <ToolBtn onClick={zoomIn} title="Zoom in"><ZoomIn className="h-3.5 w-3.5" /></ToolBtn>
      <ToolBtn onClick={() => setZoom(1)} title="Reset zoom"><RotateCcw className="h-3.5 w-3.5" /></ToolBtn>
      <span className="mx-1 h-4 w-px bg-border" aria-hidden="true" />
      {!full && (
        <ToolBtn onClick={() => setShowSource((s) => !s)} title="View source" active={showSource}>
          <Code2 className="h-3.5 w-3.5" />
        </ToolBtn>
      )}
      <ToolBtn onClick={handleCopyCode} title="Copy source">
        {copied ? <Check className="h-3.5 w-3.5 text-accent-emerald" /> : <Copy className="h-3.5 w-3.5" />}
      </ToolBtn>
      <ToolBtn onClick={() => setExpanded(!full)} title={full ? "Close full screen" : "Full screen"}>
        {full ? <X className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
      </ToolBtn>
    </div>
  );

  const renderCanvas = (full) => (
    <div
      {...(isLarge || full ? { "data-lenis-prevent": true } : {})}
      className={cn("overflow-auto p-5", full && "flex-1")}
      style={full ? undefined : { maxHeight: isLarge ? "520px" : "none" }}
    >
      {svgHtml ? (
        <div
          dangerouslySetInnerHTML={{ __html: svgHtml }}
          style={{ transform: `scale(${zoom})`, transformOrigin: "top center", transition: "transform 0.15s ease" }}
        />
      ) : (
        <div className="flex h-32 items-center justify-center gap-2 text-xs text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-highlight animate-pulse-dot" />
          Rendering diagram…
        </div>
      )}
    </div>
  );

  return (
    <>
      <figure className="my-6 overflow-hidden rounded-xl border border-border bg-surface-elevated">
        {renderToolbar(false)}
        {renderCanvas(false)}
        {showSource && (
          <pre data-lenis-prevent className="max-h-64 overflow-auto border-t border-border bg-secondary/40 p-4 font-mono text-[12px] leading-relaxed text-foreground/80">
            {clean}
          </pre>
        )}
      </figure>

      {expanded && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background" role="dialog" aria-label={`${label} full screen`}>
          {renderToolbar(true)}
          {renderCanvas(true)}
        </div>
      )}
    </>
  );
}

export default React.memo(MermaidViewer);
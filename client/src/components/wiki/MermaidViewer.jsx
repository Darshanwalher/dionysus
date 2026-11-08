import React, { useEffect, useRef, useId } from "react";
import mermaid from "mermaid";
import { useTheme } from "@/components/theme/ThemeProvider";

/**
 * Module-level singleton: mermaid.initialize() must only be called ONCE per
 * page load. Calling it from inside every component causes each instance to
 * reset the library's global state mid-render, which produces the
 * "error in text / version X.X.X" Mermaid error on pages with multiple diagrams.
 */
let _mermaidTheme = null;

function ensureMermaidInit(isDark) {
  const desired = isDark ? "dark" : "default";
  if (_mermaidTheme === desired) return; // already initialized with this theme
  _mermaidTheme = desired;
  mermaid.initialize({
    startOnLoad: false,
    theme: desired,
    themeVariables: {
      darkMode: isDark,
      background: "transparent",
      primaryColor: isDark ? "#1e293b" : "#f1f5f9",
      primaryTextColor: isDark ? "#f8fafc" : "#0f172a",
      primaryBorderColor: isDark ? "#475569" : "#cbd5e1",
      lineColor: isDark ? "#64748b" : "#94a3b8",
      fontFamily: "'JetBrains Mono', Inter, monospace",
    },
    securityLevel: "loose",
  });
}

/**
 * Sanitizes AI-generated mermaid code blocks.
 * The AI occasionally wraps the diagram in extra backtick fences or adds
 * "mermaid" as the first word on the first content line — strip those out.
 */
function sanitizeMermaidCode(raw) {
  if (!raw) return "";
  let code = raw.trim();
  // Strip wrapping ```mermaid ... ``` if the AI double-wrapped it
  code = code.replace(/^```(?:mermaid)?\s*/i, "").replace(/```\s*$/i, "").trim();
  return code;
}

export default function MermaidViewer({ code }) {
  const containerRef = useRef(null);
  const mountedRef = useRef(true);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  // useId() gives a stable, unique id per component instance (React 18+)
  const reactId = useId();
  // Mermaid IDs must start with a letter and contain only [a-zA-Z0-9_-]
  const diagramId = `mermaid_${reactId.replace(/[^a-zA-Z0-9_-]/g, "_")}`;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!code || !containerRef.current) return;

    ensureMermaidInit(isDark);

    const cleanCode = sanitizeMermaidCode(code);
    if (!cleanCode) return;

    // Clear any previous render
    if (containerRef.current) {
      containerRef.current.innerHTML = "";
    }

    // mermaid.render() returns a Promise — catch rejections properly
    mermaid
      .render(diagramId, cleanCode)
      .then(({ svg }) => {
        if (mountedRef.current && containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      })
      .catch((err) => {
        console.warn("[MermaidViewer] Render failed:", err?.message || err);
        if (mountedRef.current && containerRef.current) {
          containerRef.current.innerHTML = `<pre class="text-xs text-muted-foreground font-mono p-3 bg-secondary rounded overflow-x-auto whitespace-pre-wrap">${cleanCode}</pre>`;
        }
      });
  }, [code, isDark, diagramId]);

  return (
    <div
      ref={containerRef}
      className="my-4 p-4 rounded-xl border border-border bg-card/60 flex items-center justify-center overflow-x-auto shadow-2xs"
    />
  );
}

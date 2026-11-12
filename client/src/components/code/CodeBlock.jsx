/**
 * Read-only Monaco code block.
 * Place at: src/components/code/CodeBlock.jsx
 * Install:  npm i @monaco-editor/react
 *
 * - Monaco only mounts when the block scrolls near the viewport (a long chat history
 *   with many blocks stays fast); until then a plain <pre> holds the same height
 * - height fits the code (up to 420px, then it scrolls inside)
 * - follows the app theme (light / dark) with the Dionysus themes
 * - wheel passes through to the page when the block has nothing to scroll
 */
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import gsap from "gsap";
import { Check, Copy } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";
import { Pop, prefersReduced } from "@/components/motion";
import { MONACO_DARK, MONACO_LIGHT, defineDionysusThemes } from "./monacoThemes";

const LANGS = {
  js: "javascript", javascript: "javascript", jsx: "javascript", mjs: "javascript", cjs: "javascript",
  ts: "typescript", typescript: "typescript", tsx: "typescript",
  py: "python", python: "python",
  sh: "shell", bash: "shell", shell: "shell", zsh: "shell", console: "shell",
  json: "json", html: "html", xml: "xml", css: "css", scss: "scss",
  yml: "yaml", yaml: "yaml", md: "markdown", markdown: "markdown",
  sql: "sql", go: "go", java: "java", rust: "rust", rs: "rust", c: "c", cpp: "cpp", cs: "csharp",
  php: "php", rb: "ruby", ruby: "ruby", dockerfile: "dockerfile", graphql: "graphql",
};

const LINE_HEIGHT = 19;
const MAX_HEIGHT = 420;

const OPTIONS = {
  readOnly: true,
  domReadOnly: true,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  lineNumbers: "on",
  lineNumbersMinChars: 3,
  glyphMargin: false,
  folding: false,
  renderLineHighlight: "none",
  overviewRulerLanes: 0,
  hideCursorInOverviewRuler: true,
  overviewRulerBorder: false,
  fontSize: 12.5,
  lineHeight: LINE_HEIGHT,
  fontFamily: "'IBM Plex Mono', ui-monospace, 'JetBrains Mono', monospace",
  padding: { top: 10, bottom: 10 },
  automaticLayout: true,
  contextmenu: false,
  occurrencesHighlight: "off",
  selectionHighlight: false,
  stickyScroll: { enabled: false },
  guides: { indentation: false },
  scrollbar: {
    vertical: "auto",
    horizontal: "auto",
    verticalScrollbarSize: 8,
    horizontalScrollbarSize: 8,
    alwaysConsumeMouseWheel: false, // let the page scroll when the block is at its end
  },
};

export default function CodeBlock({ code = "", language = "plaintext", animate = false }) {
  const { resolvedTheme } = useTheme();
  const wrap = useRef(null);
  const body = useRef(null);
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  const lang = LANGS[String(language).toLowerCase()] || "plaintext";
  const lines = code.split("\n").length;
  const height = Math.max(56, Math.min(lines * LINE_HEIGHT + 20, MAX_HEIGHT));

  // Mount Monaco only when the block is near the viewport
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "300px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Fresh answers: the code wipes in from the top
  useLayoutEffect(() => {
    if (!animate || !body.current || prefersReduced()) return;
    const t = gsap.fromTo(
      body.current,
      { clipPath: "inset(0 0 100% 0)" },
      { clipPath: "inset(0 0 0% 0)", duration: 0.7, ease: "power3.out", delay: 0.15, clearProps: "clipPath" }
    );
    return () => t.kill();
  }, [animate]);

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const placeholder = (
    <pre className="m-0 overflow-hidden px-4 py-2.5 font-mono text-[12.5px] leading-[19px] text-foreground/80" style={{ height }}>
      {code}
    </pre>
  );

  return (
    <div ref={wrap} data-code data-lenis-prevent className="my-3 overflow-hidden rounded-xl border border-border bg-surface-elevated">
      <div className="flex items-center justify-between border-b border-border bg-secondary/60 px-3 py-1.5">
        <span className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-highlight" />
          {lang === "plaintext" ? "text" : lang}
        </span>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span>{lines} line{lines === 1 ? "" : "s"}</span>
          <button
            type="button"
            onClick={copy}
            className="inline-flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-0.5 transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Copy code"
          >
            {copied ? <Pop><Check className="h-3 w-3 text-accent-emerald" /></Pop> : <Copy className="h-3 w-3" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      <div ref={body} style={{ height }}>
        {visible ? (
          <Editor
            height={height}
            language={lang}
            value={code}
            theme={resolvedTheme === "dark" ? MONACO_DARK : MONACO_LIGHT}
            beforeMount={defineDionysusThemes}
            options={OPTIONS}
            loading={placeholder}
          />
        ) : (
          placeholder
        )}
      </div>
    </div>
  );
}
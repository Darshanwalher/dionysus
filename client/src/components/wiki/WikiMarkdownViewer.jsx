import React from "react";
import MermaidViewer from "./MermaidViewer";

/**
 * Professional Markdown renderer for DeepWiki chapters.
 *
 * Key preprocessing applied before parsing:
 *   • [![alt](img_url)](link_url) linked badges  → img only (the AI's most common badge format)
 *   • <div …> / </div> HTML wrappers             → stripped
 *   • <!-- comments -->                           → stripped
 *
 * Supported block syntax:
 *   • H1 / H2 / H3 / H4
 *   • Horizontal rules (--- / ***)
 *   • Markdown tables
 *   • Fenced code blocks (``` lang)
 *   • Mermaid diagrams (```mermaid)
 *   • Blockquotes (> …)
 *   • Unordered lists (- / * / •)
 *   • Ordered lists (1. 2. …)
 *
 * Supported inline syntax:
 *   • **bold**, *italic*, `code`
 *   • ![alt](url)      → <img> badge
 *   • ![alt]()         → styled text pill (empty-URL badge)
 *   • [text](url)      → <a> link
 */

// ─── Markdown Preprocessor ────────────────────────────────────────────────────

/**
 * Cleans up common AI-generated markdown quirks before we parse line-by-line.
 */
function preprocessMarkdown(content) {
  if (!content) return "";

  // 1. Convert linked badges  [![alt](img_url)](link_url)  →  ![alt](img_url)
  //    The AI frequently generates shield.io badges wrapped in links.
  //    We just want the image for display; drop the outer link wrapper.
  content = content.replace(
    /\[!\[([^\]]*)\]\(([^)]*)\)\]\(([^)]*)\)/g,
    "![$1]($2)"
  );

  // 2. Convert raw HTML <img> tags → markdown image syntax
  //    AI sometimes outputs:  <img src="url" alt="text">  or  <img alt="text" src="url">
  content = content.replace(
    /<img\s+src="([^"]*)"(?:\s+alt="([^"]*)")?[^>]*\/?>/gi,
    (_, src, alt) => `![${alt || "badge"}](${src})`
  );
  content = content.replace(
    /<img\s+alt="([^"]*)"(?:\s+src="([^"]*)")?[^>]*\/?>/gi,
    (_, alt, src) => `![${alt || "badge"}](${src || ""})`
  );

  // 3. Strip bare HTML wrappers that the AI adds around badge rows
  content = content.replace(/^<\/?(?:div|center|p|section)[^>]*>\s*$/gim, "");

  // 4. Strip HTML comments
  content = content.replace(/<!--[\s\S]*?-->/g, "");

  return content;
}

// ─── Inline formatter ─────────────────────────────────────────────────────────

function renderInline(text) {
  if (!text && text !== 0) return null;
  const str = String(text);

  // TOKEN order matters:
  //   1. image with any URL (including empty)  → before link so ![...]() isn't misread
  //   2. link
  //   3. bold, italic, inline-code
  const TOKEN =
    /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|!\[[^\]]*\]\([^)]*\)|\[[^\]]+\]\([^)]+\))/g;

  const parts = str.split(TOKEN);

  return parts.map((part, i) => {
    if (!part) return null;

    // ── Inline code ──
    if (/^`[^`]+`$/.test(part)) {
      return (
        <code
          key={i}
          className="px-1.5 py-0.5 rounded-md bg-muted font-mono text-[11px] text-primary/90 border border-border/50"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    // ── Bold ──
    if (/^\*\*[^*]+\*\*$/.test(part)) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }

    // ── Italic ──
    if (/^\*[^*]+\*$/.test(part)) {
      return (
        <em key={i} className="italic text-foreground/80">
          {part.slice(1, -1)}
        </em>
      );
    }

    // ── Image / Badge: ![alt](url) or ![alt]() ──
    if (/^!\[[^\]]*\]\([^)]*\)$/.test(part)) {
      const altMatch = part.match(/^!\[([^\]]*)\]/);
      const urlMatch = part.match(/\]\(([^)]*)\)$/);
      const alt = altMatch?.[1] || "";
      const url = urlMatch?.[1]?.trim() || "";

      // Empty URL → styled text pill badge
      if (!url) {
        return (
          <span
            key={i}
            className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20 mx-0.5 align-middle"
          >
            {alt}
          </span>
        );
      }

      // Real URL → badge image (hide broken images gracefully)
      return (
        <img
          key={i}
          src={url}
          alt={alt}
          className="inline-block h-5 mr-1 align-middle rounded"
          loading="lazy"
          onError={(e) => {
            // On load error, replace with a text pill
            const span = document.createElement("span");
            span.className =
              "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-muted-foreground border border-border mx-0.5 align-middle";
            span.textContent = alt || "badge";
            e.currentTarget.replaceWith(span);
          }}
        />
      );
    }

    // ── Link: [text](url) ──
    if (/^\[[^\]]+\]\([^)]+\)$/.test(part)) {
      const textMatch = part.match(/^\[([^\]]+)\]/);
      const urlMatch = part.match(/\]\(([^)]+)\)$/);
      if (textMatch && urlMatch) {
        return (
          <a
            key={i}
            href={urlMatch[1]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
          >
            {textMatch[1]}
          </a>
        );
      }
    }

    return part;
  });
}

// ─── Block-level parser ───────────────────────────────────────────────────────

function parseBlocks(content) {
  const blocks = [];
  const lines = content.split("\n");
  let inCode = false;
  let codeLang = "";
  let codeBuffer = [];
  let textBuffer = [];

  const flushText = () => {
    if (textBuffer.length > 0) {
      blocks.push({ type: "text", content: textBuffer.join("\n") });
      textBuffer = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trimStart().startsWith("```")) {
      if (inCode) {
        blocks.push({
          type: codeLang.toLowerCase() === "mermaid" ? "mermaid" : "code",
          lang: codeLang,
          code: codeBuffer.join("\n"),
        });
        inCode = false;
        codeLang = "";
        codeBuffer = [];
      } else {
        flushText();
        inCode = true;
        codeLang = line.trim().replace(/^```/, "").trim();
      }
    } else if (inCode) {
      codeBuffer.push(line);
    } else {
      textBuffer.push(line);
    }
  }
  if (inCode && codeBuffer.length > 0) {
    blocks.push({ type: "code", lang: codeLang, code: codeBuffer.join("\n") });
  }
  flushText();
  return blocks;
}

// ─── Text segment renderer ────────────────────────────────────────────────────

function TextSegment({ content, segIdx }) {
  const lines = content.split("\n");
  const elements = [];
  let tableRows = [];
  let listItems = [];
  let listType = null; // "ul" | "ol"

  const flushTable = (k) => {
    if (tableRows.length === 0) return;
    elements.push(
      <div
        key={`tbl_${segIdx}_${k}`}
        className="my-5 overflow-x-auto rounded-xl border border-border shadow-sm"
      >
        <table className="w-full text-xs text-left font-sans">
          <thead className="bg-muted/60 text-foreground">
            <tr>
              {tableRows[0].map((cell, ci) => (
                <th
                  key={ci}
                  className="px-4 py-2.5 font-semibold tracking-wide border-b border-border border-r last:border-r-0 text-[11px] uppercase"
                >
                  {renderInline(cell)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 bg-card">
            {tableRows.slice(1).map((row, ri) => (
              <tr key={ri} className="hover:bg-muted/30 transition-colors">
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    className="px-4 py-2.5 text-muted-foreground border-r border-border/40 last:border-r-0"
                  >
                    {renderInline(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    tableRows = [];
  };

  const flushList = (k) => {
    if (listItems.length === 0) return;
    if (listType === "ol") {
      elements.push(
        <ol key={`ol_${segIdx}_${k}`} className="my-3 ml-5 space-y-1 list-decimal">
          {listItems}
        </ol>
      );
    } else {
      elements.push(
        <ul key={`ul_${segIdx}_${k}`} className="my-2 space-y-1 list-none">
          {listItems}
        </ul>
      );
    }
    listItems = [];
    listType = null;
  };

  for (let l = 0; l < lines.length; l++) {
    const raw = lines[l];
    const line = raw.trim();

    // ── Skip/convert residual HTML tags (safety net for any the preprocessor missed) ──
    // Raw <img> that slipped through → treat as a badge paragraph
    const rawImgMatch = line.match(/^<img\s+src="([^"]*)"(?:\s+alt="([^"]*)")?[^>]*\/?>/i)
      || line.match(/^<img\s+alt="([^"]*)"\s+src="([^"]*)"[^>]*\/?>/i);
    if (rawImgMatch) {
      const [, a, b] = rawImgMatch;
      // first capture group is src in first pattern, alt in second
      const src = line.includes('src="') ? (line.match(/src="([^"]*)"/)?.[1] || "") : b || "";
      const alt = line.includes('alt="') ? (line.match(/alt="([^"]*)"/)?.[1] || "badge") : "badge";
      if (src) {
        elements.push(
          <p key={`img_${segIdx}_${l}`} className="my-2">
            <img
              src={src}
              alt={alt}
              className="inline-block h-5 mr-1 align-middle rounded"
              loading="lazy"
              onError={(e) => { e.currentTarget.style.display = "none"; }}
            />
          </p>
        );
      }
      continue;
    }
    if (/^<\/?(?:div|span|center|p|br|hr|section)[^>]*>$/i.test(line)) continue;

    // ── Empty line ──
    if (!line) {
      flushTable(l);
      flushList(l);
      elements.push(<div key={`sp_${segIdx}_${l}`} className="h-2" />);
      continue;
    }

    // ── Horizontal rule ──
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line)) {
      flushTable(l);
      flushList(l);
      elements.push(
        <hr key={`hr_${segIdx}_${l}`} className="my-5 border-border/50" />
      );
      continue;
    }

    // ── Table rows ──
    if (line.startsWith("|") && line.endsWith("|")) {
      flushList(l);
      if (/^\|([\s:|-]+\|)+$/.test(line)) continue; // separator
      const cells = line.split("|").slice(1, -1).map((c) => c.trim());
      tableRows.push(cells);
      continue;
    } else {
      flushTable(l);
    }

    // ── Headings ──
    if (line.startsWith("#### ")) {
      flushList(l);
      elements.push(
        <h4
          key={`h4_${segIdx}_${l}`}
          className="text-[11px] font-bold text-foreground/70 uppercase tracking-widest mt-5 mb-1.5"
        >
          {renderInline(line.slice(5))}
        </h4>
      );
      continue;
    }
    if (line.startsWith("### ")) {
      flushList(l);
      elements.push(
        <h3
          key={`h3_${segIdx}_${l}`}
          className="text-sm font-bold text-foreground mt-6 mb-2 flex items-center gap-2"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-primary/60 shrink-0" />
          {renderInline(line.slice(4))}
        </h3>
      );
      continue;
    }
    if (line.startsWith("## ")) {
      flushList(l);
      elements.push(
        <h2
          key={`h2_${segIdx}_${l}`}
          className="text-base font-bold text-foreground mt-7 mb-2.5 pb-2 border-b border-border/60 flex items-center gap-2.5"
        >
          <span className="h-2 w-2 rounded-full bg-primary/70 shrink-0" />
          {renderInline(line.slice(3))}
        </h2>
      );
      continue;
    }
    if (line.startsWith("# ")) {
      flushList(l);
      elements.push(
        <h1
          key={`h1_${segIdx}_${l}`}
          className="text-xl font-extrabold text-foreground mt-2 mb-4 pb-3 border-b-2 border-primary/30 tracking-tight"
        >
          {renderInline(line.slice(2))}
        </h1>
      );
      continue;
    }

    // ── Blockquote ──
    if (line.startsWith("> ")) {
      flushList(l);
      elements.push(
        <blockquote
          key={`bq_${segIdx}_${l}`}
          className="my-3 pl-4 py-2 border-l-[3px] border-primary/40 bg-primary/5 rounded-r-lg italic text-sm text-muted-foreground"
        >
          {renderInline(line.slice(2))}
        </blockquote>
      );
      continue;
    }

    // ── Ordered list ──
    const olMatch = line.match(/^(\d+)\.\s+(.*)/);
    if (olMatch) {
      if (listType === "ul") flushList(l);
      listType = "ol";
      listItems.push(
        <li
          key={`oli_${segIdx}_${l}`}
          className="text-sm text-muted-foreground leading-relaxed"
        >
          {renderInline(olMatch[2])}
        </li>
      );
      continue;
    }

    // ── Unordered list ──
    const ulMatch = line.match(/^[-*•]\s+(.*)/);
    if (ulMatch) {
      if (listType === "ol") flushList(l);
      listType = "ul";
      listItems.push(
        <li
          key={`uli_${segIdx}_${l}`}
          className="flex items-start gap-2 text-sm text-muted-foreground leading-relaxed"
        >
          <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary/50 shrink-0" />
          <span>{renderInline(ulMatch[1])}</span>
        </li>
      );
      continue;
    }

    flushList(l);

    // ── Paragraph (may contain inline badges/images) ──
    elements.push(
      <p
        key={`p_${segIdx}_${l}`}
        className="text-sm text-muted-foreground leading-relaxed my-1.5 flex flex-wrap items-center gap-1"
      >
        {renderInline(line)}
      </p>
    );
  }

  flushTable(lines.length);
  flushList(lines.length);

  return <div>{elements}</div>;
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function WikiMarkdownViewer({ content }) {
  if (!content) {
    return (
      <div className="text-sm text-muted-foreground italic py-12 text-center">
        No chapter content available.
      </div>
    );
  }

  const processed = preprocessMarkdown(content);
  const blocks = parseBlocks(processed);

  return (
    <div className="max-w-none text-foreground select-text font-sans leading-relaxed">
      {blocks.map((block, idx) => {
        if (block.type === "mermaid") {
          return <MermaidViewer key={`mermaid_${idx}`} code={block.code} />;
        }

        if (block.type === "code") {
          return (
            <div
              key={`code_${idx}`}
              className="my-4 rounded-xl border border-border bg-zinc-950/5 dark:bg-zinc-900/40 overflow-hidden shadow-sm font-mono"
            >
              {block.lang && (
                <div className="flex items-center px-4 py-2 bg-muted/40 border-b border-border/60">
                  <span className="text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-widest">
                    {block.lang}
                  </span>
                </div>
              )}
              <pre className="p-4 text-[12px] text-foreground/90 overflow-x-auto leading-relaxed">
                <code>{block.code}</code>
              </pre>
            </div>
          );
        }

        return (
          <TextSegment key={`text_${idx}`} content={block.content} segIdx={idx} />
        );
      })}
    </div>
  );
}

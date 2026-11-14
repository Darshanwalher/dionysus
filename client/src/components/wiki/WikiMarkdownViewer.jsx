/**
 * Markdown renderer for DeepWiki chapters (documentation-style typography).
 * Place at: src/components/wiki/WikiMarkdownViewer.jsx
 *
 * Changes from before:
 * - headings get ids (and a hover "#" link) so the page can build an outline and jump to them
 * - paragraphs are real inline text (the old flex paragraphs broke spacing around inline code and links)
 * - code blocks use the Monaco CodeBlock (same as the Q&A page); Mermaid uses MermaidViewer
 * - export extractHeadings(markdown) returns [{ id, text, level }] for the outline
 */
import { memo, useMemo } from "react";
import MermaidViewer from "./MermaidViewer";
import CodeBlock from "@/components/code/CodeBlock";
import { scrollToTarget } from "@/components/motion/SmoothScroll";
import { cn } from "@/lib/utils";

// ─── Markdown preprocessor ───────────────────────────────────────────────────
function preprocessMarkdown(content) {
  if (!content) return "";
  // [![alt](img)](link) badges → ![alt](img)
  content = content.replace(/\[!\[([^\]]*)\]\(([^)]*)\)\]\(([^)]*)\)/g, "![$1]($2)");
  // raw <img> tags → markdown images
  content = content.replace(/<img\s+src="([^"]*)"(?:\s+alt="([^"]*)")?[^>]*\/?>/gi, (_, src, alt) => `![${alt || "badge"}](${src})`);
  content = content.replace(/<img\s+alt="([^"]*)"(?:\s+src="([^"]*)")?[^>]*\/?>/gi, (_, alt, src) => `![${alt || "badge"}](${src || ""})`);
  // bare HTML wrappers + comments
  content = content.replace(/^<\/?(?:div|center|p|section)[^>]*>\s*$/gim, "");
  content = content.replace(/<!--[\s\S]*?-->/g, "");
  return content;
}

// ─── Inline formatter ────────────────────────────────────────────────────────
function renderInline(text) {
  if (!text && text !== 0) return null;
  const TOKEN = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|!\[[^\]]*\]\([^)]*\)|\[[^\]]+\]\([^)]+\))/g;
  return String(text).split(TOKEN).map((part, i) => {
    if (!part) return null;

    if (/^`[^`]+`$/.test(part)) {
      return (
        <code key={i} className="rounded-md border border-border bg-secondary px-1.5 py-0.5 font-mono text-[0.85em] text-foreground">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (/^\*\*[^*]+\*\*$/.test(part)) {
      return <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
    }
    if (/^\*[^*]+\*$/.test(part)) {
      return <em key={i} className="italic">{part.slice(1, -1)}</em>;
    }
    if (/^!\[[^\]]*\]\([^)]*\)$/.test(part)) {
      const alt = part.match(/^!\[([^\]]*)\]/)?.[1] || "";
      const url = part.match(/\]\(([^)]*)\)$/)?.[1]?.trim() || "";
      if (!url) {
        return (
          <span key={i} className="mx-0.5 inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 align-middle text-[11px] font-semibold text-primary">
            {alt}
          </span>
        );
      }
      return (
        <img
          key={i}
          src={url}
          alt={alt}
          loading="lazy"
          className="mr-1 inline-block h-5 rounded align-middle"
          onError={(e) => {
            const span = document.createElement("span");
            span.className = "mx-0.5 inline-flex items-center rounded-full border border-border bg-secondary px-2 py-0.5 align-middle text-[11px] font-semibold text-muted-foreground";
            span.textContent = alt || "badge";
            e.currentTarget.replaceWith(span);
          }}
        />
      );
    }
    if (/^\[[^\]]+\]\([^)]+\)$/.test(part)) {
      const label = part.match(/^\[([^\]]+)\]/)?.[1];
      const href = part.match(/\]\(([^)]+)\)$/)?.[1];
      if (label && href) {
        return (
          <a key={i} href={href} target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline decoration-primary/30 underline-offset-2 transition-colors hover:decoration-primary">
            {label}
          </a>
        );
      }
    }
    return part;
  });
}

// ─── Block parser ────────────────────────────────────────────────────────────
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

  for (const line of lines) {
    if (line.trimStart().startsWith("```")) {
      if (inCode) {
        blocks.push({ type: codeLang.toLowerCase() === "mermaid" ? "mermaid" : "code", lang: codeLang, code: codeBuffer.join("\n") });
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
  if (inCode && codeBuffer.length > 0) blocks.push({ type: "code", lang: codeLang, code: codeBuffer.join("\n") });
  flushText();
  return blocks;
}

// ─── Heading ids (deterministic, shared by the viewer and the outline) ───────
const plain = (t) =>
  t.replace(/!\[[^\]]*\]\([^)]*\)/g, "").replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/[`*_]/g, "").trim();
const slugify = (t) => plain(t).toLowerCase().replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-") || "section";

function collectHeadings(blocks) {
  const seen = {};
  const ids = {};
  const list = [];
  blocks.forEach((b, bi) => {
    if (b.type !== "text") return;
    b.content.split("\n").forEach((raw, li) => {
      const m = raw.trim().match(/^(#{1,4})\s+(.*)/);
      if (!m) return;
      const base = slugify(m[2]);
      const n = (seen[base] = (seen[base] || 0) + 1);
      const id = n === 1 ? base : `${base}-${n}`;
      ids[`${bi}:${li}`] = id;
      list.push({ id, text: plain(m[2]), level: m[1].length });
    });
  });
  return { ids, list };
}

/** Outline for the page's "On this page" panel. */
export function extractHeadings(markdown) {
  return collectHeadings(parseBlocks(preprocessMarkdown(markdown || ""))).list;
}

// ─── Headings ────────────────────────────────────────────────────────────────
const HEADING_STYLE = {
  1: "mb-5 mt-2 text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl",
  2: "mb-3 mt-12 border-b border-border pb-2 text-xl font-bold tracking-tight text-foreground",
  3: "mb-2 mt-8 text-base font-semibold text-foreground",
  4: "mb-1.5 mt-6 text-sm font-semibold text-foreground/80",
};

function Heading({ level, id, children }) {
  const Tag = `h${level}`;
  const jump = (e) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) scrollToTarget(el);
  };
  return (
    <Tag id={id} className={cn("group relative scroll-mt-24", HEADING_STYLE[level])}>
      {children}
      {level > 1 && (
        <a
          href={`#${id}`}
          onClick={jump}
          aria-label="Link to this section"
          className="ml-2 text-text-muted opacity-0 transition-opacity hover:text-primary group-hover:opacity-100 focus:opacity-100"
        >
          #
        </a>
      )}
    </Tag>
  );
}

// ─── Text segment ────────────────────────────────────────────────────────────
function TextSegment({ content, segIdx, ids }) {
  const lines = content.split("\n");
  const out = [];
  let tableRows = [];
  let listItems = [];
  let listType = null;

  const flushTable = (k) => {
    if (!tableRows.length) return;
    out.push(
      <div key={`tbl_${segIdx}_${k}`} className="my-6 overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-left text-[13px]">
          <thead className="bg-secondary text-foreground">
            <tr>
              {tableRows[0].map((cell, ci) => (
                <th key={ci} className="border-b border-border px-4 py-2.5 text-xs font-semibold">
                  {renderInline(cell)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {tableRows.slice(1).map((row, ri) => (
              <tr key={ri} className="transition-colors hover:bg-secondary/40">
                {row.map((cell, ci) => (
                  <td key={ci} className="px-4 py-2.5 align-top text-foreground/80">
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
    if (!listItems.length) return;
    out.push(
      listType === "ol" ? (
        <ol key={`ol_${segIdx}_${k}`} className="my-4 ml-5 list-decimal space-y-1.5 marker:text-text-muted">
          {listItems}
        </ol>
      ) : (
        <ul key={`ul_${segIdx}_${k}`} className="my-4 space-y-1.5">
          {listItems}
        </ul>
      )
    );
    listItems = [];
    listType = null;
  };

  for (let l = 0; l < lines.length; l++) {
    const line = lines[l].trim();

    // stray raw <img> lines
    const rawImg = line.match(/^<img\s+[^>]*>/i);
    if (rawImg) {
      const src = line.match(/src="([^"]*)"/)?.[1] || "";
      const alt = line.match(/alt="([^"]*)"/)?.[1] || "badge";
      if (src) {
        out.push(
          <p key={`img_${segIdx}_${l}`} className="my-3">
            <img src={src} alt={alt} loading="lazy" className="mr-1 inline-block h-5 rounded align-middle" onError={(e) => (e.currentTarget.style.display = "none")} />
          </p>
        );
      }
      continue;
    }
    if (/^<\/?(?:div|span|center|p|br|hr|section)[^>]*>$/i.test(line)) continue;

    if (!line) {
      flushTable(l);
      flushList(l);
      continue;
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line)) {
      flushTable(l);
      flushList(l);
      out.push(<hr key={`hr_${segIdx}_${l}`} className="my-8 border-border" />);
      continue;
    }

    if (line.startsWith("|") && line.endsWith("|")) {
      flushList(l);
      if (/^\|([\s:|-]+\|)+$/.test(line)) continue;
      tableRows.push(line.split("|").slice(1, -1).map((c) => c.trim()));
      continue;
    } else {
      flushTable(l);
    }

    const h = line.match(/^(#{1,4})\s+(.*)/);
    if (h) {
      flushList(l);
      const level = h[1].length;
      out.push(
        <Heading key={`h_${segIdx}_${l}`} level={level} id={ids[`${segIdx}:${l}`]}>
          {renderInline(h[2])}
        </Heading>
      );
      continue;
    }

    if (line.startsWith("> ")) {
      flushList(l);
      out.push(
        <blockquote key={`bq_${segIdx}_${l}`} className="my-5 rounded-r-xl border-l-[3px] border-highlight bg-secondary/60 px-4 py-3 text-[14px] leading-relaxed text-foreground/80">
          {renderInline(line.slice(2))}
        </blockquote>
      );
      continue;
    }

    const ol = line.match(/^(\d+)\.\s+(.*)/);
    if (ol) {
      if (listType === "ul") flushList(l);
      listType = "ol";
      listItems.push(
        <li key={`oli_${segIdx}_${l}`} className="pl-1 text-base leading-7 text-foreground/85">
          {renderInline(ol[2])}
        </li>
      );
      continue;
    }

    const ul = line.match(/^[-*•]\s+(.*)/);
    if (ul) {
      if (listType === "ol") flushList(l);
      listType = "ul";
      listItems.push(
        <li key={`uli_${segIdx}_${l}`} className="flex items-start gap-3 text-base leading-7 text-foreground/85">
          <span className="mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
          <span className="min-w-0">{renderInline(ul[1])}</span>
        </li>
      );
      continue;
    }

    flushList(l);

    // a line made only of badges stays in a row; everything else is a normal paragraph
    const badgesOnly = /^(!\[[^\]]*\]\([^)]*\)\s*)+$/.test(line);
    out.push(
      <p key={`p_${segIdx}_${l}`} className={cn("my-4 text-base leading-7 text-foreground/85", badgesOnly && "flex flex-wrap items-center gap-1.5")}>
        {renderInline(line)}
      </p>
    );
  }

  flushTable(lines.length);
  flushList(lines.length);
  return <div>{out}</div>;
}

// ─── Main component ──────────────────────────────────────────────────────────
function WikiMarkdownViewer({ content }) {
  const { blocks, ids } = useMemo(() => {
    const b = parseBlocks(preprocessMarkdown(content || ""));
    return { blocks: b, ids: collectHeadings(b).ids };
  }, [content]);

  if (!content) {
    return <div className="py-12 text-center text-sm italic text-muted-foreground">No chapter content available.</div>;
  }

  return (
    <div className="max-w-none select-text text-foreground">
      {blocks.map((block, idx) => {
        if (block.type === "mermaid") return <MermaidViewer key={`mermaid_${idx}`} code={block.code} />;
        if (block.type === "code") return <CodeBlock key={`code_${idx}`} code={block.code} language={block.lang || "plaintext"} />;
        return <TextSegment key={`text_${idx}`} content={block.content} segIdx={idx} ids={ids} />;
      })}
    </div>
  );
}

export default memo(WikiMarkdownViewer);
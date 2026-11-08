import React from "react";
import MermaidViewer from "./MermaidViewer";

/**
 * Lightweight, robust markdown parser and renderer for DeepWiki
 * Supports:
 * - H1, H2, H3, H4
 * - Markdown tables
 * - Code blocks & syntax formatting
 * - Embedded Mermaid diagrams (```mermaid ... ```)
 * - Blockquotes, bullet lists, ordered lists, inline code, bold, links
 */
export default function WikiMarkdownViewer({ content }) {
  if (!content) {
    return (
      <div className="text-xs text-muted-foreground italic py-8 text-center">
        No chapter content available.
      </div>
    );
  }

  // Parse blocks: detect ```mermaid and standard ```code blocks
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
    if (line.startsWith("```")) {
      if (inCode) {
        // closing code block
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
        codeLang = line.replace(/```/, "").trim();
      }
    } else if (inCode) {
      codeBuffer.push(line);
    } else {
      textBuffer.push(line);
    }
  }
  flushText();

  // Helper to render markdown text elements into styled HTML elements
  const renderTextSegment = (text, idx) => {
    const subLines = text.split("\n");
    const elements = [];
    let inTable = false;
    let tableRows = [];

    const flushTable = (k) => {
      if (tableRows.length > 0) {
        elements.push(
          <div key={`tbl_${k}`} className="my-4 overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-xs text-left divide-y divide-border font-sans">
              <thead className="bg-secondary/60 text-foreground font-semibold">
                <tr>
                  {tableRows[0].map((cell, cIdx) => (
                    <th key={cIdx} className="px-3 py-2 border-r border-border last:border-r-0">
                      {cell}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 bg-card">
                {tableRows.slice(1).map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-secondary/40 transition-colors">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="px-3 py-2 text-muted-foreground border-r border-border/60 last:border-r-0">
                        {renderInlineFormatting(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        tableRows = [];
        inTable = false;
      }
    };

    for (let l = 0; l < subLines.length; l++) {
      const line = subLines[l].trim();

      // Table row detection
      if (line.startsWith("|") && line.endsWith("|")) {
        // Skip separator row |---|---|
        if (/^\|(\s*[-:]+\s*\|)+$/.test(line)) {
          continue;
        }
        const cells = line
          .split("|")
          .slice(1, -1)
          .map((c) => c.trim());
        inTable = true;
        tableRows.push(cells);
        continue;
      } else if (inTable) {
        flushTable(l);
      }

      if (!line) {
        elements.push(<div key={`sp_${l}`} className="h-2" />);
        continue;
      }

      // Headings
      if (line.startsWith("# ")) {
        elements.push(
          <h1 key={`h1_${l}`} className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground mt-6 mb-2 border-b border-border pb-2">
            {renderInlineFormatting(line.replace(/^#\s+/, ""))}
          </h1>
        );
      } else if (line.startsWith("## ")) {
        elements.push(
          <h2 key={`h2_${l}`} className="text-base sm:text-lg font-bold tracking-tight text-foreground mt-5 mb-2 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary/70 shrink-0" />
            <span>{renderInlineFormatting(line.replace(/^##\s+/, ""))}</span>
          </h2>
        );
      } else if (line.startsWith("### ")) {
        elements.push(
          <h3 key={`h3_${l}`} className="text-sm font-semibold text-foreground mt-4 mb-1.5">
            {renderInlineFormatting(line.replace(/^###\s+/, ""))}
          </h3>
        );
      } else if (line.startsWith("> ")) {
        elements.push(
          <blockquote key={`bq_${l}`} className="border-l-2 border-primary pl-3 my-2 text-xs italic text-muted-foreground bg-secondary/20 py-1.5 rounded-r">
            {renderInlineFormatting(line.replace(/^>\s+/, ""))}
          </blockquote>
        );
      } else if (line.startsWith("- ") || line.startsWith("* ")) {
        elements.push(
          <li key={`li_${l}`} className="text-xs text-muted-foreground ml-4 list-disc leading-relaxed my-0.5">
            {renderInlineFormatting(line.replace(/^[-*]\s+/, ""))}
          </li>
        );
      } else {
        elements.push(
          <p key={`p_${l}`} className="text-xs text-muted-foreground leading-relaxed my-1">
            {renderInlineFormatting(line)}
          </p>
        );
      }
    }
    flushTable(subLines.length);

    return <div key={`text_blk_${idx}`}>{elements}</div>;
  };

  const renderInlineFormatting = (text) => {
    // Bold, inline code, links
    const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code key={i} className="px-1.5 py-0.5 rounded bg-secondary font-mono text-[11px] text-foreground border border-border/60">
            {part.slice(1, -1)}
          </code>
        );
      }
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="font-bold text-foreground">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <div className="space-y-4 max-w-none text-foreground select-text font-sans leading-relaxed">
      {blocks.map((block, idx) => {
        if (block.type === "mermaid") {
          return <MermaidViewer key={idx} code={block.code} />;
        }
        if (block.type === "code") {
          return (
            <div key={idx} className="my-3 rounded-xl border border-border bg-sidebar overflow-hidden shadow-2xs font-mono">
              {block.lang && (
                <div className="px-3 py-1.5 bg-secondary/50 border-b border-border/70 text-[10px] text-muted-foreground uppercase flex items-center justify-between">
                  <span>{block.lang}</span>
                </div>
              )}
              <pre className="p-3 text-[11px] text-foreground/90 overflow-x-auto leading-relaxed">
                <code>{block.code}</code>
              </pre>
            </div>
          );
        }
        return renderTextSegment(block.content, idx);
      })}
    </div>
  );
}


/**
 * Renders an AI answer (HTML) and swaps every <pre><code> block for a Monaco CodeBlock.
 * Place at: src/components/code/RichAnswer.jsx
 *
 * `animate` is for a freshly generated answer: its paragraphs and code blocks rise in one by one.
 * Security: the HTML is rendered as-is, like before. If answers can contain untrusted HTML,
 * sanitize it first (for example with DOMPurify) before passing it in.
 */
import { memo, useLayoutEffect, useMemo, useRef } from "react";
import gsap from "gsap";
import { prefersReduced } from "@/components/motion";
import CodeBlock from "./CodeBlock";

const TOKEN = /§§CODE_(\d+)§§/;

function splitAnswer(html) {
  if (typeof DOMParser === "undefined") return [{ type: "html", html }];
  const doc = new DOMParser().parseFromString(`<div id="root">${html}</div>`, "text/html");
  const root = doc.getElementById("root");
  const blocks = [];

  root.querySelectorAll("pre").forEach((pre) => {
    const codeEl = pre.querySelector("code");
    const cls = `${codeEl?.className || ""} ${pre.className || ""}`;
    const m = cls.match(/(?:language|lang)-([\w+#-]+)/i);
    const language = m?.[1] || pre.getAttribute("data-language") || "plaintext";
    const code = (codeEl || pre).textContent.replace(/\n$/, "");
    blocks.push({ type: "code", code, language });
    pre.replaceWith(doc.createTextNode(`§§CODE_${blocks.length - 1}§§`));
  });

  return root.innerHTML
    .split(/(§§CODE_\d+§§)/)
    .filter((part) => part.trim() !== "")
    .map((part) => {
      const t = part.match(TOKEN);
      return t ? blocks[Number(t[1])] : { type: "html", html: part };
    });
}

function RichAnswer({ html = "", animate = false, className }) {
  const ref = useRef(null);
  const parts = useMemo(() => splitAnswer(html || ""), [html]);

  useLayoutEffect(() => {
    if (!animate || !ref.current || prefersReduced()) return;
    const ctx = gsap.context(() => {
      gsap.from("[data-seg] > *, [data-code]", {
        opacity: 0,
        y: 10,
        duration: 0.45,
        stagger: 0.07,
        ease: "power2.out",
        delay: 0.1,
      });
    }, ref);
    return () => ctx.revert();
  }, [animate]);

  return (
    <div ref={ref} className={className}>
      {parts.map((p, i) =>
        p.type === "code" ? (
          <CodeBlock key={i} code={p.code} language={p.language} animate={animate} />
        ) : (
          <div
            key={i}
            data-seg
            className="prose max-w-none text-[13px] leading-relaxed text-foreground [&_a]:text-primary [&_code]:rounded [&_code]:bg-secondary [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[12px] [&_ol]:my-2 [&_p]:my-2 [&_ul]:my-2"
            dangerouslySetInnerHTML={{ __html: p.html }}
          />
        )
      )}
    </div>
  );
}

export default memo(RichAnswer);
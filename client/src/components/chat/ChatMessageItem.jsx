import React, { memo, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setReplyingTo } from "../../store/slices/chatSlice";
import { Sparkles, Reply, Smile, FileCode, CornerDownRight, Copy, Check } from "lucide-react";
import CodeBlock from "../code/CodeBlock";
import { cn } from "../../lib/utils";

const EMOJI_OPTIONS = ["👍", "❤️", "🚀", "🔥", "👀"];

const AVATAR_TONES = [
  "bg-sky-500/15 text-sky-600 dark:text-sky-300",
  "bg-violet-500/15 text-violet-600 dark:text-violet-300",
  "bg-amber-500/15 text-amber-600 dark:text-amber-300",
  "bg-rose-500/15 text-rose-600 dark:text-rose-300",
  "bg-teal-500/15 text-teal-600 dark:text-teal-300",
  "bg-indigo-500/15 text-indigo-600 dark:text-indigo-300",
];

function toneFor(name = "") {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_TONES[h % AVATAR_TONES.length];
}

function formatTime(dateStr) {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  } catch {
    return "";
  }
}

const baseName = (p = "") => p.split("/").pop() || p;

/* ───────────── lightweight markdown ───────────── */

function parseBlocks(src = "") {
  const lines = src.replace(/\r\n/g, "\n").split("\n");
  const out = [];
  let i = 0;
  const isBlockStart = (l) => /^(\s*```|#{1,4}\s|\s*[-*•]\s+|\s*\d+[.)]\s+|>\s?)/.test(l);

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }

    // fenced code
    if (/^\s*```/.test(line)) {
      const t = line.trim();
      if (t.length > 6 && t.endsWith("```")) {
        out.push({ t: "code", lang: "plaintext", code: t.slice(3, -3).trim() });
        i++;
        continue;
      }
      const lang = t.slice(3).trim().split(/\s/)[0] || "plaintext";
      const buf = [];
      i++;
      while (i < lines.length && !/^\s*```\s*$/.test(lines[i])) {
        buf.push(lines[i]);
        i++;
      }
      i++; // closing fence (or end of text while streaming)
      out.push({ t: "code", lang, code: buf.join("\n") });
      continue;
    }

    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      out.push({ t: "h", level: h[1].length, text: h[2] });
      i++;
      continue;
    }

    if (/^\s*[-*•]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*[-*•]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*•]\s+/, ""));
        i++;
      }
      out.push({ t: "ul", items });
      continue;
    }

    if (/^\s*\d+[.)]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+[.)]\s+/, ""));
        i++;
      }
      out.push({ t: "ol", items });
      continue;
    }

    if (/^>\s?/.test(line)) {
      const buf = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        buf.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      out.push({ t: "quote", text: buf.join("\n") });
      continue;
    }

    const buf = [line];
    i++;
    while (i < lines.length && lines[i].trim() && !isBlockStart(lines[i])) {
      buf.push(lines[i]);
      i++;
    }
    out.push({ t: "p", lines: buf });
  }
  return out;
}

const TOKEN = /(`[^`]+`|@dionysus|#[a-zA-Z0-9_\-./]+\.[a-zA-Z0-9]+|\*\*[^*]+\*\*|\*[^*\n]+\*)/g;

function inline(text) {
  if (!text) return null;
  return text.split(TOKEN).map((seg, i) => {
    if (!seg) return null;
    if (seg === "@dionysus") {
      return (
        <span key={i} className="inline-flex items-center gap-1 rounded-md bg-primary/15 px-1.5 py-0.5 align-baseline text-[12px] font-medium text-primary">
          <Sparkles className="h-3 w-3" />
          dionysus
        </span>
      );
    }
    if (seg.startsWith("#") && seg.includes(".") && seg.length > 2) {
      return (
        <span key={i} title={seg.slice(1)} className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-secondary px-1.5 py-0.5 align-baseline font-mono text-[11.5px] text-foreground/80">
          <FileCode className="h-3 w-3 text-accent-cyan" />
          {baseName(seg.slice(1))}
        </span>
      );
    }
    if (/^`[^`]+`$/.test(seg)) {
      return (
        <code key={i} className="rounded border border-border bg-secondary/80 px-1.5 py-0.5 font-mono text-[12px] text-foreground">
          {seg.slice(1, -1)}
        </code>
      );
    }
    if (/^\*\*[^*]+\*\*$/.test(seg)) {
      return <strong key={i} className="font-semibold text-foreground">{seg.slice(2, -2)}</strong>;
    }
    if (/^\*[^*\n]+\*$/.test(seg)) {
      return <em key={i} className="italic">{seg.slice(1, -1)}</em>;
    }
    return seg;
  });
}

function RichText({ content }) {
  const blocks = useMemo(() => parseBlocks(content), [content]);
  if (!blocks.length) return null;

  return (
    <div className="space-y-2.5 break-words text-[13.5px] leading-relaxed">
      {blocks.map((b, i) => {
        switch (b.t) {
          case "h":
            return (
              <h4
                key={i}
                className={cn(
                  "font-semibold tracking-tight text-foreground",
                  b.level <= 2 ? "pt-1 text-[15px]" : "text-[13.5px]"
                )}
              >
                {inline(b.text)}
              </h4>
            );
          case "ul":
            return (
              <ul key={i} className="list-disc space-y-1 pl-5 marker:text-muted-foreground">
                {b.items.map((it, j) => <li key={j}>{inline(it)}</li>)}
              </ul>
            );
          case "ol":
            return (
              <ol key={i} className="list-decimal space-y-1 pl-5 marker:text-muted-foreground">
                {b.items.map((it, j) => <li key={j}>{inline(it)}</li>)}
              </ol>
            );
          case "quote":
            return (
              <blockquote key={i} className="border-l-2 border-primary/40 pl-3 text-muted-foreground">
                {inline(b.text)}
              </blockquote>
            );
          case "code":
            return (
              <div key={i} className="my-1 overflow-hidden rounded-xl border border-border">
                <CodeBlock code={b.code} language={b.lang} />
              </div>
            );
          default:
            return (
              <p key={i}>
                {b.lines.map((l, j) => (
                  <React.Fragment key={j}>
                    {j > 0 && <br />}
                    {inline(l)}
                  </React.Fragment>
                ))}
              </p>
            );
        }
      })}
    </div>
  );
}

/* ───────────── pieces ───────────── */

function Avatar({ name, avatar, isAI }) {
  if (isAI) {
    return (
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-accent-cyan text-primary-foreground shadow-sm">
        <Sparkles className="h-4 w-4" />
      </div>
    );
  }
  return (
    <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full text-[11px] font-semibold", toneFor(name))}>
      {avatar ? (
        <img src={avatar} alt={name} className="h-full w-full object-cover" />
      ) : (
        (name || "U").slice(0, 2).toUpperCase()
      )}
    </div>
  );
}

function Sources({ files }) {
  if (!files?.length) return null;
  return (
    <div className="mb-3 flex flex-wrap items-center gap-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Sources</span>
      {files.map((file, i) => (
        <span
          key={file + i}
          title={file}
          className="inline-flex max-w-[190px] items-center gap-1 rounded-md border border-border/70 bg-secondary/70 px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <FileCode className="h-3 w-3 shrink-0 text-accent-cyan" />
          <span className="truncate">{baseName(file)}</span>
        </span>
      ))}
    </div>
  );
}

function ReplyQuote({ target }) {
  if (!target) return null;
  return (
    <div className="mb-2 flex items-center gap-2 rounded-lg border border-border/60 bg-secondary/50 px-2.5 py-1 text-xs text-muted-foreground">
      <CornerDownRight className="h-3 w-3 shrink-0 text-primary/70" />
      <span className="font-medium text-foreground/80">{target.name}</span>
      <span className="truncate">{target.preview}</span>
    </div>
  );
}

/* ───────────── main ───────────── */

function ChatMessageItem({ message, onToggleReaction, showHeader = true, isNew = false, replyTarget = null }) {
  const dispatch = useDispatch();
  const currentUser = useSelector((s) => s.auth?.user);
  const currentUserId = currentUser?._id ? String(currentUser._id) : null;

  // captured once at mount so the entrance animation isn't cut short by later re-renders
  const [animate] = useState(isNew);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [copied, setCopied] = useState(false);

  const sender = message.sender || {};
  const isAI = sender.type === "ai" || sender.id === "ai_copilot" || sender.name === "Dionysus AI";
  const isSelf =
    !isAI && currentUserId && (String(sender.user) === currentUserId || String(sender.id) === currentUserId);

  const reactions = useMemo(() => {
    if (!message.reactions?.length) return [];
    if (message.reactions[0]?.count !== undefined) return message.reactions;
    const map = new Map();
    message.reactions.forEach((r) => {
      const uId = r.user?._id || r.user;
      if (!map.has(r.emoji)) map.set(r.emoji, { emoji: r.emoji, count: 0, users: [] });
      const entry = map.get(r.emoji);
      entry.count += 1;
      if (uId) entry.users.push(String(uId));
    });
    return Array.from(map.values());
  }, [message.reactions]);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const actionBar = (
    <div
      className={cn(
        "absolute -top-3 z-10 flex items-center gap-0.5 rounded-lg border border-border bg-card px-1 py-0.5 shadow-sm",
        "pointer-events-none translate-y-1 opacity-0 transition-[opacity,transform] duration-150",
        "group-hover/msg:pointer-events-auto group-hover/msg:translate-y-0 group-hover/msg:opacity-100",
        "focus-within:pointer-events-auto focus-within:translate-y-0 focus-within:opacity-100",
        showEmojiPicker && "pointer-events-auto translate-y-0 opacity-100",
        isSelf ? "left-2" : "right-2"
      )}
    >
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowEmojiPicker((p) => !p)}
          className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground transition-[color,background-color,transform] hover:bg-secondary hover:text-foreground active:scale-90"
          title="Add reaction"
        >
          <Smile className="h-3.5 w-3.5" />
        </button>
        {showEmojiPicker && (
          <div
            className="chat-rise absolute bottom-full right-0 z-30 mb-1 flex items-center gap-0.5 rounded-xl border border-border bg-popover p-1 shadow-md"
            onMouseLeave={() => setShowEmojiPicker(false)}
          >
            {EMOJI_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  onToggleReaction?.(message._id, emoji);
                  setShowEmojiPicker(false);
                }}
                className="flex h-7 w-7 items-center justify-center rounded text-sm transition-transform hover:scale-125 active:scale-95"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={() => dispatch(setReplyingTo(message))}
        className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground transition-[color,background-color,transform] hover:bg-secondary hover:text-foreground active:scale-90"
        title="Reply"
      >
        <Reply className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={handleCopy}
        className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground transition-[color,background-color,transform] hover:bg-secondary hover:text-foreground active:scale-90"
        title="Copy message"
      >
        {copied ? (
          <Check key="c" className="chat-pop h-3.5 w-3.5 text-accent-emerald" />
        ) : (
          <Copy key="i" className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  );

  const reactionRow = reactions.length > 0 && (
    <div className={cn("mt-2 flex flex-wrap gap-1", isSelf && "justify-end")}>
      {reactions.map((r) => {
        const hasReacted = currentUserId && r.users?.map(String).includes(currentUserId);
        return (
          <button
            key={r.emoji}
            type="button"
            onClick={() => onToggleReaction?.(message._id, r.emoji)}
            className={cn(
              "chat-pop inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-[color,background-color,border-color,transform] active:scale-90",
              hasReacted
                ? "border-primary/40 bg-primary/10 font-medium text-primary"
                : "border-border bg-secondary/60 text-muted-foreground hover:bg-secondary"
            )}
            title={`${r.count} reaction${r.count === 1 ? "" : "s"}`}
          >
            <span>{r.emoji}</span>
            <span className="text-[11px] tabular-nums">{r.count}</span>
          </button>
        );
      })}
    </div>
  );

  const wrapperBase = cn(
    "group/msg flex gap-3",
    showHeader ? "mt-5" : "mt-1",
    animate && "chat-rise"
  );

  /* ── AI answer: full-width card ── */
  if (isAI) {
    return (
      <div className={wrapperBase}>
        <div className={cn("shrink-0", !showHeader && "invisible")}>
          <Avatar isAI />
        </div>
        <div className="relative min-w-0 flex-1">
          {actionBar}
          <div className="rounded-2xl border border-primary/20 bg-gradient-to-b from-primary/[0.06] to-card/40 px-4 py-3.5">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-xs font-semibold tracking-tight text-primary">{sender.name || "Dionysus AI"}</span>
              <span className="rounded bg-primary/15 px-1.5 py-px text-[10px] font-medium text-primary">AI Co-pilot</span>
              <span className="text-[11px] text-muted-foreground">{formatTime(message.createdAt)}</span>
            </div>
            <ReplyQuote target={replyTarget} />
            <Sources files={message.taggedFiles} />
            <RichText content={message.content} />
          </div>
          {reactionRow}
        </div>
      </div>
    );
  }

  /* ── own message: right-aligned bubble ── */
  if (isSelf) {
    return (
      <div className={cn(wrapperBase, "justify-end")}>
        <div className="relative flex max-w-[82%] flex-col items-end">
          {actionBar}
          {showHeader && (
            <span className="mb-1 text-[11px] text-muted-foreground">{formatTime(message.createdAt)}</span>
          )}
          <div className="rounded-2xl rounded-tr-md border border-primary/20 bg-primary/10 px-3.5 py-2">
            <ReplyQuote target={replyTarget} />
            {message.taggedFiles?.length > 0 && <Sources files={message.taggedFiles} />}
            <RichText content={message.content} />
          </div>
          {reactionRow}
        </div>
      </div>
    );
  }

  /* ── teammate: avatar + bubble ── */
  return (
    <div className={wrapperBase}>
      <div className={cn("shrink-0", !showHeader && "invisible")}>
        <Avatar name={sender.name} avatar={sender.avatar} />
      </div>
      <div className="relative flex min-w-0 max-w-[82%] flex-col items-start">
        {actionBar}
        {showHeader && (
          <div className="mb-1 flex items-baseline gap-2">
            <span className="text-xs font-semibold tracking-tight text-foreground">{sender.name || "Team Member"}</span>
            <span className="text-[11px] text-muted-foreground">{formatTime(message.createdAt)}</span>
          </div>
        )}
        <div className="rounded-2xl rounded-tl-md border border-border bg-card px-3.5 py-2">
          <ReplyQuote target={replyTarget} />
          {message.taggedFiles?.length > 0 && <Sources files={message.taggedFiles} />}
          <RichText content={message.content} />
        </div>
        {reactionRow}
      </div>
    </div>
  );
}

export default memo(ChatMessageItem);
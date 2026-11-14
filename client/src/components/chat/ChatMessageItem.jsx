import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setReplyingTo } from "../../store/slices/chatSlice";
import { Sparkles, Reply, Smile, FileCode, CornerDownRight, Copy, Check } from "lucide-react";
import CodeBlock from "../code/CodeBlock";
import { cn } from "../../lib/utils";

const EMOJI_OPTIONS = ["👍", "❤️", "🚀", "🔥", "👀"];

function formatTime(dateStr) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  } catch {
    return "";
  }
}

/**
 * Lightweight inline and code-block markdown renderer for chat
 */
function ChatMessageContent({ content, isAI }) {
  if (!content) return null;

  // Split by ``` blocks
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-2 text-[13.5px] leading-relaxed break-words">
      {parts.map((part, idx) => {
        if (part.startsWith("```") && part.endsWith("```")) {
          const lines = part.slice(3, -3).trim().split("\n");
          const firstLine = lines[0].trim();
          let lang = "plaintext";
          let code = lines.join("\n");

          if (firstLine && !firstLine.includes(" ") && lines.length > 1) {
            lang = firstLine;
            code = lines.slice(1).join("\n");
          }

          return (
            <div key={idx} className="my-2 overflow-hidden rounded-lg border border-border">
              <CodeBlock code={code} language={lang} />
            </div>
          );
        }

        // Regular paragraphs with inline formatting
        const paragraphs = part.split("\n\n");
        return paragraphs.map((para, pIdx) => {
          if (!para.trim()) return null;
          return (
            <p key={`${idx}_${pIdx}`} className="leading-relaxed">
              {renderInlineChatText(para)}
            </p>
          );
        });
      })}
    </div>
  );
}

function renderInlineChatText(text) {
  if (!text) return null;
  // Match `code`, @dionysus, #filepath, **bold**, *italic*
  const TOKEN = /(`[^`]+`|@dionysus|#[a-zA-Z0-9_\-./]+\.[a-zA-Z0-9]+|\*\*[^*]+\*\*|\*[^*]+\*)/g;

  return text.split(TOKEN).map((segment, i) => {
    if (!segment) return null;

    if (segment === "@dionysus") {
      return (
        <span
          key={i}
          className="inline-flex items-center gap-1 rounded bg-primary/15 px-1.5 py-0.5 font-medium text-primary text-[12px]"
        >
          <Sparkles className="h-3 w-3 inline" />
          @dionysus
        </span>
      );
    }

    if (segment.startsWith("#") && segment.includes(".")) {
      return (
        <span
          key={i}
          className="inline-flex items-center gap-1 rounded bg-secondary px-1.5 py-0.5 font-mono text-[11.5px] text-foreground/80 border border-border/60"
        >
          <FileCode className="h-3 w-3 inline text-accent-cyan" />
          {segment}
        </span>
      );
    }

    if (/^`[^`]+`$/.test(segment)) {
      return (
        <code
          key={i}
          className="rounded border border-border bg-secondary/80 px-1.5 py-0.5 font-mono text-[12px] text-foreground"
        >
          {segment.slice(1, -1)}
        </code>
      );
    }

    if (/^\*\*[^*]+\*\*$/.test(segment)) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {segment.slice(2, -2)}
        </strong>
      );
    }

    if (/^\*[^*]+\*$/.test(segment)) {
      return (
        <em key={i} className="italic">
          {segment.slice(1, -1)}
        </em>
      );
    }

    return segment;
  });
}

export default function ChatMessageItem({ message, onToggleReaction }) {
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.auth?.user);
  const currentUserId = currentUser?._id;

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [copied, setCopied] = useState(false);

  const isAI = message.sender?.type === "ai" || message.sender?.id === "ai_copilot" || message.sender?.name === "Dionysus AI";
  const isSelf = message.sender?.user === currentUserId || message.sender?.id === currentUserId;

  const formattedReactions = React.useMemo(() => {
    if (!message.reactions || message.reactions.length === 0) return [];
    if (message.reactions[0]?.count !== undefined) return message.reactions;
    const map = new Map();
    message.reactions.forEach((r) => {
      const uId = r.user?._id || r.user;
      if (!map.has(r.emoji)) {
        map.set(r.emoji, { emoji: r.emoji, count: 0, users: [] });
      }
      const entry = map.get(r.emoji);
      entry.count += 1;
      if (uId) entry.users.push(String(uId));
    });
    return Array.from(map.values());
  }, [message.reactions]);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReply = () => {
    dispatch(setReplyingTo(message));
  };

  return (
    <div
      className={cn(
        "group relative flex gap-3 px-4 py-2.5 transition-colors hover:bg-secondary/30",
        isAI && "bg-primary/[0.03] border-l-2 border-primary/60"
      )}
    >
      {/* Sender Avatar */}
      <div className="shrink-0 pt-0.5">
        {isAI ? (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-primary to-accent-cyan shadow-sm text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary border border-border text-xs font-semibold text-foreground overflow-hidden">
            {message.sender?.avatar ? (
              <img
                src={message.sender.avatar}
                alt={message.sender.name}
                className="h-full w-full object-cover"
              />
            ) : (
              (message.sender?.name || "U").slice(0, 2).toUpperCase()
            )}
          </div>
        )}
      </div>

      {/* Message Body */}
      <div className="min-w-0 flex-1">
        {/* Header: Sender Name + Timestamp */}
        <div className="flex items-center gap-2 mb-1">
          <span
            className={cn(
              "text-xs font-semibold tracking-tight",
              isAI ? "text-primary flex items-center gap-1.5" : "text-foreground"
            )}
          >
            {message.sender?.name || "Team Member"}
            {isAI && (
              <span className="rounded bg-primary/20 px-1 py-0.2 text-[10px] font-medium text-primary">
                AI Co-pilot
              </span>
            )}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {formatTime(message.createdAt)}
          </span>
        </div>

        {/* Replying To preview banner */}
        {message.replyTo && (
          <div className="mb-2 flex items-center gap-2 rounded-md border border-border/60 bg-secondary/50 px-2.5 py-1 text-xs text-muted-foreground">
            <CornerDownRight className="h-3 w-3 shrink-0 text-primary/70" />
            <span className="font-medium text-foreground/80">
              {message.replyTo.senderName || "Message"}:
            </span>
            <span className="truncate italic">
              {message.replyTo.contentPreview || "Original message"}
            </span>
          </div>
        )}

        {/* Tagged Files Chips */}
        {message.taggedFiles && message.taggedFiles.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {message.taggedFiles.map((file, fIdx) => (
              <span
                key={fIdx}
                className="inline-flex items-center gap-1 rounded bg-secondary px-2 py-0.5 font-mono text-[11px] text-muted-foreground border border-border/80"
              >
                <FileCode className="h-3 w-3 text-accent-cyan" />
                {file}
              </span>
            ))}
          </div>
        )}

        {/* Main Content */}
        <ChatMessageContent content={message.content} isAI={isAI} />

        {/* Reactions List */}
        {formattedReactions.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1">
            {formattedReactions.map((r) => {
              const hasReacted = currentUserId && r.users?.includes(currentUserId);
              return (
                <button
                  key={r.emoji}
                  type="button"
                  onClick={() => onToggleReaction(message._id, r.emoji)}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs transition-colors border",
                    hasReacted
                      ? "border-primary/40 bg-primary/10 text-primary font-medium"
                      : "border-border bg-secondary/60 text-muted-foreground hover:bg-secondary"
                  )}
                  title={`${r.count} reactions`}
                >
                  <span>{r.emoji}</span>
                  <span className="text-[11px] tabular-nums">{r.count}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Action Bar (visible on hover) */}
      <div className="absolute right-4 top-2 hidden items-center gap-0.5 rounded-lg border border-border bg-card/95 shadow-sm px-1 py-0.5 backdrop-blur-sm group-hover:flex">
        {/* Emoji picker toggle */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowEmojiPicker((prev) => !prev)}
            className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            title="Add reaction"
          >
            <Smile className="h-3.5 w-3.5" />
          </button>

          {showEmojiPicker && (
            <div
              className="absolute right-0 bottom-full mb-1 flex items-center gap-1 rounded-lg border border-border bg-popover p-1 shadow-md z-30"
              onMouseLeave={() => setShowEmojiPicker(false)}
            >
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    onToggleReaction(message._id, emoji);
                    setShowEmojiPicker(false);
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded hover:bg-secondary transition-transform hover:scale-125 text-sm"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Reply button */}
        <button
          type="button"
          onClick={handleReply}
          className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          title="Reply"
        >
          <Reply className="h-3.5 w-3.5" />
        </button>

        {/* Copy text */}
        <button
          type="button"
          onClick={handleCopy}
          className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          title="Copy message"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-accent-emerald" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  );
}

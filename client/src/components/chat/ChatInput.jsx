import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setReplyingTo } from "../../store/slices/chatSlice";
import { Sparkles, Send, X, FileCode, CornerDownRight, Hash } from "lucide-react";
import { cn } from "../../lib/utils";

const ChatInput = forwardRef(function ChatInput({ onSendMessage, onTyping }, ref) {
  const dispatch = useDispatch();
  const replyingTo = useSelector((state) => state.chat?.replyingTo);
  const chatFiles = useSelector((state) => state.chat?.chatFiles || []);

  const [text, setText] = useState("");
  const [taggedFiles, setTaggedFiles] = useState([]);
  const [fileFilter, setFileFilter] = useState("");
  const [showFileSuggestions, setShowFileSuggestions] = useState(false);
  const [suggestionIdx, setSuggestionIdx] = useState(0);
  const [sentTick, setSentTick] = useState(0);

  const textareaRef = useRef(null);
  const itemRefs = useRef([]);

  // lets the page prefill the box (e.g. clicking a file in the side panel)
  useImperativeHandle(ref, () => ({
    insert(value) {
      setText(value);
      requestAnimationFrame(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.focus();
        el.setSelectionRange(value.length, value.length);
      });
    },
    focus() {
      textareaRef.current?.focus();
    },
  }));

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, [text]);

  useEffect(() => {
    if (replyingTo) textareaRef.current?.focus();
  }, [replyingTo]);

  const filteredFiles = chatFiles
    .filter((f) => f.toLowerCase().includes(fileFilter.toLowerCase()))
    .slice(0, 8);

  useEffect(() => {
    itemRefs.current[suggestionIdx]?.scrollIntoView({ block: "nearest" });
  }, [suggestionIdx]);

  const handleTextChange = (e) => {
    const val = e.target.value;
    setText(val);
    onTyping?.();

    const before = val.slice(0, e.target.selectionStart);
    const hashMatch = before.match(/#([\w\-./]*)$/);
    if (hashMatch) {
      setFileFilter(hashMatch[1] || "");
      setShowFileSuggestions(true);
      setSuggestionIdx(0);
    } else {
      setShowFileSuggestions(false);
    }
  };

  const insertFileTag = (filePath) => {
    const el = textareaRef.current;
    if (!el) return;
    const cursor = el.selectionStart;
    const replacedBefore = text.slice(0, cursor).replace(/#([\w\-./]*)$/, `#${filePath} `);
    setText(replacedBefore + text.slice(cursor));
    setShowFileSuggestions(false);
    setTaggedFiles((prev) => (prev.includes(filePath) ? prev : [...prev, filePath]));

    setTimeout(() => {
      if (!textareaRef.current) return;
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(replacedBefore.length, replacedBefore.length);
    }, 0);
  };

  const handleKeyDown = (e) => {
    if (e.nativeEvent?.isComposing) return;

    if (showFileSuggestions && filteredFiles.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSuggestionIdx((p) => (p + 1) % filteredFiles.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSuggestionIdx((p) => (p - 1 + filteredFiles.length) % filteredFiles.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertFileTag(filteredFiles[suggestionIdx]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setShowFileSuggestions(false);
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const inline = trimmed.match(/#([a-zA-Z0-9_\-./]+\.[a-zA-Z0-9]+)/g) || [];
    const allTagged = Array.from(new Set([...taggedFiles, ...inline.map((f) => f.slice(1))]));

    onSendMessage({
      content: trimmed,
      taggedFiles: allTagged,
      replyTo: replyingTo?._id || null,
    });

    setText("");
    setTaggedFiles([]);
    setShowFileSuggestions(false);
    setSentTick((t) => t + 1);
    dispatch(setReplyingTo(null));
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const aiActive = text.includes("@dionysus");

  const toggleAI = () => {
    if (aiActive) setText((t) => t.replace(/@dionysus\s?/g, ""));
    else setText((t) => (t ? `@dionysus ${t}` : "@dionysus "));
    textareaRef.current?.focus();
  };

  const startFileTag = () => {
    setText((t) => (t && !/\s$/.test(t) ? `${t} #` : `${t}#`));
    setFileFilter("");
    setSuggestionIdx(0);
    setShowFileSuggestions(true);
    textareaRef.current?.focus();
  };

  const canSend = text.trim().length > 0;

  return (
    <div className="relative shrink-0 px-4 pb-4 pt-2">
      <div className="relative mx-auto w-full max-w-3xl">
        {/* file suggestions */}
        {showFileSuggestions && filteredFiles.length > 0 && (
          <div className="chat-rise absolute bottom-full left-0 z-50 mb-2 max-h-56 w-full max-w-sm overflow-y-auto rounded-xl border border-border bg-popover p-1.5 shadow-xl">
            <div className="flex items-center justify-between px-2 py-1 text-[11px] font-semibold text-muted-foreground">
              <span>Repository files</span>
              <span className="font-mono text-[10px]">↑↓ · Enter</span>
            </div>
            <div className="space-y-0.5">
              {filteredFiles.map((file, i) => (
                <button
                  key={file}
                  ref={(el) => (itemRefs.current[i] = el)}
                  type="button"
                  onClick={() => insertFileTag(file)}
                  onMouseEnter={() => setSuggestionIdx(i)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left font-mono text-xs transition-colors",
                    i === suggestionIdx ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-secondary"
                  )}
                >
                  <FileCode className="h-3.5 w-3.5 shrink-0 opacity-70" />
                  <span className="truncate">{file}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-border bg-card shadow-sm transition-[border-color,box-shadow] duration-200 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/15">
          {/* replying to */}
          {replyingTo && (
            <div className="chat-rise mx-2 mt-2 flex items-center justify-between rounded-lg bg-secondary/70 px-3 py-1.5 text-xs">
              <div className="flex items-center gap-2 overflow-hidden">
                <CornerDownRight className="h-3.5 w-3.5 shrink-0 text-primary" />
                <span className="font-medium text-foreground">Replying to {replyingTo.sender?.name || "message"}</span>
                <span className="truncate text-muted-foreground">{replyingTo.content}</span>
              </div>
              <button
                type="button"
                onClick={() => dispatch(setReplyingTo(null))}
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground transition-[color,background-color,transform] hover:bg-card hover:text-foreground active:scale-90"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}

          {/* tagged files */}
          {taggedFiles.length > 0 && (
            <div className="flex flex-wrap gap-1.5 px-3 pt-2">
              {taggedFiles.map((file) => (
                <span
                  key={file}
                  title={file}
                  className="chat-pop inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary px-2 py-0.5 font-mono text-[11px] text-foreground"
                >
                  <FileCode className="h-3 w-3 text-accent-cyan" />
                  <span className="max-w-[180px] truncate">{file.split("/").pop()}</span>
                  <button
                    type="button"
                    onClick={() => setTaggedFiles((p) => p.filter((f) => f !== file))}
                    className="transition-colors hover:text-destructive"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder="Message the team, or type @dionysus to ask the AI…"
            rows={1}
            className="block max-h-44 min-h-[44px] w-full resize-none bg-transparent px-4 py-3 text-[13.5px] leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none"
          />

          <div className="flex items-center justify-between px-2.5 pb-2.5">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={toggleAI}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-[color,background-color,border-color,transform] active:scale-95",
                  aiActive
                    ? "border-primary/40 bg-primary/15 text-primary"
                    : "border-border bg-secondary/60 text-muted-foreground hover:text-foreground"
                )}
                title="Mention @dionysus"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Ask AI
              </button>
              <button
                type="button"
                onClick={startFileTag}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-secondary/60 px-2.5 text-xs font-medium text-muted-foreground transition-[color,transform] hover:text-foreground active:scale-95"
                title="Tag a repository file"
              >
                <Hash className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Tag file</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden text-[11px] text-muted-foreground md:inline">
                <kbd className="rounded border border-border bg-secondary px-1 font-mono text-[10px]">Enter</kbd> send ·{" "}
                <kbd className="rounded border border-border bg-secondary px-1 font-mono text-[10px]">Shift+Enter</kbd> new line
              </span>
              <button
                type="button"
                onClick={handleSend}
                disabled={!canSend}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg transition-[background-color,transform,opacity] duration-200",
                  canSend
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-90"
                    : "cursor-not-allowed bg-muted text-muted-foreground opacity-50"
                )}
                title="Send message (Enter)"
              >
                <span key={sentTick} className={sentTick ? "chat-fly flex" : "flex"}>
                  <Send className="h-4 w-4" />
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default ChatInput;
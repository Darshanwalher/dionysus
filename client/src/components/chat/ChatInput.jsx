import React, { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setReplyingTo } from "../../store/slices/chatSlice";
import { Sparkles, Send, X, FileCode, CornerDownRight, Hash } from "lucide-react";
import { cn } from "../../lib/utils";

export default function ChatInput({ onSendMessage, onTyping, isConnected }) {
  const dispatch = useDispatch();
  const replyingTo = useSelector((state) => state.chat?.replyingTo);
  const chatFiles = useSelector((state) => state.chat?.chatFiles || []);

  const [text, setText] = useState("");
  const [taggedFiles, setTaggedFiles] = useState([]);
  const [fileFilter, setFileFilter] = useState("");
  const [showFileSuggestions, setShowFileSuggestions] = useState(false);
  const [suggestionIdx, setSuggestionIdx] = useState(0);

  const textareaRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, [text]);

  // Focus textarea when replyingTo changes
  useEffect(() => {
    if (replyingTo && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [replyingTo]);

  // Filter file suggestions
  const filteredFiles = chatFiles
    .filter((f) => f.toLowerCase().includes(fileFilter.toLowerCase()))
    .slice(0, 8);

  const handleTextChange = (e) => {
    const val = e.target.value;
    setText(val);
    if (onTyping) onTyping();

    // Check for `#` autocomplete trigger
    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursorPos);
    const hashMatch = textBeforeCursor.match(/#([\w\-./]*)$/);

    if (hashMatch) {
      setFileFilter(hashMatch[1] || "");
      setShowFileSuggestions(true);
      setSuggestionIdx(0);
    } else {
      setShowFileSuggestions(false);
    }
  };

  const insertFileTag = (filePath) => {
    if (!textareaRef.current) return;
    const cursorPos = textareaRef.current.selectionStart;
    const textBefore = text.slice(0, cursorPos);
    const textAfter = text.slice(cursorPos);

    // Replace the trailing #... with the chosen filepath
    const replacedBefore = textBefore.replace(/#([\w\-./]*)$/, `#${filePath} `);
    const newText = replacedBefore + textAfter;

    setText(newText);
    setShowFileSuggestions(false);

    // Track as tagged file if not already
    if (!taggedFiles.includes(filePath)) {
      setTaggedFiles((prev) => [...prev, filePath]);
    }

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const nextPos = replacedBefore.length;
        textareaRef.current.setSelectionRange(nextPos, nextPos);
      }
    }, 0);
  };

  const handleKeyDown = (e) => {
    // If file suggestions are open, handle Arrow navigation
    if (showFileSuggestions && filteredFiles.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSuggestionIdx((prev) => (prev + 1) % filteredFiles.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSuggestionIdx((prev) => (prev - 1 + filteredFiles.length) % filteredFiles.length);
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

    // Standard Enter to send
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    // Detect any #filepath tags written in the message
    const inlineFileMatches = trimmed.match(/#([a-zA-Z0-9_\-./]+\.[a-zA-Z0-9]+)/g) || [];
    const extractedFiles = inlineFileMatches.map((f) => f.slice(1));
    const allTagged = Array.from(new Set([...taggedFiles, ...extractedFiles]));

    onSendMessage({
      content: trimmed,
      taggedFiles: allTagged,
      replyTo: replyingTo?._id || null,
    });

    setText("");
    setTaggedFiles([]);
    setShowFileSuggestions(false);
    dispatch(setReplyingTo(null));

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleAskDionysus = () => {
    if (!text.includes("@dionysus")) {
      const newText = text ? `@dionysus ${text}` : "@dionysus ";
      setText(newText);
    }
    textareaRef.current?.focus();
  };

  const removeTaggedFile = (filePath) => {
    setTaggedFiles((prev) => prev.filter((f) => f !== filePath));
  };

  return (
    <div className="relative border-t border-border bg-card/60 p-3 backdrop-blur-md">
      {/* File suggestions popover */}
      {showFileSuggestions && filteredFiles.length > 0 && (
        <div className="absolute bottom-full left-4 mb-2 max-h-56 w-80 overflow-y-auto rounded-xl border border-border bg-popover p-1.5 shadow-xl z-50">
          <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground flex items-center justify-between">
            <span>Repository Files</span>
            <span className="font-mono text-[10px]">Enter / Tab to select</span>
          </div>
          <div className="space-y-0.5">
            {filteredFiles.map((file, i) => (
              <button
                key={file}
                type="button"
                onClick={() => insertFileTag(file)}
                onMouseEnter={() => setSuggestionIdx(i)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-mono transition-colors",
                  i === suggestionIdx
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-secondary"
                )}
              >
                <FileCode className="h-3.5 w-3.5 shrink-0 opacity-70" />
                <span className="truncate">{file}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Replying-to Preview Bar */}
      {replyingTo && (
        <div className="mb-2 flex items-center justify-between rounded-lg border border-border/80 bg-secondary/80 px-3 py-1.5 text-xs">
          <div className="flex items-center gap-2 overflow-hidden">
            <CornerDownRight className="h-3.5 w-3.5 shrink-0 text-primary" />
            <span className="font-medium text-foreground">
              Replying to {replyingTo.sender?.name || "message"}:
            </span>
            <span className="truncate italic text-muted-foreground">
              {replyingTo.content}
            </span>
          </div>
          <button
            type="button"
            onClick={() => dispatch(setReplyingTo(null))}
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-card transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Tagged Files Chips Preview */}
      {taggedFiles.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {taggedFiles.map((file) => (
            <span
              key={file}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary px-2 py-0.5 font-mono text-[11px] text-foreground"
            >
              <FileCode className="h-3 w-3 text-accent-cyan" />
              <span className="max-w-[200px] truncate">{file}</span>
              <button
                type="button"
                onClick={() => removeTaggedFile(file)}
                className="hover:text-destructive"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Main Textarea and Controls */}
      <div className="flex items-end gap-2 rounded-xl border border-border bg-secondary/30 p-1.5 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder="Message repository chat room... (type @dionysus to ask AI, # to tag file)"
          rows={1}
          className="max-h-44 min-h-[38px] flex-1 resize-none bg-transparent px-2.5 py-1.5 text-[13.5px] leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none"
        />

        {/* Action Buttons */}
        <div className="flex items-center gap-1 pb-1 pr-1">
          {/* Quick @dionysus chip */}
          <button
            type="button"
            onClick={handleAskDionysus}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-2.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
            title="Mention @dionysus AI Co-pilot"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Ask AI</span>
          </button>

          {/* Send Button */}
          <button
            type="button"
            onClick={handleSend}
            disabled={!text.trim()}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
              text.trim()
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
            )}
            title="Send message (Enter)"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Sub-bar: Hotkeys + Connection indicator */}
      <div className="mt-1.5 flex items-center justify-between px-1 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-3">
          <span>
            Press <kbd className="rounded border border-border bg-secondary px-1 font-mono text-[10px]">Enter</kbd> to send, <kbd className="rounded border border-border bg-secondary px-1 font-mono text-[10px]">Shift+Enter</kbd> for newline
          </span>
          <span className="hidden sm:inline text-border">•</span>
          <span className="hidden sm:inline">
            Type <kbd className="rounded border border-border bg-secondary px-1 font-mono text-[10px]">#</kbd> for file autocomplete
          </span>
        </div>

        <div className="flex items-center gap-1.5 font-mono text-[10.5px]">
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              isConnected ? "bg-accent-emerald animate-pulse" : "bg-accent-amber"
            )}
          />
          <span>{isConnected ? "Live Room" : "Reconnecting (REST Fallback)"}</span>
        </div>
      </div>
    </div>
  );
}

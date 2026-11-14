import React, { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchProject } from "../store/slices/projectSlice";
import { fetchOlderMessages, clearChat } from "../store/slices/chatSlice";
import { useProjectChat } from "../hooks/useProjectChat";

import ChatMessageItem from "../components/chat/ChatMessageItem";
import ChatInput from "../components/chat/ChatInput";
import {
  MessagesSquare,
  Sparkles,
  Users,
  FolderGit2,
  Search,
  FileCode,
  ArrowDown,
  Info,
  ChevronRight,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { cn } from "../lib/utils";

function isDifferentDay(d1, d2) {
  if (!d1 || !d2) return false;
  const date1 = new Date(d1);
  const date2 = new Date(d2);
  return (
    date1.getFullYear() !== date2.getFullYear() ||
    date1.getMonth() !== date2.getMonth() ||
    date1.getDate() !== date2.getDate()
  );
}

function formatDateDivider(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  });
}

export default function ChatRoom() {
  const { id: projectId } = useParams();
  const dispatch = useDispatch();

  const currentProject = useSelector((state) => state.project?.currentProject);
  const {
    messages,
    hasMore,
    nextCursor,
    isLoadingMessages,
    isLoadingMore,
    activeUsers,
    typingUsers,
    chatFiles,
  } = useSelector((state) => state.chat);

  const [showRightDrawer, setShowRightDrawer] = useState(true);
  const [fileSearch, setFileSearch] = useState("");
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);

  // Initialize WebSocket chat connection & handlers
  const {
    isConnected,
    sendMessage,
    handleUserTyping,
    toggleReaction,
  } = useProjectChat(projectId);

  // Load project details if not already in state
  useEffect(() => {
    if (projectId && (!currentProject || currentProject._id !== projectId)) {
      dispatch(fetchProject(projectId));
    }
    return () => {
      dispatch(clearChat());
    };
  }, [projectId, dispatch]);

  // Auto-scroll to bottom on first load or when sending
  const scrollToBottom = (behavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    if (!isLoadingMessages && messages.length > 0) {
      scrollToBottom("auto");
    }
  }, [isLoadingMessages]);

  useEffect(() => {
    // If user is near bottom, keep pinned to bottom on incoming messages
    const container = scrollContainerRef.current;
    if (!container) return;
    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < 150;
    if (isNearBottom) {
      scrollToBottom("smooth");
    }
  }, [messages.length]);

  // Scroll detection for "Jump to bottom" button & infinite scroll up
  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;

    // Show jump-to-bottom button if scrolled up > 300px
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollBottom(distanceFromBottom > 300);

    // If scrolled to top and hasMore, load earlier
    if (el.scrollTop === 0 && hasMore && !isLoadingMore && nextCursor) {
      const prevHeight = el.scrollHeight;
      dispatch(fetchOlderMessages({ projectId, before: nextCursor })).then(() => {
        // Maintain scroll position after prepending
        requestAnimationFrame(() => {
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop =
              scrollContainerRef.current.scrollHeight - prevHeight;
          }
        });
      });
    }
  };

  const filteredDrawerFiles = (chatFiles || [])
    .filter((f) => f.toLowerCase().includes(fileSearch.toLowerCase()))
    .slice(0, 50);

  const aiTyping = typingUsers.find((u) => u.userId === "ai_copilot");
  const humanTyping = typingUsers.filter((u) => u.userId !== "ai_copilot");

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-background">
      {/* Top Chat Header */}
      <div className="flex h-14 items-center justify-between border-b border-border bg-card/60 px-5 backdrop-blur-md">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary">
            <MessagesSquare className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-sm font-semibold text-foreground">
                {currentProject?.name || "Project"} Chat Room
              </h1>
              <span className="flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                <Sparkles className="h-3 w-3" />
                @dionysus co-pilot active
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground truncate">
              Real-time workspace collaboration & AI repository assistant
            </p>
          </div>
        </div>

        {/* Right Header Controls */}
        <div className="flex items-center gap-3">
          {/* Active members pill */}
          <div className="hidden sm:flex items-center gap-1.5 rounded-lg border border-border bg-secondary/60 px-2.5 py-1 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5 text-accent-cyan" />
            <span className="font-medium text-foreground">{activeUsers.length || 1}</span>
            <span>online</span>
          </div>

          {/* Toggle sidebar drawer */}
          <button
            type="button"
            onClick={() => setShowRightDrawer((prev) => !prev)}
            className={cn(
              "flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors",
              showRightDrawer
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border bg-secondary text-muted-foreground hover:text-foreground"
            )}
            title="Toggle repository panel"
          >
            <FolderGit2 className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Repository Details</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Message Stream + Input */}
        <div className="flex flex-1 flex-col overflow-hidden relative">
          {/* Message List */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto divide-y divide-border/20 py-4"
          >
            {/* Load earlier button / spinner */}
            {hasMore && (
              <div className="pb-3 text-center">
                <button
                  type="button"
                  onClick={() =>
                    dispatch(fetchOlderMessages({ projectId, before: nextCursor }))
                  }
                  disabled={isLoadingMore}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary px-3 py-1 text-xs text-muted-foreground hover:bg-card hover:text-foreground transition-colors"
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Loading earlier messages...
                    </>
                  ) : (
                    "Load earlier messages"
                  )}
                </button>
              </div>
            )}

            {/* Empty State */}
            {!isLoadingMessages && messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary mb-3">
                  <MessagesSquare className="h-6 w-6" />
                </div>
                <h3 className="text-base font-semibold text-foreground">
                  Welcome to {currentProject?.name || "Repository"} Chat Room!
                </h3>
                <p className="mt-1 max-w-sm text-xs text-muted-foreground leading-relaxed">
                  Discuss architecture, collaborate in real-time, or mention{" "}
                  <code className="rounded bg-primary/15 px-1 py-0.5 font-medium text-primary">
                    @dionysus
                  </code>{" "}
                  to query code files, database models, or system flows.
                </p>

                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2 text-left max-w-md w-full">
                  <button
                    type="button"
                    onClick={() =>
                      sendMessage({
                        content: "@dionysus What does this project do and what is its primary tech stack?",
                      })
                    }
                    className="flex flex-col gap-1 rounded-xl border border-border bg-card p-3 text-xs hover:border-primary/40 hover:bg-secondary/40 transition-colors"
                  >
                    <span className="font-semibold text-primary flex items-center gap-1">
                      <Sparkles className="h-3 w-3" /> Tech Stack Overview
                    </span>
                    <span className="text-muted-foreground text-[11px]">
                      Ask @dionysus to inspect repo files and summarize architecture.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      sendMessage({
                        content: "@dionysus Explain the verified database schema models in this project.",
                      })
                    }
                    className="flex flex-col gap-1 rounded-xl border border-border bg-card p-3 text-xs hover:border-primary/40 hover:bg-secondary/40 transition-colors"
                  >
                    <span className="font-semibold text-primary flex items-center gap-1">
                      <Sparkles className="h-3 w-3" /> Schema Models
                    </span>
                    <span className="text-muted-foreground text-[11px]">
                      Analyze database collections, fields, and relationships.
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* Messages list with date dividers */}
            {messages.map((msg, i) => {
              const prev = messages[i - 1];
              const showDate = !prev || isDifferentDay(prev.createdAt, msg.createdAt);

              return (
                <React.Fragment key={msg._id || i}>
                  {showDate && (
                    <div className="relative my-4 flex items-center justify-center">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border" />
                      </div>
                      <span className="relative rounded-full border border-border bg-secondary px-3 py-0.5 text-[10.5px] font-medium text-muted-foreground">
                        {formatDateDivider(msg.createdAt)}
                      </span>
                    </div>
                  )}
                  <ChatMessageItem
                    message={msg}
                    onToggleReaction={toggleReaction}
                  />
                </React.Fragment>
              );
            })}

            {/* Live Typing Indicators */}
            {(aiTyping || humanTyping.length > 0) && (
              <div className="flex items-center gap-2 px-5 py-2 text-xs text-muted-foreground bg-secondary/20">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                </span>
                {aiTyping ? (
                  <span className="font-medium text-primary flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    Dionysus AI is generating a verified answer...
                  </span>
                ) : (
                  <span>
                    {humanTyping.map((u) => u.userName).join(", ")}{" "}
                    {humanTyping.length === 1 ? "is" : "are"} typing...
                  </span>
                )}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Jump to bottom floating button */}
          {showScrollBottom && (
            <button
              type="button"
              onClick={() => scrollToBottom("smooth")}
              className="absolute bottom-24 right-6 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card shadow-lg text-muted-foreground hover:text-foreground transition-transform hover:scale-110 z-20"
              title="Jump to latest"
            >
              <ArrowDown className="h-4 w-4" />
            </button>
          )}

          {/* Chat Input Bar */}
          <ChatInput
            onSendMessage={sendMessage}
            onTyping={handleUserTyping}
            isConnected={isConnected}
          />
        </div>

        {/* Right Drawer: Active Members + Repo Files + Co-pilot info */}
        {showRightDrawer && (
          <aside className="hidden lg:flex w-80 flex-col border-l border-border bg-card/40 backdrop-blur-md">
            {/* Drawer Header */}
            <div className="flex h-12 items-center justify-between border-b border-border px-4">
              <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Room Context
              </span>
              <span className="font-mono text-[11px] text-muted-foreground">
                {chatFiles.length} files indexed
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {/* @dionysus AI card */}
              <div className="rounded-xl border border-primary/30 bg-primary/[0.04] p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-primary-foreground">
                    <Sparkles className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-foreground">
                      @dionysus Co-pilot
                    </h4>
                    <span className="flex items-center gap-1 text-[10px] text-accent-emerald">
                      <span className="h-1.5 w-1.5 rounded-full bg-accent-emerald" />
                      Pinecone RAG + Schema Active
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Mention <code className="text-primary font-mono">@dionysus</code> in any message. Dionysus uses vector embeddings and verified schema models to cite real repository code.
                </p>
              </div>

              {/* Online Team Members */}
              <div>
                <h4 className="mb-2 flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <span>Active Members</span>
                  <span className="font-mono text-[11px] text-foreground">
                    {activeUsers.length || 1}
                  </span>
                </h4>
                <div className="space-y-1.5">
                  {/* Dionysus AI permanent bot */}
                  <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 bg-secondary/50 text-xs">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary">
                      <Sparkles className="h-3 w-3" />
                    </div>
                    <span className="font-medium text-primary truncate flex-1">
                      Dionysus AI
                    </span>
                    <span className="h-1.5 w-1.5 rounded-full bg-accent-emerald" />
                  </div>

                  {/* Connected users */}
                  {activeUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-foreground hover:bg-secondary/60 transition-colors"
                    >
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary border border-border text-[10px] font-semibold text-muted-foreground overflow-hidden">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          (user.name || "U").slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <span className="truncate flex-1">{user.name}</span>
                      <span className="h-1.5 w-1.5 rounded-full bg-accent-emerald" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Pinned Repository Files for tagging */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Repository Files
                  </h4>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    Type # to insert
                  </span>
                </div>

                {/* File search box */}
                <div className="relative mb-2">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    value={fileSearch}
                    onChange={(e) => setFileSearch(e.target.value)}
                    placeholder="Filter repo files..."
                    className="w-full rounded-lg border border-border bg-secondary/50 pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                  />
                </div>

                {/* File list */}
                <div className="max-h-60 overflow-y-auto space-y-0.5 rounded-lg border border-border/60 bg-secondary/20 p-1">
                  {filteredDrawerFiles.length === 0 ? (
                    <p className="p-3 text-center text-xs text-muted-foreground italic">
                      No files matching "{fileSearch}"
                    </p>
                  ) : (
                    filteredDrawerFiles.map((file) => (
                      <button
                        key={file}
                        type="button"
                        onClick={() => {
                          sendMessage({
                            content: `@dionysus Please explain the purpose, key exports, and dependencies of #${file}`,
                          });
                        }}
                        className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-[11px] font-mono text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors group"
                        title="Click to ask @dionysus about this file"
                      >
                        <FileCode className="h-3 w-3 shrink-0 text-accent-cyan opacity-70 group-hover:opacity-100" />
                        <span className="truncate flex-1">{file}</span>
                        <ChevronRight className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-100 text-primary" />
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchProject } from "../store/slices/projectSlice";
import { fetchOlderMessages, clearChat } from "../store/slices/chatSlice";
import { useProjectChat } from "../hooks/useProjectChat";

import ChatMessageItem from "../components/chat/ChatMessageItem";
import ChatInput from "../components/chat/ChatInput";
import FileBrowser from "../components/chat/FileBrowser";
import { ChatStyles } from "../components/chat/ChatStyles";
import {
  MessagesSquare,
  Sparkles,
  Users,
  FolderGit2,
  Search,
  ArrowDown,
  Loader2,
  PanelRight,
  X,
} from "lucide-react";
import { cn } from "../lib/utils";

/* Height of the chat card. Tune this one value to match your app shell
   (top bar + page padding). */
const CHAT_HEIGHT = "h-[calc(100dvh-7.5rem)]";

function isDifferentDay(d1, d2) {
  if (!d1 || !d2) return false;
  const a = new Date(d1);
  const b = new Date(d2);
  return a.getFullYear() !== b.getFullYear() || a.getMonth() !== b.getMonth() || a.getDate() !== b.getDate();
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

const senderKey = (m) => m?.sender?.id || m?.sender?.user || m?.sender?.name || "unknown";
const GROUP_GAP_MS = 5 * 60 * 1000;

function initials(name = "U") {
  return name.slice(0, 2).toUpperCase();
}

function TypingDots() {
  return (
    <span className="flex items-center gap-0.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="chat-dot h-1.5 w-1.5 rounded-full bg-primary"
          style={{ animationDelay: `${i * 0.16}s` }}
        />
      ))}
    </span>
  );
}

export default function ChatRoom() {
  const { id: projectId } = useParams();
  const dispatch = useDispatch();

  const currentProject = useSelector((state) => state.project?.currentProject);
  const currentUser = useSelector((state) => state.auth?.user);
  const currentUserId = currentUser?._id ? String(currentUser._id) : null;
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

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [tab, setTab] = useState("members");
  const [fileSearch, setFileSearch] = useState("");
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [unread, setUnread] = useState(0);

  const cardRef = useRef(null);
  const endRef = useRef(null);
  const scrollRef = useRef(null);
  const composerRef = useRef(null);
  const nearBottomRef = useRef(true);
  const lastIdRef = useRef(null);
  const knownIds = useRef(new Set());
  const animReady = useRef(false);

  const { sendMessage, handleUserTyping, toggleReaction } = useProjectChat(projectId);

  useEffect(() => {
    if (projectId && (!currentProject || currentProject._id !== projectId)) {
      dispatch(fetchProject(projectId));
    }
    return () => {
      dispatch(clearChat());
    };
  }, [projectId, dispatch]);

  const scrollToBottom = useCallback((behavior = "smooth") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  }, []);

  // Keep wheel/touch scrolling inside the chat card. If the app uses a global
  // smooth-scroll (SmoothScroll.jsx) listening on window/document, this stops it
  // from hijacking the wheel while the pointer is over the chat.
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const stop = (e) => e.stopPropagation();
    el.addEventListener("wheel", stop, { passive: true });
    el.addEventListener("touchmove", stop, { passive: true });
    return () => {
      el.removeEventListener("wheel", stop);
      el.removeEventListener("touchmove", stop);
    };
  }, []);

  // first load → jump to the latest message
  useEffect(() => {
    if (!isLoadingMessages && messages.length > 0) scrollToBottom("auto");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingMessages]);

  // new message at the tail → follow it, or count it as unread
  useEffect(() => {
    const last = messages[messages.length - 1];
    const lastId = last?._id ?? null;
    const prevId = lastIdRef.current;
    lastIdRef.current = lastId;
    if (!lastId || prevId === null || lastId === prevId) return;

    const mine =
      currentUserId && (String(last.sender?.user) === currentUserId || String(last.sender?.id) === currentUserId);
    if (mine || nearBottomRef.current) scrollToBottom("smooth");
    else setUnread((u) => u + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  // keep the typing indicator in view when you're at the bottom
  useEffect(() => {
    if (nearBottomRef.current) scrollToBottom("smooth");
  }, [typingUsers.length, scrollToBottom]);

  // remember which messages have been rendered so only fresh ones animate
  useEffect(() => {
    messages.forEach((m) => m._id && knownIds.current.add(m._id));
    animReady.current = !isLoadingMessages;
  });

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
    nearBottomRef.current = dist < 150;
    setShowScrollBottom(dist > 300);
    if (dist < 150) setUnread((u) => (u ? 0 : u));

    if (el.scrollTop < 40 && hasMore && !isLoadingMore && nextCursor) {
      const prevHeight = el.scrollHeight;
      dispatch(fetchOlderMessages({ projectId, before: nextCursor })).then(() => {
        requestAnimationFrame(() => {
          if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight - prevHeight;
        });
      });
    }
  };

  // reply targets resolved from the loaded list (avoids "Message: Original message" placeholders)
  const replyTargets = useMemo(() => {
    const byId = new Map(messages.map((m) => [String(m._id), m]));
    const result = new Map();
    messages.forEach((m) => {
      if (!m.replyTo) return;
      const ref = typeof m.replyTo === "object" ? m.replyTo : null;
      const refId = String(ref?._id ?? m.replyTo);
      const found = byId.get(refId);
      const name = ref?.senderName || found?.sender?.name;
      const preview = ref?.contentPreview || found?.content;
      if (name || preview) {
        result.set(m._id, { name: name ? `${name}:` : "", preview: (preview || "").replace(/\s+/g, " ").slice(0, 120) });
      }
    });
    return result;
  }, [messages]);

  const aiTyping = typingUsers.find((u) => u.userId === "ai_copilot");
  const humanTyping = typingUsers.filter((u) => u.userId !== "ai_copilot");
  const onlineCount = activeUsers.length || 1;

  const askAbout = (file) => {
    setDrawerOpen(false);
    composerRef.current?.insert(`@dionysus Explain the purpose, key exports and dependencies of #${file} `);
  };

  const suggestions = [
    { title: "Tech stack overview", text: "Summarize the architecture and primary tech stack.", prompt: "@dionysus What does this project do and what is its primary tech stack?" },
    { title: "Database models", text: "Walk through the collections, fields and relations.", prompt: "@dionysus Explain the verified database schema models in this project." },
  ];

  return (
    <div
      ref={cardRef}
      className={cn(
        "chat-fade relative flex min-h-[520px] flex-col overflow-hidden rounded-2xl border border-border bg-background",
        CHAT_HEIGHT
      )}
    >
      <ChatStyles />

      {/* ───────── Header ───────── */}
      <header className="chat-rise relative z-10 flex h-14 shrink-0 items-center justify-between border-b border-border bg-card/70 px-4 backdrop-blur-md">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
            <MessagesSquare className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold leading-tight text-foreground">
              {currentProject?.name || "Project"} <span className="font-normal text-muted-foreground">· Team chat</span>
            </h1>
            <p className="flex items-center gap-1 truncate text-[11px] text-muted-foreground">
              <Sparkles className="h-3 w-3 text-primary" />
              Mention <span className="font-mono text-primary">@dionysus</span> for repo-aware answers
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* online avatars */}
          <div className="hidden items-center sm:flex" title={`${onlineCount} online`}>
            <div className="flex -space-x-2">
              {activeUsers.slice(0, 3).map((u) => (
                <div
                  key={u.id}
                  title={u.name}
                  className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border-2 border-card bg-secondary text-[10px] font-semibold text-muted-foreground transition-transform hover:z-10 hover:-translate-y-0.5"
                >
                  {u.avatar ? <img src={u.avatar} alt={u.name} className="h-full w-full object-cover" /> : initials(u.name)}
                </div>
              ))}
              {activeUsers.length > 3 && (
                <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-card bg-secondary text-[10px] font-semibold text-muted-foreground">
                  +{activeUsers.length - 3}
                </div>
              )}
            </div>
            <span className="ml-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{onlineCount}</span> online
            </span>
          </div>

          <button
            type="button"
            onClick={() => setDrawerOpen((p) => !p)}
            className={cn(
              "flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-[color,background-color,border-color,transform] active:scale-95",
              drawerOpen
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border bg-secondary text-muted-foreground hover:text-foreground"
            )}
            title="Room context"
          >
            <PanelRight className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Context</span>
          </button>
        </div>
      </header>

      {/* ───────── Conversation ───────── */}
      <div className="relative min-h-0 flex-1">
        <div ref={scrollRef} onScroll={handleScroll} className="absolute inset-0 overflow-y-auto overscroll-contain">
          <div className="mx-auto w-full max-w-3xl px-4 pb-6 pt-4">
            {hasMore && (
              <div className="pb-2 text-center">
                <button
                  type="button"
                  onClick={() => dispatch(fetchOlderMessages({ projectId, before: nextCursor }))}
                  disabled={isLoadingMore}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-3 py-1 text-xs text-muted-foreground transition-[color,background-color,transform] hover:bg-card hover:text-foreground active:scale-95"
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Loading earlier messages…
                    </>
                  ) : (
                    "Load earlier messages"
                  )}
                </button>
              </div>
            )}

            {/* loading skeleton */}
            {isLoadingMessages && messages.length === 0 && (
              <div className="space-y-5 pt-4">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className={cn("flex animate-pulse gap-3", i % 2 && "justify-end")}>
                    {!(i % 2) && <div className="h-8 w-8 shrink-0 rounded-full bg-secondary" />}
                    <div className="space-y-2">
                      <div className="h-3 w-24 rounded bg-secondary" />
                      <div className={cn("h-10 rounded-2xl bg-secondary", i % 2 ? "w-56" : "w-72")} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* empty state */}
            {!isLoadingMessages && messages.length === 0 && (
              <div className="flex flex-col items-center px-4 py-16 text-center">
                <div className="chat-rise mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                  <MessagesSquare className="h-7 w-7" />
                </div>
                <h3 className="chat-rise text-base font-semibold text-foreground" style={{ animationDelay: "60ms" }}>
                  Start the conversation
                </h3>
                <p className="chat-rise mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground" style={{ animationDelay: "110ms" }}>
                  Talk with your team in real time, or mention{" "}
                  <code className="rounded bg-primary/15 px-1 py-0.5 font-medium text-primary">@dionysus</code> to ask
                  about code, schema and system flows.
                </p>
                <div className="mt-6 grid w-full max-w-lg grid-cols-1 gap-2.5 text-left sm:grid-cols-2">
                  {suggestions.map((s, i) => (
                    <button
                      key={s.title}
                      type="button"
                      onClick={() => sendMessage({ content: s.prompt })}
                      className="chat-rise group flex flex-col gap-1 rounded-xl border border-border bg-card p-3.5 text-xs transition-[border-color,transform,background-color] hover:-translate-y-0.5 hover:border-primary/40 hover:bg-secondary/40 active:scale-[0.98]"
                      style={{ animationDelay: `${180 + i * 70}ms` }}
                    >
                      <span className="flex items-center gap-1.5 font-semibold text-primary">
                        <Sparkles className="h-3.5 w-3.5 transition-transform duration-300 group-hover:rotate-12" />
                        {s.title}
                      </span>
                      <span className="text-[11px] text-muted-foreground">{s.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* messages */}
            {messages.map((msg, i) => {
              const prev = messages[i - 1];
              const newDay = !prev || isDifferentDay(prev.createdAt, msg.createdAt);
              const grouped =
                !newDay &&
                prev &&
                senderKey(prev) === senderKey(msg) &&
                !msg.replyTo &&
                new Date(msg.createdAt) - new Date(prev.createdAt) < GROUP_GAP_MS;
              const isNew = animReady.current && i >= messages.length - 3 && !knownIds.current.has(msg._id);

              return (
                <React.Fragment key={msg._id || i}>
                  {newDay && (
                    <div className="chat-fade my-5 flex items-center gap-3">
                      <div className="h-px flex-1 bg-border" />
                      <span className="rounded-full border border-border bg-secondary px-3 py-0.5 text-[10.5px] font-medium text-muted-foreground">
                        {formatDateDivider(msg.createdAt)}
                      </span>
                      <div className="h-px flex-1 bg-border" />
                    </div>
                  )}
                  <ChatMessageItem
                    message={msg}
                    onToggleReaction={toggleReaction}
                    showHeader={!grouped}
                    isNew={isNew}
                    replyTarget={replyTargets.get(msg._id) || null}
                  />
                </React.Fragment>
              );
            })}

            {/* typing / AI thinking */}
            {(aiTyping || humanTyping.length > 0) && (
              <div className="chat-rise mt-5 flex items-start gap-3">
                {aiTyping ? (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-accent-cyan text-primary-foreground shadow-sm">
                    <Sparkles className="h-4 w-4" />
                  </div>
                ) : (
                  <div className="h-8 w-8 shrink-0" />
                )}
                <div className="relative overflow-hidden rounded-2xl border border-border bg-card px-3.5 py-2.5">
                  <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                    <TypingDots />
                    {aiTyping ? (
                      <span className="font-medium text-primary">Dionysus is reading the repository…</span>
                    ) : (
                      <span>
                        {humanTyping.map((u) => u.userName).join(", ")} {humanTyping.length === 1 ? "is" : "are"} typing
                      </span>
                    )}
                  </div>
                  {aiTyping && (
                    <div className="absolute inset-x-0 bottom-0 h-0.5 overflow-hidden">
                      <div className="chat-sweep h-full bg-primary/60" />
                    </div>
                  )}
                </div>
              </div>
            )}

            <div ref={endRef} className="h-px" />
          </div>
        </div>

        {/* jump to latest */}
        {showScrollBottom && (
          <button
            type="button"
            onClick={() => {
              scrollToBottom("smooth");
              setUnread(0);
            }}
            className="chat-pop absolute bottom-4 left-1/2 z-20 flex h-9 -translate-x-1/2 items-center gap-1.5 rounded-full border border-border bg-card px-3 text-xs font-medium text-muted-foreground shadow-lg transition-[color,transform] hover:text-foreground active:scale-95"
          >
            <ArrowDown className="h-3.5 w-3.5" />
            {unread > 0 ? (
              <span className="text-primary">
                {unread} new message{unread > 1 ? "s" : ""}
              </span>
            ) : (
              "Latest"
            )}
          </button>
        )}
      </div>

      {/* ───────── Composer ───────── */}
      <ChatInput ref={composerRef} onSendMessage={sendMessage} onTyping={handleUserTyping} />

      {/* ───────── Slide-over: context ───────── */}
      <div
        onClick={() => setDrawerOpen(false)}
        className={cn(
          "chat-scrim absolute inset-0 z-30 bg-background/50",
          drawerOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        aria-hidden
      />
      <aside
        className={cn(
          "chat-drawer absolute inset-y-0 right-0 z-40 flex w-full max-w-sm flex-col border-l border-border bg-card shadow-2xl",
          drawerOpen ? "translate-x-0" : "pointer-events-none translate-x-full"
        )}
        aria-hidden={!drawerOpen}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-foreground">Room context</span>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-[color,background-color,transform] hover:bg-secondary hover:text-foreground active:scale-90"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* AI card */}
        <div className="shrink-0 p-4 pb-2">
          <div className="rounded-xl border border-primary/25 bg-primary/[0.05] p-3">
            <div className="mb-1.5 flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <h4 className="text-xs font-semibold text-foreground">@dionysus Co-pilot</h4>
            </div>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Uses vector search and verified schema models to answer with real code from this repository.
            </p>
          </div>
        </div>

        {/* tabs with sliding pill */}
        <div className="shrink-0 px-4 pt-2">
          <div className="relative grid grid-cols-2 rounded-lg border border-border bg-secondary p-0.5">
            <div
              aria-hidden
              className="chat-pill absolute inset-y-0.5 left-0.5 w-[calc(50%-2px)] rounded-md bg-card shadow-sm"
              style={{ transform: tab === "members" ? "translateX(0)" : "translateX(100%)" }}
            />
            {[
              { key: "members", label: "Members", icon: Users, count: onlineCount },
              { key: "files", label: "Files", icon: FolderGit2, count: chatFiles.length },
            ].map(({ key, label, icon: Icon, count }) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={cn(
                  "relative z-10 flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-colors duration-200",
                  tab === key ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
                <span className="font-mono text-[10px] opacity-70">{count}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {tab === "members" ? (
            <div key="members" className="chat-rise space-y-1">
              <div className="flex items-center gap-2.5 rounded-lg bg-secondary/60 px-2.5 py-2 text-xs">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-primary to-accent-cyan text-primary-foreground">
                  <Sparkles className="h-3.5 w-3.5" />
                </div>
                <span className="flex-1 truncate font-medium text-primary">Dionysus AI</span>
                <span className="h-1.5 w-1.5 rounded-full bg-accent-emerald" />
              </div>
              {activeUsers.map((user, i) => (
                <div
                  key={user.id}
                  className="chat-rise flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs text-foreground transition-colors hover:bg-secondary/60"
                  style={{ animationDelay: `${60 + i * 40}ms` }}
                >
                  <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border border-border bg-secondary text-[10px] font-semibold text-muted-foreground">
                    {user.avatar ? <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" /> : initials(user.name)}
                  </div>
                  <span className="flex-1 truncate">{user.name}</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-accent-emerald" />
                </div>
              ))}
            </div>
          ) : (
            <div key="files" className="chat-rise space-y-3">
              {chatFiles.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center">
                  <FolderGit2 className="mx-auto mb-2 h-5 w-5 text-muted-foreground" />
                  <p className="text-xs font-medium text-foreground">No files indexed yet</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                    Once the repository is indexed, its files appear here so you can tag them with{" "}
                    <span className="font-mono text-foreground">#</span>.
                  </p>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <input
                      type="text"
                      value={fileSearch}
                      onChange={(e) => setFileSearch(e.target.value)}
                      placeholder="Search all folders…"
                      className="w-full rounded-lg border border-border bg-secondary/50 py-1.5 pl-8 pr-3 text-xs text-foreground transition-colors placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                  <FileBrowser files={chatFiles} search={fileSearch} onPick={askAbout} />
                  <p className="px-1 text-[11px] text-muted-foreground">
                    Open a folder, then click a file to ask @dionysus about it.
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
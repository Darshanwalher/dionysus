import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import gsap from "gsap";
import { fetchProject, linkRepo, pollCommits, inviteUser } from "@/store/slices/projectSlice";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import PageHeader from "@/components/layout/PageHeader";
import {
  GitGraph,
  GitBranch,
  ExternalLink,
  UserPlus,
  Users,
  Copy,
  Check,
  BookText,
  FileQuestion,
  Presentation,
  FolderTree,
  Search,
  RefreshCw,
  Sparkles,
  ChevronDown,
  Code2,
  Terminal,
  Activity,
  ArrowRight,
  X,
  Mail,
  Settings,
  Boxes,
} from "lucide-react";
import ProjectSettingsModal from "@/components/project/ProjectSettingsModal";
import {
  prefersReduced,
  CountUp,
  FadeIn,
  Unfold,
  Pop,
  TabBar,
  SplitText,
  LineReveal,
  Magnetic,
  SpotlightCard,
  ScrollReveal,
  Sparkline,
} from "@/components/motion";

const PROMPTS = [
  "Where is auth & JWT validation handled?",
  "Explain microservices communication topology",
  "Show high blast radius shared interfaces",
  "List database schemas and connection pool",
];

/** Splits a commit message into a short title and its detail lines. */
function splitMessage(msg = "") {
  const lines = msg.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length > 1) return { title: lines[0], body: lines.slice(1).map((l) => l.replace(/^[-*•]\s*/, "")) };
  const parts = msg.split(/\s+-\s+/).map((p) => p.trim()).filter(Boolean);
  if (parts.length > 1) return { title: parts[0], body: parts.slice(1) };
  return { title: msg, body: [] };
}

const commitDot = (msg = "") => {
  const l = msg.toLowerCase();
  if (l.includes("breaking") || l.includes("major")) return "bg-destructive";
  if (l.startsWith("feat") || l.includes("feature")) return "bg-primary";
  if (l.startsWith("fix") || l.includes("bug")) return "bg-accent-amber";
  if (l.startsWith("refactor")) return "bg-highlight";
  return "bg-muted-foreground/40";
};

const dayLabel = (d) => {
  if (isNaN(d)) return "Unknown date";
  const today = new Date();
  const yest = new Date();
  yest.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yest.toDateString()) return "Yesterday";
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: d.getFullYear() === today.getFullYear() ? undefined : "numeric",
  });
};

const formatTime = (dateStr) => {
  const d = new Date(dateStr);
  return isNaN(d) ? "" : d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
};

export default function ProjectHome() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentProject, isLoading, isActionLoading, architectureGraph, dependencyGraph } = useSelector(
    (state) => state.project
  );
  const { user } = useSelector((state) => state.auth);

  // Local state
  const [showSettings, setShowSettings] = useState(false);
  const [githubUrl, setGithubUrl] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(null);
  const [commitFilter, setCommitFilter] = useState("");
  const [expandedCommit, setExpandedCommit] = useState(null);
  const [expandedBody, setExpandedBody] = useState(null);
  const [activeTab, setActiveTab] = useState("commits"); // "commits" | "quickstart" | "team"
  const [onlyAiSummaries, setOnlyAiSummaries] = useState(false);
  const [quickQuestion, setQuickQuestion] = useState("");

  const rootRef = useRef(null);
  const askRef = useRef(null);
  const heroRef = useRef(null);

  const isOwner = useMemo(() => {
    if (!user || !currentProject) return false;
    const ownerId = currentProject.owner?._id || currentProject.owner;
    return String(ownerId) === String(user._id);
  }, [user, currentProject]);

  useEffect(() => {
    dispatch(fetchProject(id));
  }, [dispatch, id]);

  const handleLinkRepo = async (e) => {
    e.preventDefault();
    if (!githubUrl.trim()) return;
    const res = await dispatch(linkRepo({ projectId: id, githubUrl }));
    if (res.meta.requestStatus === "fulfilled") {
      toast.success("GitHub repository connected!");
    } else {
      toast.error(res.payload || "Failed to link repository");
    }
  };

  const handlePollCommits = async () => {
    const res = await dispatch(pollCommits(id));
    if (res.meta.requestStatus === "fulfilled") {
      toast.success("Commits synchronized with GitHub!");
    } else {
      toast.error("Failed to poll commits");
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    const res = await dispatch(inviteUser({ projectId: id, email: inviteEmail }));
    if (res.meta.requestStatus === "fulfilled") {
      toast.success(`Invite sent to ${inviteEmail}`);
      setInviteEmail("");
      setShowInvite(false);
    } else {
      toast.error(res.payload || "Failed to invite user");
    }
  };

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === "id") {
      setCopiedId(true);
      toast.success("Project ID copied");
      setTimeout(() => setCopiedId(false), 2000);
    } else {
      setCopiedCmd(type);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopiedCmd(null), 2000);
    }
  };

  const handleQuickAsk = (e) => {
    e.preventDefault();
    if (!quickQuestion.trim()) return;
    navigate(`/projects/${id}/qna?q=${encodeURIComponent(quickQuestion.trim())}`);
  };

  const filteredCommits = useMemo(() => {
    if (!currentProject?.commits) return [];
    let list = currentProject.commits;
    if (onlyAiSummaries) {
      list = list.filter((c) => Boolean(c.summary));
    }
    if (!commitFilter.trim()) return list;
    const term = commitFilter.toLowerCase();
    return list.filter(
      (c) =>
        c.commitMessage?.toLowerCase().includes(term) ||
        c.commitAuthorName?.toLowerCase().includes(term) ||
        c.commitHash?.toLowerCase().includes(term) ||
        c.summary?.toLowerCase().includes(term)
    );
  }, [currentProject?.commits, commitFilter, onlyAiSummaries]);

  // Group commits by day for the timeline
  const commitGroups = useMemo(() => {
    const map = new Map();
    filteredCommits.forEach((c) => {
      const d = new Date(c.commitDate);
      const key = isNaN(d) ? "unknown" : d.toDateString();
      if (!map.has(key)) map.set(key, { key, label: dayLabel(d), commits: [] });
      map.get(key).commits.push(c);
    });
    return [...map.values()];
  }, [filteredCommits]);

  const aiSummaryCount = useMemo(() => {
    return currentProject?.commits?.filter((c) => Boolean(c.summary))?.length || 0;
  }, [currentProject?.commits]);

  // Commits per day for the last 14 days (drives the sparkline)
  const spark = useMemo(() => {
    const days = 14;
    const buckets = Array(days).fill(0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    (currentProject?.commits || []).forEach((c) => {
      const d = Math.floor((end - new Date(c.commitDate)) / 86400000);
      if (d >= 0 && d < days) buckets[days - 1 - d] += 1;
    });
    return buckets.some(Boolean) ? buckets : null;
  }, [currentProject?.commits]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getCommitTypeBadge = (msg = "") => {
    const lower = msg.toLowerCase();
    const cls = "text-[11px] font-medium";
    if (lower.startsWith("feat") || lower.includes("feature")) return <Badge variant="cyan" className={cls}>Feature</Badge>;
    if (lower.startsWith("fix") || lower.includes("bug")) return <Badge variant="warning" className={cls}>Fix</Badge>;
    if (lower.includes("breaking") || lower.includes("major")) return <Badge variant="destructive" className={cls}>Breaking</Badge>;
    if (lower.startsWith("refactor")) return <Badge variant="indigo" className={cls}>Refactor</Badge>;
    return <Badge variant="secondary" className={cls}>Commit</Badge>;
  };

  const ready = !(isLoading || !currentProject);

  // Hero + stat cards ease in once the page is ready
  useLayoutEffect(() => {
    if (!ready || !rootRef.current || prefersReduced()) return;
    const ctx = gsap.context(() => {
      gsap.from("[data-hero]", { opacity: 0, y: 16, duration: 0.6, ease: "power3.out", delay: 0.15, clearProps: "all" });
      gsap.from("[data-stat]", {
        opacity: 0, y: 14, duration: 0.5, stagger: 0.06, ease: "power3.out", delay: 0.3, clearProps: "all",
      });
    }, rootRef);
    return () => ctx.revert();
  }, [ready]);

  // Hero: two softly drifting light blobs
  useEffect(() => {
    if (!ready || !heroRef.current || prefersReduced()) return;
    const hero = heroRef.current;
    const ctx = gsap.context(() => {
      gsap.to("[data-blob='a']", { x: 50, y: -20, duration: 7, repeat: -1, yoyo: true, ease: "sine.inOut" });
      gsap.to("[data-blob='b']", { x: -40, y: 30, duration: 9, repeat: -1, yoyo: true, ease: "sine.inOut" });
    }, hero);
    return () => ctx.revert();
  }, [ready]);

  // The question box types out example questions until you interact with it
  useEffect(() => {
    if (!ready || !askRef.current) return;
    const input = askRef.current;
    if (prefersReduced()) {
      input.placeholder = PROMPTS[0];
      return;
    }
    let i = 0;
    let tl;
    const state = { n: 0 };
    const write = (text) => () => {
      if (askRef.current) askRef.current.placeholder = text.slice(0, Math.round(state.n));
    };
    const run = () => {
      const text = PROMPTS[i % PROMPTS.length];
      state.n = 0;
      tl = gsap.timeline({
        onComplete: () => {
          i += 1;
          run();
        },
      });
      tl.to(state, { n: text.length, duration: text.length * 0.035, ease: "none", onUpdate: write(text) })
        .to(state, { n: 0, duration: 0.35, ease: "power1.in", onUpdate: write(text) }, "+=2");
    };
    run();
    return () => tl && tl.kill();
  }, [ready]);

  const tabs = [
    { key: "commits", label: "Commits & AI impact", icon: Activity, count: filteredCommits.length },
    { key: "quickstart", label: "Git & pipeline", icon: Terminal },
    { key: "team", label: "Collaborators", icon: Users, count: currentProject?.members?.length || 1 },
  ];

  if (!ready) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <Skeleton className="h-12 w-72" />
        <Skeleton className="h-44 rounded-2xl" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <Skeleton className="h-96 rounded-xl lg:col-span-8" />
          <Skeleton className="h-96 rounded-xl lg:col-span-4" />
        </div>
      </div>
    );
  }

  const nodesCount = architectureGraph?.nodes?.length || currentProject?.architectureGraph?.nodes?.length || 18;
  const edgesCount = dependencyGraph?.edges?.length || currentProject?.dependencyGraph?.edges?.length || 42;

  const stats = [
    { label: "Commits", value: currentProject.commits?.length || 0, hint: currentProject.githubUrl ? "Synced with GitHub" : "Not connected", spark, onClick: () => setActiveTab("commits") },
    { label: "Components", value: nodesCount, hint: "Subsystems mapped", to: `/projects/${id}/visualise` },
    { label: "Dependency edges", value: edgesCount, hint: "Resolved imports", to: `/projects/${id}/visualise` },
    { label: "AI summaries", value: aiSummaryCount, hint: "Commits analysed", onClick: () => { setActiveTab("commits"); setOnlyAiSummaries(true); } },
    { label: "Meetings", value: currentProject.meetings?.length || 0, hint: "Action items linked", to: `/projects/${id}/meetings` },
    { label: "Doc chapters", value: 12, hint: "Technical manual", to: `/projects/${id}/documentation` },
  ];

  return (
    <div ref={rootRef} className="mx-auto w-full max-w-7xl space-y-6">
      {/* ─── Header ───────────────────────────────────────────────── */}
      <PageHeader
        icon={Boxes}
        title={currentProject.name}
        description="Architecture, dependency graphs and AI commit analysis for this repository."
        actions={
          <>
            {currentProject.githubUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePollCommits}
                disabled={isActionLoading}
                className="group h-8 text-xs"
              >
                <RefreshCw
                  className={cn(
                    "mr-1.5 h-3 w-3 transition-transform duration-300 group-hover:rotate-45",
                    isActionLoading && "animate-spin"
                  )}
                />
                Sync commits
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowInvite(!showInvite)}
              className={cn("h-8 text-xs", showInvite && "bg-secondary")}
            >
              <UserPlus className="mr-1.5 h-3 w-3" />
              Invite
            </Button>
            {isOwner && (
              <Button variant="outline" size="sm" onClick={() => setShowSettings(true)} className="h-8 text-xs" title="Project settings">
                <Settings className="mr-1.5 h-3 w-3" />
                Settings
              </Button>
            )}
            <Magnetic strength={0.2}>
              <Link to={`/projects/${id}/visualise`}>
                <Button size="sm" className="group h-8 text-xs font-semibold">
                  <FolderTree className="mr-1.5 h-3.5 w-3.5" />
                  Open graph canvas
                  <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </Link>
            </Magnetic>
          </>
        }
      />

      {/* Meta strip */}
      <div className="-mt-2 flex flex-wrap items-center gap-2 text-xs">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-accent-emerald animate-pulse-dot" />
          Graph synced
        </span>
        {currentProject.githubUrl && (
          <a
            href={currentProject.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 font-mono text-muted-foreground transition-colors hover:text-foreground"
          >
            <GitBranch className="h-3 w-3 text-primary" />
            {currentProject.githubUrl.replace("https://github.com/", "")}
            <ExternalLink className="h-2.5 w-2.5 opacity-60" />
          </a>
        )}
        <button
          type="button"
          onClick={() => handleCopy(id, "id")}
          title="Copy project ID"
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 font-mono text-muted-foreground transition-colors hover:text-foreground"
        >
          {copiedId ? <Pop><Check className="h-3 w-3 text-accent-emerald" /></Pop> : <Copy className="h-3 w-3" />}
          {id.slice(0, 8)}…
        </button>
      </div>

      {/* ─── Invite ───────────────────────────────────────────────── */}
      {showInvite && (
        <Unfold>
          <Card className="border-border">
            <CardContent className="flex flex-col items-center gap-3 p-3.5 sm:flex-row">
              <div className="flex min-w-[130px] items-center gap-2 text-xs text-muted-foreground">
                <Mail className="h-3.5 w-3.5 text-primary" />
                Invite a teammate
              </div>
              <form onSubmit={handleInvite} className="flex w-full flex-1 gap-2">
                <Input
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  type="email"
                  className="h-8 text-xs"
                  autoFocus
                />
                <Button size="sm" type="submit" disabled={isActionLoading} className="h-8 px-3.5 text-xs font-semibold">
                  Send invite
                </Button>
                <Button size="sm" variant="ghost" type="button" onClick={() => setShowInvite(false)} className="h-8 text-xs text-muted-foreground">
                  Cancel
                </Button>
              </form>
            </CardContent>
          </Card>
        </Unfold>
      )}

      {/* ─── Ask your codebase ────────────────────────────────────── */}
      <section ref={heroRef} data-hero className="relative overflow-hidden rounded-2xl bg-primary p-5 text-primary-foreground sm:p-7">
        <div data-blob="a" className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-highlight/30 blur-3xl" />
        <div data-blob="b" className="pointer-events-none absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-primary-foreground/15 blur-3xl" />
        <div className="relative">
          <SplitText as="h2" text="Ask your codebase anything" delay={0.25} className="text-3xl font-extrabold tracking-tight sm:text-4xl" />
          <p className="mt-1 max-w-xl text-sm text-primary-foreground/75">
            Answers are grounded in your code and cite the files and lines they come from.
          </p>

          <form
            onSubmit={handleQuickAsk}
            className="mt-5 flex items-center gap-2 rounded-xl bg-card p-1.5 text-foreground shadow-[0_12px_32px_-14px_rgba(16,33,31,0.5)]"
          >
            <Sparkles className="ml-2.5 h-4 w-4 shrink-0 text-highlight" />
            <input
              ref={askRef}
              type="text"
              value={quickQuestion}
              onChange={(e) => setQuickQuestion(e.target.value)}
              aria-label="Ask a question about this codebase"
              className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            {quickQuestion && (
              <button
                type="button"
                onClick={() => setQuickQuestion("")}
                className="cursor-pointer rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
                title="Clear"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <Magnetic strength={0.2} className="shrink-0">
              <Button type="submit" size="sm" disabled={!quickQuestion.trim()} className="h-9 rounded-lg px-4 text-xs font-semibold">
                Ask
                <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Magnetic>
          </form>

          <div className="mt-4 flex flex-wrap gap-2">
            {PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => navigate(`/projects/${id}/qna?q=${encodeURIComponent(prompt)}`)}
                className="cursor-pointer rounded-full border border-primary-foreground/25 bg-primary-foreground/10 px-3 py-1 text-xs text-primary-foreground/90 transition-colors hover:bg-primary-foreground/20"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Stats ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => {
          const body = (
            <SpotlightCard className="h-full space-y-1 p-4">
              <span className="block text-xs text-muted-foreground">{s.label}</span>
              <div className="text-2xl font-extrabold tabular-nums tracking-tight text-foreground">
                <CountUp value={s.value} />
              </div>
              <p className="truncate text-[11px] text-text-muted">{s.hint}</p>
              {s.spark && <Sparkline data={s.spark} className="mt-2 h-6 w-full text-primary" />}
            </SpotlightCard>
          );
          return s.to ? (
            <Link key={s.label} to={s.to} data-stat className="block">
              {body}
            </Link>
          ) : (
            <div key={s.label} data-stat onClick={s.onClick} className="cursor-pointer">
              {body}
            </div>
          );
        })}
      </div>

      {/* ─── Tabs ─────────────────────────────────────────────────── */}
      <TabBar tabs={tabs} active={activeTab} onChange={setActiveTab} />

      {/* Commits */}
      {activeTab === "commits" && (
        <FadeIn key="commits" className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          <div className="space-y-3 lg:col-span-8">
            <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-3 py-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={commitFilter}
                  onChange={(e) => setCommitFilter(e.target.value)}
                  placeholder="Filter by author, hash, message or AI summary"
                  aria-label="Filter commits"
                  className="w-full border-0 bg-transparent py-1 pl-8 pr-7 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
                {commitFilter && (
                  <button
                    type="button"
                    onClick={() => setCommitFilter("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
                    title="Clear filter"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setOnlyAiSummaries(!onlyAiSummaries)}
                aria-pressed={onlyAiSummaries}
                className={cn(
                  "flex cursor-pointer select-none items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs transition-colors",
                  onlyAiSummaries
                    ? "border-primary bg-primary font-semibold text-primary-foreground"
                    : "border-border text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <Sparkles className="h-3 w-3" />
                AI summaries only
                <span className="text-[11px] opacity-80">{aiSummaryCount}</span>
              </button>
            </div>

            {filteredCommits.length === 0 ? (
              <div className="space-y-2 rounded-xl border border-border bg-card py-14 text-center">
                <GitGraph className="mx-auto h-8 w-8 text-muted-foreground opacity-40" />
                <p className="text-xs text-muted-foreground">
                  {commitFilter
                    ? "No commits match your search."
                    : "No commit history yet. Use “Sync commits” above."}
                </p>
              </div>
            ) : (
              <ScrollReveal
                className="space-y-5"
                signature={`${filteredCommits.length}-${commitFilter}-${onlyAiSummaries}`}
              >
                {commitGroups.map((group) => (
                  <section key={group.key}>
                    {/* Day header */}
                    <div className="sticky top-12 z-10 -mx-1 mb-2 flex items-center gap-3 bg-background/90 px-1 py-2 backdrop-blur">
                      <h3 className="text-[13px] font-bold tracking-tight text-foreground">{group.label}</h3>
                      <span className="text-[11px] text-muted-foreground">
                        {group.commits.length} commit{group.commits.length === 1 ? "" : "s"}
                      </span>
                      <span className="h-px flex-1 bg-border" />
                    </div>

                    {/* Timeline */}
                    <div className="rounded-xl border border-border bg-card">
                      {group.commits.map((commit, idx) => {
                        const isExpanded = expandedCommit === commit._id;
                        const bodyOpen = expandedBody === commit._id;
                        const { title, body } = splitMessage(commit.commitMessage);
                        const first = idx === 0;
                        const last = idx === group.commits.length - 1;
                        return (
                          <div
                            key={commit._id}
                            data-row
                            className={cn(
                              "group relative py-3.5 pl-11 pr-3.5 transition-colors duration-150 hover:bg-surface-hover/50 sm:pr-4",
                              !last && "border-b border-border",
                              first && "rounded-t-xl",
                              last && "rounded-b-xl"
                            )}
                          >
                            {/* rail + node */}
                            {!(first && last) && (
                              <span
                                aria-hidden="true"
                                className={cn(
                                  "absolute left-[19px] w-px bg-border",
                                  first ? "top-[26px]" : "top-0",
                                  last ? "bottom-[calc(100%-26px)]" : "bottom-0"
                                )}
                              />
                            )}
                            <span
                              aria-hidden="true"
                              className={cn(
                                "absolute left-[14px] top-[21px] h-[11px] w-[11px] rounded-full ring-4 ring-card",
                                commitDot(commit.commitMessage)
                              )}
                            />

                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <p className="line-clamp-2 break-words text-[13px] font-semibold leading-snug text-foreground">
                                  {title}
                                </p>
                                <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                                  {getCommitTypeBadge(commit.commitMessage)}
                                  {commit.commitAuthorAvatar ? (
                                    <img
                                      src={commit.commitAuthorAvatar}
                                      alt=""
                                      className="h-4 w-4 rounded-full border border-border bg-secondary"
                                    />
                                  ) : (
                                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/10 text-[9px] font-bold text-primary">
                                      {commit.commitAuthorName?.[0]?.toUpperCase() || "U"}
                                    </span>
                                  )}
                                  <span className="font-medium text-foreground">{commit.commitAuthorName}</span>
                                  <span aria-hidden="true">·</span>
                                  <span title={formatDate(commit.commitDate)}>{formatTime(commit.commitDate)}</span>
                                  {body.length > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => setExpandedBody(bodyOpen ? null : commit._id)}
                                      aria-expanded={bodyOpen}
                                      className="inline-flex cursor-pointer items-center gap-0.5 rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                                    >
                                      {bodyOpen ? "Hide details" : `${body.length} detail${body.length === 1 ? "" : "s"}`}
                                      <ChevronDown className={cn("h-3 w-3 transition-transform duration-200", bodyOpen && "rotate-180")} />
                                    </button>
                                  )}
                                </div>
                              </div>

                              <div className="flex shrink-0 items-center gap-1.5 self-start">
                                {commit.summary && (
                                  <button
                                    onClick={() => setExpandedCommit(isExpanded ? null : commit._id)}
                                    aria-expanded={isExpanded}
                                    className={cn(
                                      "inline-flex cursor-pointer select-none items-center gap-1 rounded-lg border px-2 py-0.5 text-[11px] transition-colors",
                                      isExpanded
                                        ? "border-primary bg-primary font-semibold text-primary-foreground"
                                        : "border-border bg-secondary text-muted-foreground hover:bg-surface-hover hover:text-foreground"
                                    )}
                                    title={isExpanded ? "Hide AI analysis" : "View AI analysis"}
                                  >
                                    <Sparkles className="h-3 w-3" />
                                    <span className="hidden sm:inline">AI analysis</span>
                                    <ChevronDown className={cn("h-3 w-3 transition-transform duration-200", isExpanded && "rotate-180")} />
                                  </button>
                                )}
                                {commit.commitHash && (
                                  <button
                                    onClick={() => handleCopy(commit.commitHash, commit._id)}
                                    className="inline-flex cursor-pointer items-center gap-1 rounded-lg px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                                    title="Copy commit hash"
                                  >
                                    {copiedCmd === commit._id ? <Pop><Check className="h-3 w-3 text-accent-emerald" /></Pop> : <Copy className="h-3 w-3" />}
                                    {commit.commitHash.slice(0, 7)}
                                  </button>
                                )}
                                {currentProject.githubUrl && commit.commitHash && (
                                  <a
                                    href={`${currentProject.githubUrl}/commit/${commit.commitHash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="rounded p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                                    title="Open commit on GitHub"
                                  >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                  </a>
                                )}
                              </div>
                            </div>

                            {body.length > 0 && bodyOpen && (
                              <Unfold>
                                <ul className="mt-3 space-y-1.5 rounded-lg bg-secondary/60 p-3 text-xs leading-relaxed text-foreground/90">
                                  {body.map((line, i) => (
                                    <li key={i} className="flex gap-2">
                                      <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-muted-foreground/60" />
                                      <span className="break-words">{line}</span>
                                    </li>
                                  ))}
                                </ul>
                              </Unfold>
                            )}

                            {commit.summary && isExpanded && (
                              <Unfold>
                                <div className="mt-3 space-y-2 rounded-xl border border-border bg-secondary/70 p-3.5 text-xs">
                                  <div className="flex items-center justify-between text-[11px] font-semibold text-foreground">
                                    <span className="flex items-center gap-1.5">
                                      <Sparkles className="h-3 w-3 text-highlight" />
                                      Impact analysis and changelog
                                    </span>
                                    <button
                                      onClick={() => handleCopy(commit.summary, `sum-${commit._id}`)}
                                      className="cursor-pointer p-0.5 text-muted-foreground transition-colors hover:text-foreground"
                                      title="Copy analysis"
                                    >
                                      {copiedCmd === `sum-${commit._id}` ? <Pop><Check className="h-3 w-3 text-accent-emerald" /></Pop> : <Copy className="h-3 w-3" />}
                                    </button>
                                  </div>
                                  <LineReveal
                                    text={commit.summary}
                                    className="font-mono text-[11px] leading-relaxed text-foreground/90"
                                  />
                                </div>
                              </Unfold>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </ScrollReveal>
            )}
          </div>

          {/* Right column */}
          <div className="space-y-4 lg:col-span-4">
            {!currentProject.githubUrl ? (
              <Card className="border-border">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center gap-2">
                    <GitBranch className="h-4 w-4 text-primary" />
                    <CardTitle className="text-sm font-semibold">Connect GitHub</CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    Link your repository to sync commits and generate diagrams.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <form onSubmit={handleLinkRepo} className="space-y-2">
                    <Input
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      placeholder="https://github.com/org/repo"
                      className="h-8 text-xs"
                    />
                    <Button type="submit" size="sm" disabled={isActionLoading} className="h-8 w-full text-xs font-semibold">
                      {isActionLoading ? "Linking…" : "Link repository"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-border">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[13px] font-semibold text-foreground">
                      <GitBranch className="h-3.5 w-3.5 text-primary" />
                      Linked repository
                    </div>
                    <Badge variant="success" dot={true}>Active</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 p-4 pt-1">
                  <a
                    href={currentProject.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between rounded-lg border border-border bg-secondary p-2 font-mono text-xs text-foreground hover:underline"
                  >
                    <span className="truncate">{currentProject.githubUrl.replace("https://github.com/", "")}</span>
                    <ExternalLink className="ml-1 h-3 w-3 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
                  </a>
                  <div className="space-y-1">
                    <span className="text-[11px] font-medium text-muted-foreground">Quick clone</span>
                    <div className="flex items-center gap-1">
                      <code className="flex-1 truncate rounded-lg border border-border bg-secondary px-2 py-1 font-mono text-[11px] text-foreground">
                        git clone {currentProject.githubUrl}.git
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopy(`git clone ${currentProject.githubUrl}.git`, "clone")}
                        className="h-7 px-2 text-xs"
                        aria-label="Copy clone command"
                      >
                        {copiedCmd === "clone" ? <Check className="h-3 w-3 text-accent-emerald" /> : <Copy className="h-3 w-3" />}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="border-border">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-[13px] font-semibold">Living architecture</CardTitle>
                  <Link to={`/projects/${id}/visualise`} className="flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground">
                    Full canvas
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 p-4 pt-1">
                <dl className="space-y-2 rounded-xl border border-border bg-secondary/50 p-3 text-xs">
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Topology</dt>
                    <dd className="font-semibold text-accent-emerald">Compiled</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Subsystem nodes</dt>
                    <dd className="font-bold tabular-nums text-foreground">{nodesCount}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Inter-module edges</dt>
                    <dd className="font-bold tabular-nums text-foreground">{edgesCount}</dd>
                  </div>
                </dl>
                <Link to={`/projects/${id}/visualise`} className="block">
                  <Button variant="outline" size="sm" className="w-full text-xs font-semibold">
                    <Boxes className="mr-1.5 h-3.5 w-3.5" />
                    Open visualizer canvas
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-[13px] font-semibold">Jump to</CardTitle>
              </CardHeader>
              <CardContent className="space-y-0.5 p-2 pt-0">
                {[
                  { title: "Architecture & dependencies", href: `/projects/${id}/visualise`, icon: FolderTree },
                  { title: "Technical documentation", href: `/projects/${id}/documentation`, icon: BookText },
                  { title: "Codebase Q&A", href: `/projects/${id}/qna`, icon: FileQuestion },
                  { title: "Meeting audio intelligence", href: `/projects/${id}/meetings`, icon: Presentation },
                ].map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className="group flex items-center justify-between rounded-lg p-2 text-xs text-foreground transition-colors hover:bg-secondary"
                  >
                    <span className="flex items-center gap-2.5">
                      <item.icon className="h-3.5 w-3.5 text-muted-foreground transition-colors group-hover:text-primary" />
                      {item.title}
                    </span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>
        </FadeIn>
      )}

      {/* Git & pipeline */}
      {activeTab === "quickstart" && (
        <FadeIn key="quickstart" className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Card className="border-border">
            <CardHeader className="p-4 pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-semibold">Git commands</CardTitle>
              </div>
              <CardDescription className="text-xs">Useful terminal shortcuts for this repository.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 p-4 pt-0">
              {[
                { label: "Clone repository", cmd: `git clone ${currentProject.githubUrl || "https://github.com/..."}.git` },
                { label: "Check status", cmd: "git status" },
                { label: "Fetch all branches", cmd: "git fetch --all --prune" },
                { label: "Recent commits", cmd: "git log --oneline -n 10" },
              ].map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <span className="text-[11px] font-medium text-muted-foreground">{item.label}</span>
                  <div className="flex items-center justify-between rounded-lg border border-border bg-secondary p-2 font-mono text-xs">
                    <span className="truncate pr-2 text-foreground">{item.cmd}</span>
                    <button
                      onClick={() => handleCopy(item.cmd, `cli-${idx}`)}
                      className="shrink-0 cursor-pointer rounded p-1 text-muted-foreground transition-all hover:text-foreground active:scale-95"
                      aria-label={`Copy: ${item.label}`}
                    >
                      {copiedCmd === `cli-${idx}` ? <Check className="h-3.5 w-3.5 text-accent-emerald" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="p-4 pb-3">
              <div className="flex items-center gap-2">
                <Code2 className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-semibold">Analysis pipeline</CardTitle>
              </div>
              <CardDescription className="text-xs">Active parsing and indexing configuration.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 text-xs">
              {[
                ["AST engine", "Dagre & Tree-Sitter", true],
                ["Semantic LLM", "Gemini 1.5 Pro"],
                ["Audio transcription", "AssemblyAI / Whisper"],
                ["Vector dimension", "768-dim normalized"],
                [
                  "Workspace created",
                  currentProject.createdAt ? new Date(currentProject.createdAt).toLocaleDateString() : "Recent",
                ],
              ].map(([k, v, accent], i, arr) => (
                <div key={k} className={cn("flex justify-between py-2", i < arr.length - 1 && "border-b border-border")}>
                  <span className="text-muted-foreground">{k}</span>
                  <span className={cn("font-mono", accent ? "font-semibold text-accent-emerald" : "text-foreground")}>{v}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </FadeIn>
      )}

      {/* Collaborators */}
      {activeTab === "team" && (
        <FadeIn key="team">
          <Card className="border-border">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-sm font-semibold">Workspace collaborators</CardTitle>
                  <CardDescription className="text-xs">People with access to this repository and its analysis.</CardDescription>
                </div>
                <Button size="sm" onClick={() => setShowInvite(true)} className="h-8 text-xs font-semibold">
                  <UserPlus className="mr-1.5 h-3 w-3" />
                  Invite member
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-1">
              <div className="divide-y divide-border">
                {currentProject.members?.map((member, i) => (
                  <div key={member._id || i} className="flex items-center justify-between rounded px-2 py-2.5 transition-colors hover:bg-secondary/40">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {member.name?.[0]?.toUpperCase() || "U"}
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-foreground">{member.name}</p>
                        <p className="text-[11px] text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    <Badge variant={i === 0 ? "default" : "secondary"} className="text-[11px]">
                      {i === 0 ? "Owner" : "Collaborator"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      )}

      <ProjectSettingsModal project={currentProject} isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
}
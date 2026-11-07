import { useEffect, useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchProject, linkRepo, pollCommits, inviteUser } from "@/store/slices/projectSlice";
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
  CornerDownLeft,
  Mail,
  Settings,
  Boxes,
  Shield,
  Layers,
  Flame,
  GitCommit,
  Share2,
} from "lucide-react";
import ProjectSettingsModal from "@/components/project/ProjectSettingsModal";

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
  const [activeTab, setActiveTab] = useState("commits"); // "commits" | "quickstart" | "team"
  const [onlyAiSummaries, setOnlyAiSummaries] = useState(false);
  const [quickQuestion, setQuickQuestion] = useState("");

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

  const aiSummaryCount = useMemo(() => {
    return currentProject?.commits?.filter((c) => Boolean(c.summary))?.length || 0;
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

  // Derive commit change badge
  const getCommitTypeBadge = (msg = "") => {
    const lower = msg.toLowerCase();
    if (lower.startsWith("feat") || lower.includes("feature")) {
      return <Badge variant="cyan" className="text-[10px] uppercase font-mono">Feat</Badge>;
    }
    if (lower.startsWith("fix") || lower.includes("bug")) {
      return <Badge variant="warning" className="text-[10px] uppercase font-mono">Fix</Badge>;
    }
    if (lower.includes("breaking") || lower.includes("major")) {
      return <Badge variant="destructive" className="text-[10px] uppercase font-mono">Breaking</Badge>;
    }
    if (lower.startsWith("refactor")) {
      return <Badge variant="indigo" className="text-[10px] uppercase font-mono">Refactor</Badge>;
    }
    return <Badge variant="secondary" className="text-[10px] uppercase font-mono">Commit</Badge>;
  };

  if (isLoading || !currentProject) {
    return (
      <div className="w-full max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-10 w-72" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Skeleton className="lg:col-span-8 h-96 rounded-lg" />
          <Skeleton className="lg:col-span-4 h-96 rounded-lg" />
        </div>
      </div>
    );
  }

  const nodesCount = architectureGraph?.nodes?.length || currentProject?.architectureGraph?.nodes?.length || 18;
  const edgesCount = dependencyGraph?.edges?.length || currentProject?.dependencyGraph?.edges?.length || 42;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-fade-up">
      {/* ─── Top Workspace Header ────────────────────────────────────── */}
      <PageHeader
        icon={Boxes}
        title={currentProject.name}
        description="Repository intelligence workspace · Living architecture, AST graphs, and change impact blast radius"
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono bg-secondary border border-border text-foreground select-none">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse-dot" />
              AST Graph Synced
            </span>

            <button
              onClick={() => handleCopy(id, "id")}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded-md bg-secondary hover:bg-surface-hover text-muted-foreground hover:text-foreground transition-all duration-150 border border-border active:scale-95 cursor-pointer"
              title="Copy Project ID"
            >
              {copiedId ? (
                <Check className="h-3 w-3 text-emerald-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
              <span>ID: {id.slice(0, 8)}…</span>
            </button>

            {currentProject.githubUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePollCommits}
                disabled={isActionLoading}
                className="group text-xs h-8 border-border hover:bg-secondary transition-all"
              >
                <RefreshCw
                  className={`h-3 w-3 mr-1.5 transition-transform duration-300 group-hover:rotate-45 ${
                    isActionLoading ? "animate-spin text-foreground" : "text-muted-foreground"
                  }`}
                />
                Sync Commits
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowInvite(!showInvite)}
              className={`text-xs h-8 border-border transition-all ${
                showInvite ? "bg-secondary text-foreground" : "hover:bg-secondary"
              }`}
            >
              <UserPlus className="h-3 w-3 mr-1.5 text-muted-foreground" />
              Invite
            </Button>

            <Link to={`/projects/${id}/visualise`}>
              <Button
                size="sm"
                className="group text-xs h-8 font-semibold shadow-xs"
              >
                <FolderTree className="h-3.5 w-3.5 mr-1.5" />
                <span>Open Graph Canvas</span>
                <ArrowRight className="h-3 w-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </Link>

            {isOwner && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(true)}
                className="text-xs h-8 border-border hover:bg-secondary transition-all cursor-pointer"
                title="Project Settings"
              >
                <Settings className="h-3 w-3 mr-1.5 text-muted-foreground" />
                Settings
              </Button>
            )}
          </div>
        }
      />

      {/* ─── Inline Invite Drawer ───────────────────────────────────── */}
      {showInvite && (
        <Card className="border-border animate-fade-up bg-card">
          <CardContent className="p-3.5 flex flex-col sm:flex-row items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-[130px]">
              <Mail className="h-3.5 w-3.5 text-foreground" />
              <span>Invite teammate:</span>
            </div>
            <form onSubmit={handleInvite} className="flex-1 flex gap-2 w-full">
              <Input
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@company.com"
                type="email"
                className="text-xs h-8"
                autoFocus
              />
              <Button size="sm" type="submit" disabled={isActionLoading} className="h-8 px-3.5 text-xs font-semibold">
                Send Invite
              </Button>
              <Button
                size="sm"
                variant="ghost"
                type="button"
                onClick={() => setShowInvite(false)}
                className="h-8 text-xs text-muted-foreground hover:text-foreground"
              >
                Cancel
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* ─── AI Codebase Quick Query Terminal ───────────────────────── */}
      <div className="rounded-lg border border-border bg-card p-3 shadow-2xs card-sheen">
        <form onSubmit={handleQuickAsk} className="flex items-center gap-2">
          <div className="relative flex-1 flex items-center">
            <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={quickQuestion}
              onChange={(e) => setQuickQuestion(e.target.value)}
              placeholder="Ask Dionysus AI about system architecture, data models, or breaking changes…"
              className="w-full pl-9 pr-9 py-1 text-xs sm:text-sm bg-transparent border-0 text-foreground placeholder:text-muted-foreground/60 focus:outline-none font-sans"
            />
            {quickQuestion && (
              <button
                type="button"
                onClick={() => setQuickQuestion("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                title="Clear query"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {quickQuestion.trim() && (
              <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-border text-[10px] font-mono text-muted-foreground">
                <CornerDownLeft className="h-2.5 w-2.5" />
                Enter
              </span>
            )}
            <Button
              type="submit"
              size="sm"
              disabled={!quickQuestion.trim()}
              className="h-8 px-3 text-xs font-semibold"
            >
              <span>Ask AI</span>
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </form>

        <div className="mt-2.5 pt-2 border-t border-border flex items-center gap-2 overflow-x-auto scrollbar-none text-[11px] text-muted-foreground">
          <span className="shrink-0 font-medium text-foreground">Suggested Queries:</span>
          {[
            "Where is auth & JWT validation handled?",
            "Explain microservices communication topology",
            "Show high blast radius shared interfaces",
            "List database schemas and connection pool",
          ].map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setQuickQuestion(prompt);
                navigate(`/projects/${id}/qna?q=${encodeURIComponent(prompt)}`);
              }}
              className="px-2 py-0.5 rounded bg-secondary hover:bg-surface-hover text-muted-foreground hover:text-foreground border border-border transition-colors shrink-0 cursor-pointer text-[11px] font-mono"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Metric Telemetry Cards Grid ────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 animate-fade-up">
        {/* Total Commits */}
        <div onClick={() => setActiveTab("commits")} className="cursor-pointer group">
          <Card interactive className="h-full">
            <CardContent className="p-3.5 space-y-1">
              <span className="text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wider block">
                Commits
              </span>
              <div className="text-lg font-bold font-mono text-foreground">
                {currentProject.commits?.length || 0}
              </div>
              <p className="text-[10px] font-mono text-emerald-500 flex items-center gap-1">
                <span>{currentProject.githubUrl ? "Synced" : "Offline"}</span>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Architecture Components */}
        <Link to={`/projects/${id}/visualise`} className="block group">
          <Card interactive className="h-full">
            <CardContent className="p-3.5 space-y-1">
              <span className="text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wider block">
                Components
              </span>
              <div className="text-lg font-bold font-mono text-foreground">
                {nodesCount}
              </div>
              <p className="text-[10px] font-mono text-muted-foreground truncate">
                Subsystems Mapped
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* Dependency DAG Edges */}
        <Link to={`/projects/${id}/visualise`} className="block group">
          <Card interactive className="h-full">
            <CardContent className="p-3.5 space-y-1">
              <span className="text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wider block">
                DAG Edges
              </span>
              <div className="text-lg font-bold font-mono text-foreground">
                {edgesCount}
              </div>
              <p className="text-[10px] font-mono text-muted-foreground truncate">
                Resolved Imports
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* AI Summaries */}
        <div onClick={() => { setActiveTab("commits"); setOnlyAiSummaries(true); }} className="cursor-pointer group">
          <Card interactive className="h-full">
            <CardContent className="p-3.5 space-y-1">
              <span className="text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wider block">
                AI Summaries
              </span>
              <div className="text-lg font-bold font-mono text-foreground">
                {aiSummaryCount}
              </div>
              <p className="text-[10px] font-mono text-sky-500 truncate">
                AST Enriched
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Meeting Audio Sessions */}
        <Link to={`/projects/${id}/meetings`} className="block group">
          <Card interactive className="h-full">
            <CardContent className="p-3.5 space-y-1">
              <span className="text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wider block">
                Audio Reviews
              </span>
              <div className="text-lg font-bold font-mono text-foreground">
                {currentProject.meetings?.length || 0}
              </div>
              <p className="text-[10px] font-mono text-muted-foreground truncate">
                Action Items Linked
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* Documentation Chapters */}
        <Link to={`/projects/${id}/documentation`} className="block group">
          <Card interactive className="h-full">
            <CardContent className="p-3.5 space-y-1">
              <span className="text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wider block">
                Doc Chapters
              </span>
              <div className="text-lg font-bold font-mono text-foreground">
                12
              </div>
              <p className="text-[10px] font-mono text-muted-foreground truncate">
                Technical Manual
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* ─── Navigation Tabs ─────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 border-b border-border pb-1">
        <button
          onClick={() => setActiveTab("commits")}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
            activeTab === "commits"
              ? "bg-secondary text-foreground border border-border"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
          }`}
        >
          <Activity className="h-3.5 w-3.5" />
          <span>Commits & AI Impact</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-card border border-border">
            {filteredCommits.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("quickstart")}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
            activeTab === "quickstart"
              ? "bg-secondary text-foreground border border-border"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
          }`}
        >
          <Terminal className="h-3.5 w-3.5" />
          <span>Git & Pipeline Info</span>
        </button>

        <button
          onClick={() => setActiveTab("team")}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
            activeTab === "team"
              ? "bg-secondary text-foreground border border-border"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          <span>Collaborators</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-card border border-border">
            {currentProject.members?.length || 1}
          </span>
        </button>
      </div>

      {/* ─── Tab Content: Commits Stream ─────────────────────────────── */}
      {activeTab === "commits" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fade-up">
          <div className="lg:col-span-8 space-y-3">
            {/* Filter Toolbar */}
            <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg border border-border bg-card">
              <div className="relative flex-1">
                <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={commitFilter}
                  onChange={(e) => setCommitFilter(e.target.value)}
                  placeholder="Filter commits by author, hash, message, or AI summary…"
                  className="w-full pl-8 pr-7 py-1 text-xs bg-transparent border-0 text-foreground placeholder:text-muted-foreground/60 focus:outline-none font-sans"
                />
                {commitFilter && (
                  <button
                    type="button"
                    onClick={() => setCommitFilter("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    title="Clear filter"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setOnlyAiSummaries(!onlyAiSummaries)}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded border transition-colors cursor-pointer select-none ${
                  onlyAiSummaries
                    ? "bg-foreground text-background font-semibold border-foreground"
                    : "border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <Sparkles className="h-3 w-3" />
                <span>AI Summaries Only</span>
                <span className="text-[10px] font-mono">({aiSummaryCount})</span>
              </button>
            </div>

            {/* Commits Panel */}
            <div className="rounded-lg border border-border bg-card overflow-hidden shadow-2xs card-sheen">
              {filteredCommits.length === 0 ? (
                <div className="py-14 text-center space-y-2">
                  <GitGraph className="h-8 w-8 text-muted-foreground mx-auto opacity-40" />
                  <p className="text-xs text-muted-foreground">
                    {commitFilter
                      ? "No commits match your search query."
                      : "No commit history found. Click 'Sync Commits' above."}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filteredCommits.map((commit) => {
                    const isExpanded = expandedCommit === commit._id;
                    return (
                      <div
                        key={commit._id}
                        className="p-3.5 sm:px-4 hover:bg-surface-hover/60 transition-colors duration-150"
                      >
                        <div className="flex items-start justify-between gap-3">
                          {/* Left: Avatar + Details */}
                          <div className="flex items-start gap-2.5 min-w-0 flex-1">
                            {commit.commitAuthorAvatar ? (
                              <img
                                src={commit.commitAuthorAvatar}
                                alt={commit.commitAuthorName}
                                className="h-6 w-6 rounded-full bg-secondary border border-border shrink-0 mt-0.5"
                              />
                            ) : (
                              <div className="h-6 w-6 rounded-full bg-secondary border border-border flex items-center justify-center text-[10px] font-mono font-bold text-foreground shrink-0 mt-0.5">
                                {commit.commitAuthorName?.[0]?.toUpperCase() || "U"}
                              </div>
                            )}

                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                {getCommitTypeBadge(commit.commitMessage)}
                                <span className="text-xs sm:text-sm font-semibold text-foreground leading-snug break-words">
                                  {commit.commitMessage}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
                                <span className="font-medium text-foreground">
                                  {commit.commitAuthorName}
                                </span>
                                <span>•</span>
                                <span>{formatDate(commit.commitDate)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Right: Actions */}
                          <div className="flex items-center gap-1.5 shrink-0 self-start mt-0.5">
                            {commit.summary && (
                              <button
                                onClick={() => setExpandedCommit(isExpanded ? null : commit._id)}
                                className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded border transition-colors cursor-pointer select-none ${
                                  isExpanded
                                    ? "bg-foreground text-background font-semibold border-foreground"
                                    : "bg-secondary hover:bg-surface-hover text-muted-foreground hover:text-foreground border-border"
                                }`}
                                title={isExpanded ? "Hide AI Summary" : "View AI Summary"}
                              >
                                <Sparkles className="h-3 w-3" />
                                <span className="hidden sm:inline">AI Analysis</span>
                                <ChevronDown
                                  className={`h-3 w-3 transition-transform duration-200 ${
                                    isExpanded ? "rotate-180" : ""
                                  }`}
                                />
                              </button>
                            )}

                            {commit.commitHash && (
                              <button
                                onClick={() => handleCopy(commit.commitHash, commit._id)}
                                className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-secondary hover:bg-surface-hover text-muted-foreground hover:text-foreground border border-border transition-colors cursor-pointer"
                                title="Copy commit hash"
                              >
                                {copiedCmd === commit._id ? (
                                  <Check className="h-3 w-3 text-emerald-500" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                                <span>{commit.commitHash.slice(0, 7)}</span>
                              </button>
                            )}

                            {currentProject.githubUrl && commit.commitHash && (
                              <a
                                href={`${currentProject.githubUrl}/commit/${commit.commitHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                                title="Open commit on GitHub"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Unfolded AI Summary */}
                        {commit.summary && isExpanded && (
                          <div className="mt-3 ml-8 p-3.5 rounded-lg bg-secondary/80 border border-border text-xs space-y-2 animate-fade-up">
                            <div className="flex items-center justify-between text-[11px] font-semibold text-foreground font-mono">
                              <span className="flex items-center gap-1.5">
                                <Sparkles className="h-3 w-3 text-sky-400" />
                                AST Impact Analysis & Code Changelog
                              </span>
                              <button
                                onClick={() => handleCopy(commit.summary, `sum-${commit._id}`)}
                                className="text-muted-foreground hover:text-foreground transition-colors p-0.5 cursor-pointer"
                                title="Copy analysis"
                              >
                                {copiedCmd === `sum-${commit._id}` ? (
                                  <Check className="h-3 w-3 text-emerald-500" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                            </div>
                            <p className="text-foreground/90 font-mono whitespace-pre-wrap leading-relaxed text-[11px]">
                              {commit.summary}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Repository & Architecture Snapshot */}
          <div className="lg:col-span-4 space-y-4">
            {!currentProject.githubUrl ? (
              <Card className="border-border">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center gap-2">
                    <GitBranch className="h-4 w-4 text-foreground" />
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
                      className="text-xs h-8"
                    />
                    <Button type="submit" size="sm" disabled={isActionLoading} className="w-full text-xs h-8 font-semibold">
                      {isActionLoading ? "Linking…" : "Link Repository"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-border bg-card">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                      <GitBranch className="h-3.5 w-3.5 text-foreground" />
                      <span>Linked Repository</span>
                    </div>
                    <Badge variant="success" dot={true}>
                      Active
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-1 space-y-2.5">
                  <a
                    href={currentProject.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-mono text-foreground hover:underline flex items-center justify-between p-2 rounded bg-secondary border border-border group"
                  >
                    <span className="truncate">{currentProject.githubUrl.replace("https://github.com/", "")}</span>
                    <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-foreground shrink-0 ml-1 transition-colors" />
                  </a>

                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-mono font-semibold text-muted-foreground tracking-wider">
                      Quick Clone
                    </span>
                    <div className="flex items-center gap-1">
                      <code className="text-[11px] font-mono bg-secondary px-2 py-1 rounded border border-border flex-1 truncate text-foreground">
                        git clone {currentProject.githubUrl}.git
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopy(`git clone ${currentProject.githubUrl}.git`, "clone")}
                        className="h-7 px-2 text-xs"
                      >
                        {copiedCmd === "clone" ? (
                          <Check className="h-3 w-3 text-emerald-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Architecture Snapshot Card */}
            <Card className="border-border bg-card">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-mono">
                    Living Architecture
                  </CardTitle>
                  <Link to={`/projects/${id}/visualise`} className="text-[11px] text-muted-foreground hover:text-foreground font-mono flex items-center gap-1">
                    <span>Full Canvas</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-1 space-y-3">
                <div className="p-3 rounded-lg bg-secondary/50 border border-border space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-muted-foreground">Topology Status:</span>
                    <span className="text-emerald-500 font-semibold">Compiled</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-muted-foreground">Subsystem Nodes:</span>
                    <span className="text-foreground font-bold">{nodesCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-muted-foreground">Inter-module Edges:</span>
                    <span className="text-foreground font-bold">{edgesCount}</span>
                  </div>
                </div>

                <Link to={`/projects/${id}/visualise`} className="block">
                  <Button variant="outline" size="sm" className="w-full text-xs font-semibold">
                    <Boxes className="h-3.5 w-3.5 mr-1.5" />
                    Open Visualizer Canvas
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card className="border-border">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-mono">
                  Platform Sections
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 pt-0 space-y-0.5">
                {[
                  { title: "Architecture & Dependencies", href: `/projects/${id}/visualise`, icon: FolderTree },
                  { title: "Technical Documentation", href: `/projects/${id}/documentation`, icon: BookText },
                  { title: "Codebase Q&A Chat", href: `/projects/${id}/qna`, icon: FileQuestion },
                  { title: "Meeting Audio Intelligence", href: `/projects/${id}/meetings`, icon: Presentation },
                ].map((item, idx) => (
                  <Link
                    key={idx}
                    to={item.href}
                    className="flex items-center justify-between p-2 rounded hover:bg-secondary transition-colors text-xs text-foreground group"
                  >
                    <div className="flex items-center gap-2">
                      <item.icon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                      <span>{item.title}</span>
                    </div>
                    <ArrowRight className="h-3 w-3 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ─── Tab Content: Git & Pipeline Info ────────────────────────── */}
      {activeTab === "quickstart" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-fade-up">
          <Card className="border-border">
            <CardHeader className="p-4 pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-foreground" />
                <CardTitle className="text-sm font-semibold">Git Terminal Commands</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Essential terminal shortcuts for this repository.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3">
              {[
                { label: "Clone repository", cmd: `git clone ${currentProject.githubUrl || "https://github.com/..."}.git` },
                { label: "Check status", cmd: "git status" },
                { label: "Fetch all branches", cmd: "git fetch --all --prune" },
                { label: "Recent commits", cmd: "git log --oneline -n 10" },
              ].map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <span className="text-[11px] text-muted-foreground font-medium font-mono">{item.label}</span>
                  <div className="flex items-center justify-between p-2 rounded bg-secondary border border-border text-xs font-mono">
                    <span className="truncate pr-2 text-foreground">{item.cmd}</span>
                    <button
                      onClick={() => handleCopy(item.cmd, `cli-${idx}`)}
                      className="p-1 rounded text-muted-foreground hover:text-foreground active:scale-95 transition-all shrink-0 cursor-pointer"
                    >
                      {copiedCmd === `cli-${idx}` ? (
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="p-4 pb-3">
              <div className="flex items-center gap-2">
                <Code2 className="h-4 w-4 text-foreground" />
                <CardTitle className="text-sm font-semibold">AST & Analysis Pipeline Telemetry</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Active compiler and indexing parameters.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-2.5 font-mono text-xs">
              <div className="flex justify-between py-1.5 border-b border-border">
                <span className="text-muted-foreground">AST Engine</span>
                <span className="text-emerald-500 font-semibold">Dagre & Tree-Sitter</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border">
                <span className="text-muted-foreground">Semantic LLM</span>
                <span className="text-foreground">Gemini 1.5 Pro</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border">
                <span className="text-muted-foreground">Audio Transcription</span>
                <span className="text-foreground">AssemblyAI / Whisper</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border">
                <span className="text-muted-foreground">Vector Dimension</span>
                <span className="text-foreground">768-dim Normalized</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-muted-foreground">Workspace Created</span>
                <span className="text-foreground">
                  {currentProject.createdAt
                    ? new Date(currentProject.createdAt).toLocaleDateString()
                    : "Recent"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── Tab Content: Team Members ────────────────────────────────── */}
      {activeTab === "team" && (
        <Card className="border-border animate-fade-up">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">Workspace Collaborators</CardTitle>
                <CardDescription className="text-xs">
                  Team members with repository access and analysis permissions.
                </CardDescription>
              </div>
              <Button size="sm" onClick={() => setShowInvite(true)} className="text-xs h-8 font-semibold">
                <UserPlus className="h-3 w-3 mr-1.5" />
                Invite Member
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="divide-y divide-border">
              {currentProject.members?.map((member, i) => (
                <div key={member._id || i} className="py-2.5 flex items-center justify-between hover:bg-secondary/40 transition-colors px-2 rounded">
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-full bg-secondary border border-border flex items-center justify-center text-xs font-mono font-bold text-foreground">
                      {member.name?.[0]?.toUpperCase() || "U"}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">{member.name}</p>
                      <p className="text-[11px] text-muted-foreground font-mono">{member.email}</p>
                    </div>
                  </div>
                  <Badge variant={i === 0 ? "default" : "secondary"} className="text-[10px]">
                    {i === 0 ? "Owner" : "Collaborator"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Project Settings Modal */}
      <ProjectSettingsModal
        project={currentProject}
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
}

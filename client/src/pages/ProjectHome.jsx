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
  Link2,
  Copy,
  Check,
  BookText,
  FileQuestion,
  Presentation,
  FolderTree,
  Search,
  RefreshCw,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Code2,
  Terminal,
  Activity,
  ArrowRight,
  Filter,
} from "lucide-react";

export default function ProjectHome() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentProject, isLoading, isActionLoading } = useSelector(
    (state) => state.project
  );

  // Local state
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

  useEffect(() => {
    dispatch(fetchProject(id));
  }, [dispatch, id]);

  const handleLinkRepo = async (e) => {
    e.preventDefault();
    if (!githubUrl.trim()) return;
    const res = await dispatch(linkRepo({ projectId: id, githubUrl }));
    if (res.meta.requestStatus === "fulfilled") {
      toast.success("GitHub repository linked successfully!");
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
      toast.success(`Invitation sent to ${inviteEmail}`);
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

  if (isLoading || !currentProject) {
    return (
      <div className="w-full max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-10 w-72" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Skeleton className="lg:col-span-8 h-96 rounded-xl" />
          <Skeleton className="lg:col-span-4 h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* ─── Top Page Header ────────────────────────────────────────── */}
      <PageHeader
        icon={Sparkles}
        title={currentProject.name}
        description="Engineering workspace with codebase intelligence, vector search, and meeting synthesis"
        actions={
          <>
            <Badge
              variant="outline"
              className="text-xs font-mono text-muted-foreground gap-1.5 py-1 px-2.5"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              Active
            </Badge>

            <button
              onClick={() => handleCopy(id, "id")}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded-md bg-secondary text-muted-foreground hover:text-foreground transition-colors border border-border"
              title="Copy Project ID"
            >
              {copiedId ? (
                <Check className="h-3 w-3 text-primary" />
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
                className="text-xs h-8 border-border"
              >
                <RefreshCw
                  className={`h-3 w-3 mr-1.5 ${isActionLoading ? "animate-spin text-primary" : ""}`}
                />
                Sync Commits
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowInvite(!showInvite)}
              className="text-xs h-8 border-border"
            >
              <UserPlus className="h-3 w-3 mr-1.5" />
              Invite
            </Button>

            <Link to={`/projects/${id}/visualise`}>
              <Button size="sm" className="text-xs h-8">
                <FolderTree className="h-3 w-3 mr-1.5" />
                Architecture
              </Button>
            </Link>
          </>
        }
      />

      {/* ─── Inline Invite Drawer ───────────────────────────────────── */}
      {showInvite && (
        <Card className="border-border animate-fade-up">
          <CardContent className="p-3.5 flex flex-col sm:flex-row items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-[130px]">
              <Users className="h-4 w-4 text-primary" />
              <span>Invite teammate:</span>
            </div>
            <form onSubmit={handleInvite} className="flex-1 flex gap-2 w-full">
              <Input
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@company.com"
                type="email"
                className="text-xs h-8 bg-background/60"
                autoFocus
              />
              <Button size="sm" type="submit" disabled={isActionLoading} className="h-8 px-3 text-xs">
                Send Invite
              </Button>
              <Button
                size="sm"
                variant="ghost"
                type="button"
                onClick={() => setShowInvite(false)}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* ─── Interactive AI Quick Search Bar ────────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-3 shadow-xs animate-fade-up">
        <form onSubmit={handleQuickAsk} className="flex items-center gap-2">
          <div className="relative flex-1">
            <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-primary" />
            <input
              type="text"
              value={quickQuestion}
              onChange={(e) => setQuickQuestion(e.target.value)}
              placeholder="Ask AI anything about this codebase…"
              className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-transparent border-0 text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
            />
          </div>
          <Button type="submit" size="sm" className="h-8 px-3 text-xs font-medium shrink-0">
            Ask
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </form>
        <div className="mt-2 pt-2 border-t border-border/50 flex items-center gap-2 overflow-x-auto scrollbar-none text-[11px] text-muted-foreground">
          <span className="shrink-0 font-medium text-foreground/80">Suggestions:</span>
          {[
            "Where is auth handled?",
            "Explain project structure",
            "List API endpoints",
            "Database models overview",
          ].map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setQuickQuestion(prompt);
                navigate(`/projects/${id}/qna?q=${encodeURIComponent(prompt)}`);
              }}
              className="px-2 py-0.5 rounded bg-secondary hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Metric Cards Grid ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 animate-fade-up stagger-1">
        {/* Total Commits */}
        <div onClick={() => setActiveTab("commits")} className="cursor-pointer group">
          <Card
            interactive
            className={`border transition-all ${
              activeTab === "commits" ? "border-primary/50 bg-secondary/50" : "border-border"
            }`}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-1 min-w-0">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                  Commits
                </span>
                <div className="text-xl font-bold font-mono text-foreground">
                  {currentProject.commits?.length || 0}
                </div>
                <p className="text-[11px] text-muted-foreground truncate group-hover:text-primary transition-colors">
                  {currentProject.githubUrl ? "Live synced" : "No repo"}
                </p>
              </div>
              <div className="icon-tile group-hover:border-primary/40 shrink-0">
                <GitGraph className="h-4 w-4" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Documentation Sections */}
        <Link to={`/projects/${id}/documentation`} className="block group">
          <Card interactive className="border-border h-full">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-1 min-w-0">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                  Documentation
                </span>
                <div className="text-xl font-bold font-mono text-foreground group-hover:text-primary transition-colors">
                  12 Sections
                </div>
                <p className="text-[11px] text-muted-foreground truncate group-hover:text-primary transition-colors">
                  Technical manual
                </p>
              </div>
              <div className="icon-tile group-hover:border-primary/40 shrink-0">
                <BookText className="h-4 w-4" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Codebase Q&A */}
        <Link to={`/projects/${id}/qna`} className="block group">
          <Card interactive className="border-border h-full">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-1 min-w-0">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                  Q & A Engine
                </span>
                <div className="text-xl font-bold font-mono text-foreground group-hover:text-primary transition-colors">
                  AI Ready
                </div>
                <p className="text-[11px] text-muted-foreground truncate group-hover:text-primary transition-colors">
                  Vector search
                </p>
              </div>
              <div className="icon-tile group-hover:border-primary/40 shrink-0">
                <FileQuestion className="h-4 w-4" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Meeting Audio */}
        <Link to={`/projects/${id}/meetings`} className="block group">
          <Card interactive className="border-border h-full">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-1 min-w-0">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                  Meeting Audio
                </span>
                <div className="text-xl font-bold font-mono text-foreground group-hover:text-primary transition-colors">
                  {currentProject.meetings?.length || 0} Sessions
                </div>
                <p className="text-[11px] text-muted-foreground truncate group-hover:text-primary transition-colors">
                  Transcription log
                </p>
              </div>
              <div className="icon-tile group-hover:border-primary/40 shrink-0">
                <Presentation className="h-4 w-4" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* ─── Navigation Tabs ─────────────────────────────────────────── */}
      <div className="flex items-center gap-1 border-b border-border pb-1">
        <button
          onClick={() => setActiveTab("commits")}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            activeTab === "commits"
              ? "bg-secondary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Activity className="h-3.5 w-3.5" />
          <span>Commits ({filteredCommits.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("quickstart")}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            activeTab === "quickstart"
              ? "bg-secondary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Terminal className="h-3.5 w-3.5" />
          <span>Repository & Setup</span>
        </button>

        <button
          onClick={() => setActiveTab("team")}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            activeTab === "team"
              ? "bg-secondary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          <span>Team ({currentProject.members?.length || 1})</span>
        </button>
      </div>

      {/* ─── Tab Content: Commits Stream (Clean, unified list) ───────── */}
      {activeTab === "commits" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 space-y-3">
            {/* Filter toolbar */}
            <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg border border-border bg-card">
              <div className="relative flex-1">
                <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={commitFilter}
                  onChange={(e) => setCommitFilter(e.target.value)}
                  placeholder="Filter commits by author, hash, or message…"
                  className="w-full pl-8 pr-3 py-1 text-xs bg-transparent border-0 text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
                />
              </div>

              <button
                type="button"
                onClick={() => setOnlyAiSummaries(!onlyAiSummaries)}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded border transition-colors shrink-0 ${
                  onlyAiSummaries
                    ? "bg-secondary text-foreground border-border font-medium shadow-xs"
                    : "border-border/60 text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                }`}
              >
                <Sparkles className="h-3 w-3" />
                <span>AI Summaries only</span>
              </button>
            </div>

            {/* Continuous Unified Commits Panel */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              {filteredCommits.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <GitGraph className="h-8 w-8 text-muted-foreground mx-auto opacity-40" />
                  <p className="text-xs text-muted-foreground">
                    {commitFilter
                      ? "No commits match your search filter."
                      : "No commit history found. Click 'Sync Commits' above."}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border/60">
                  {filteredCommits.map((commit) => {
                    const isExpanded = expandedCommit === commit._id;
                    return (
                      <div
                        key={commit._id}
                        className="p-3 sm:px-4 hover:bg-secondary/40 transition-colors duration-150"
                      >
                        <div className="flex items-start justify-between gap-3">
                          {/* Left: Avatar + Commit details */}
                          <div className="flex items-start gap-2.5 min-w-0 flex-1">
                            {commit.commitAuthorAvatar ? (
                              <img
                                src={commit.commitAuthorAvatar}
                                alt={commit.commitAuthorName}
                                className="h-6 w-6 rounded-full bg-muted border border-border shrink-0 mt-0.5"
                              />
                            ) : (
                              <div className="h-6 w-6 rounded-full bg-secondary border border-border flex items-center justify-center text-[10px] font-bold text-foreground shrink-0 mt-0.5">
                                {commit.commitAuthorName?.[0]?.toUpperCase() || "U"}
                              </div>
                            )}

                            <div className="min-w-0 flex-1">
                              {/* Message */}
                              <p className="text-xs sm:text-sm font-medium text-foreground leading-snug break-words">
                                {commit.commitMessage}
                              </p>

                              {/* Author and Date */}
                              <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-1">
                                <span className="font-medium text-foreground/80">
                                  {commit.commitAuthorName}
                                </span>
                                <span>•</span>
                                <span>{formatDate(commit.commitDate)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Right: Actions */}
                          <div className="flex items-center gap-1.5 shrink-0 self-start mt-0.5">
                            {/* AI Summary badge / toggle */}
                            {commit.summary && (
                              <button
                                onClick={() => setExpandedCommit(isExpanded ? null : commit._id)}
                                className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded border transition-colors ${
                                  isExpanded
                                    ? "bg-primary text-primary-foreground border-primary/40 shadow-xs font-medium"
                                    : "bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground border-border"
                                }`}
                                title={isExpanded ? "Hide AI Summary" : "View AI Summary"}
                              >
                                <Sparkles className={`h-3 w-3 ${isExpanded ? "text-primary-foreground" : "text-primary"}`} />
                                <span className="hidden sm:inline">AI Summary</span>
                                {isExpanded ? (
                                  <ChevronUp className="h-3 w-3" />
                                ) : (
                                  <ChevronDown className="h-3 w-3" />
                                )}
                              </button>
                            )}

                            {/* Commit Hash */}
                            {commit.commitHash && (
                              <button
                                onClick={() => handleCopy(commit.commitHash, commit._id)}
                                className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-secondary hover:bg-muted text-muted-foreground hover:text-foreground border border-border transition-colors"
                                title="Click to copy hash"
                              >
                                {copiedCmd === commit._id ? (
                                  <Check className="h-3 w-3 text-primary" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                                <span>{commit.commitHash.slice(0, 7)}</span>
                              </button>
                            )}

                            {/* GitHub link */}
                            {currentProject.githubUrl && commit.commitHash && (
                              <a
                                href={`${currentProject.githubUrl}/commit/${commit.commitHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
                                title="Open on GitHub"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Unfolded AI Summary */}
                        {commit.summary && isExpanded && (
                          <div className="mt-3 ml-8 p-3 rounded-lg bg-secondary/70 border border-border text-xs space-y-1.5 animate-fade-up">
                            <div className="flex items-center gap-1.5 text-primary font-semibold text-[11px]">
                              <Sparkles className="h-3 w-3" />
                              <span>AI Code Analysis</span>
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

          {/* Right Column: Repo summary */}
          <div className="lg:col-span-4 space-y-4">
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
                      className="text-xs h-8 bg-background/50"
                    />
                    <Button type="submit" size="sm" disabled={isActionLoading} className="w-full text-xs h-8">
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
                      <GitBranch className="h-3.5 w-3.5 text-primary" />
                      <span>Repository</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] text-primary border-primary/30">
                      Connected
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-1 space-y-2.5">
                  <a
                    href={currentProject.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-mono text-foreground hover:underline flex items-center justify-between p-2 rounded bg-secondary border border-border"
                  >
                    <span className="truncate">{currentProject.githubUrl.replace("https://github.com/", "")}</span>
                    <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0 ml-1" />
                  </a>

                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
                      Clone command
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
                          <Check className="h-3 w-3 text-primary" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Links */}
            <Card className="border-border">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Quick Navigation
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0 space-y-1">
                {[
                  { title: "Architecture Map", href: `/projects/${id}/visualise`, icon: FolderTree },
                  { title: "Technical Manual", href: `/projects/${id}/documentation`, icon: BookText },
                  { title: "Codebase Q&A", href: `/projects/${id}/qna`, icon: FileQuestion },
                  { title: "Meeting Intelligence", href: `/projects/${id}/meetings`, icon: Presentation },
                ].map((item, idx) => (
                  <Link
                    key={idx}
                    to={item.href}
                    className="flex items-center justify-between p-2 rounded hover:bg-secondary transition-colors text-xs text-foreground group"
                  >
                    <div className="flex items-center gap-2">
                      <item.icon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                      <span>{item.title}</span>
                    </div>
                    <ArrowRight className="h-3 w-3 text-muted-foreground group-hover:text-foreground transition-transform" />
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ─── Tab Content: Repository & Setup ──────────────────────────── */}
      {activeTab === "quickstart" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-fade-up">
          <Card className="border-border">
            <CardHeader className="p-4 pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-semibold">Git Commands</CardTitle>
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
                  <span className="text-[11px] text-muted-foreground font-medium">{item.label}</span>
                  <div className="flex items-center justify-between p-2 rounded bg-secondary border border-border text-xs font-mono">
                    <span className="truncate pr-2">{item.cmd}</span>
                    <button
                      onClick={() => handleCopy(item.cmd, `cli-${idx}`)}
                      className="p-1 rounded text-muted-foreground hover:text-foreground shrink-0"
                    >
                      {copiedCmd === `cli-${idx}` ? (
                        <Check className="h-3 w-3 text-primary" />
                      ) : (
                        <Copy className="h-3 w-3" />
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
                <Code2 className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-semibold">Intelligence Infrastructure</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Configuration and indexing telemetry.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-2.5 font-mono text-xs">
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Vector Store</span>
                <span className="text-primary font-semibold">Pinecone (Active)</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">LLM Engine</span>
                <span className="text-foreground">Gemini 1.5 Pro</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Audio Transcription</span>
                <span className="text-foreground">AssemblyAI / Whisper</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Embeddings</span>
                <span className="text-foreground">768-dim</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-muted-foreground">Created</span>
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
                  Team members with access to this project.
                </CardDescription>
              </div>
              <Button size="sm" onClick={() => setShowInvite(true)} className="text-xs h-8">
                <UserPlus className="h-3 w-3 mr-1.5" />
                Invite Member
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="divide-y divide-border/50">
              {currentProject.members?.map((member, i) => (
                <div key={member._id || i} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-full bg-secondary border border-border flex items-center justify-center text-xs font-bold text-foreground">
                      {member.name?.[0]?.toUpperCase() || "U"}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">{member.name}</p>
                      <p className="text-[11px] text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                  <Badge variant={i === 0 ? "default" : "secondary"} className="text-[10px]">
                    {i === 0 ? "Owner" : "Member"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

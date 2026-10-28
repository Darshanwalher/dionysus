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
  Send,
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
      toast.success("Command copied to clipboard");
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

  if (isLoading || !currentProject) {
    return (
      <div className="w-full max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-10 w-72" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
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
    <div className="w-full max-w-7xl mx-auto space-y-7">
      {/* ─── Top Page Header ────────────────────────────────────────── */}
      <PageHeader
        icon={Sparkles}
        title={currentProject.name}
        description="Engineering workspace with codebase intelligence, vector search, and meeting synthesis"
        actions={
          <>
            <Badge
              variant="outline"
              className="text-xs font-mono text-muted-foreground gap-1.5 py-1 px-3"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              Active Project
            </Badge>

            <button
              onClick={() => handleCopy(id, "id")}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded-md bg-secondary text-muted-foreground hover:text-foreground transition-colors border border-border"
              title="Copy full Project ID"
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
                className="text-xs h-9 border-border"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 mr-1.5 ${isActionLoading ? "animate-spin text-primary" : ""}`}
                />
                Sync Commits
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowInvite(!showInvite)}
              className="text-xs h-9 border-border"
            >
              <UserPlus className="h-3.5 w-3.5 mr-1.5" />
              Invite
            </Button>

            <Link to={`/projects/${id}/visualise`}>
              <Button size="sm" className="text-xs h-9 shadow-sm">
                <FolderTree className="h-3.5 w-3.5 mr-1.5" />
                Architecture
              </Button>
            </Link>
          </>
        }
      />

      {/* ─── Inline Invite Drawer ───────────────────────────────────── */}
      {showInvite && (
        <Card className="glass border-border animate-fade-up">
          <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-[140px]">
              <Users className="h-4 w-4 text-primary" />
              <span>Invite teammate:</span>
            </div>
            <form onSubmit={handleInvite} className="flex-1 flex gap-2 w-full">
              <Input
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@company.com"
                type="email"
                className="text-xs h-9 bg-background/60"
                autoFocus
              />
              <Button size="sm" type="submit" disabled={isActionLoading} className="h-9 px-4 text-xs">
                Send Invite
              </Button>
              <Button
                size="sm"
                variant="ghost"
                type="button"
                onClick={() => setShowInvite(false)}
                className="h-9 text-xs"
              >
                Cancel
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* ─── Interactive AI Quick Search Bar ────────────────────────── */}
      <div className="rounded-xl border border-border bg-card/70 p-3 sm:p-4 shadow-sm backdrop-blur-sm animate-fade-up">
        <form onSubmit={handleQuickAsk} className="flex items-center gap-2">
          <div className="relative flex-1">
            <Sparkles className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
            <input
              type="text"
              value={quickQuestion}
              onChange={(e) => setQuickQuestion(e.target.value)}
              placeholder="Ask an AI question about this project's code, structure, or setup…"
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-background/50 border border-border/80 rounded-lg text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          <Button type="submit" size="sm" className="h-9 px-4 text-xs font-semibold shrink-0">
            <span>Query</span>
            <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
          </Button>
        </form>
        <div className="mt-2.5 flex items-center gap-2 overflow-x-auto scrollbar-none text-[11px] text-muted-foreground">
          <span className="font-medium shrink-0">Quick prompts:</span>
          {[
            "Where is authentication defined?",
            "Explain the database models",
            "What API routes are available?",
            "List project dependencies",
          ].map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setQuickQuestion(prompt);
                navigate(`/projects/${id}/qna?q=${encodeURIComponent(prompt)}`);
              }}
              className="px-2.5 py-0.5 rounded-md bg-secondary hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60 transition-colors shrink-0"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Interactive Metric Cards Grid ───────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-up stagger-1">
        {/* Total Commits */}
        <div
          onClick={() => setActiveTab("commits")}
          className="cursor-pointer group"
        >
          <Card
            interactive
            className={`border transition-all ${
              activeTab === "commits" ? "border-primary/50 ring-1 ring-primary/20 bg-card" : "border-border"
            }`}
          >
            <CardContent className="p-5 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Commits Tracked
                </span>
                <div className="text-2xl font-bold font-mono text-foreground">
                  {currentProject.commits?.length || 0}
                </div>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1 group-hover:text-primary transition-colors">
                  {currentProject.githubUrl ? "Live synced with GitHub" : "No repo connected"}
                  <ArrowRight className="h-3 w-3" />
                </p>
              </div>
              <div className="icon-tile group-hover:border-primary/40">
                <GitGraph className="h-4 w-4" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Documentation Sections */}
        <Link to={`/projects/${id}/documentation`} className="block group">
          <Card interactive className="border-border h-full">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Documentation
                </span>
                <div className="text-2xl font-bold font-mono text-foreground group-hover:text-primary transition-colors">
                  12 Sections
                </div>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1 group-hover:text-primary transition-colors">
                  Open architecture guide <ArrowRight className="h-3 w-3" />
                </p>
              </div>
              <div className="icon-tile group-hover:border-primary/40">
                <BookText className="h-4 w-4" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Codebase Q&A */}
        <Link to={`/projects/${id}/qna`} className="block group">
          <Card interactive className="border-border h-full">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Q & A Engine
                </span>
                <div className="text-2xl font-bold font-mono text-foreground group-hover:text-primary transition-colors">
                  Vector RAG
                </div>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1 group-hover:text-primary transition-colors">
                  Query codebase in natural text <ArrowRight className="h-3 w-3" />
                </p>
              </div>
              <div className="icon-tile group-hover:border-primary/40">
                <FileQuestion className="h-4 w-4" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Meeting Audio */}
        <Link to={`/projects/${id}/meetings`} className="block group">
          <Card interactive className="border-border h-full">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Meeting Audio
                </span>
                <div className="text-2xl font-bold font-mono text-foreground group-hover:text-primary transition-colors">
                  {currentProject.meetings?.length || 0} Sessions
                </div>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1 group-hover:text-primary transition-colors">
                  Transcribe & extract topics <ArrowRight className="h-3 w-3" />
                </p>
              </div>
              <div className="icon-tile group-hover:border-primary/40">
                <Presentation className="h-4 w-4" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* ─── Interactive Section Tabs ─────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-border/80 pb-2">
        <button
          onClick={() => setActiveTab("commits")}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === "commits"
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary"
          }`}
        >
          <Activity className="h-3.5 w-3.5" />
          <span>Commit Activity ({filteredCommits.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("quickstart")}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === "quickstart"
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary"
          }`}
        >
          <Terminal className="h-3.5 w-3.5" />
          <span>Repository & Commands</span>
        </button>

        <button
          onClick={() => setActiveTab("team")}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === "team"
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary"
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          <span>Team & Access ({currentProject.members?.length || 1})</span>
        </button>
      </div>

      {/* ─── Tab Content ─────────────────────────────────────────────── */}
      {activeTab === "commits" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
          {/* Commits List Column */}
          <div className="lg:col-span-8 space-y-4">
            {/* Filter and options bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border border-border bg-card/60">
              <div className="relative flex-1">
                <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-muted-foreground" />
                <input
                  type="text"
                  value={commitFilter}
                  onChange={(e) => setCommitFilter(e.target.value)}
                  placeholder="Filter commits by author, hash, message, or AI summary…"
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-background/60 border border-border/80 rounded-md focus:outline-none focus:border-primary/50 text-foreground"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setOnlyAiSummaries(!onlyAiSummaries)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md border transition-colors ${
                    onlyAiSummaries
                      ? "bg-primary/10 border-primary/40 text-primary font-medium"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Filter className="h-3 w-3" />
                  <span>AI Summaries only</span>
                </button>
              </div>
            </div>

            {/* Commits List */}
            {filteredCommits.length === 0 ? (
              <Card className="border-border">
                <CardContent className="py-14 text-center space-y-3">
                  <GitGraph className="h-10 w-10 text-muted-foreground mx-auto opacity-40" />
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    {commitFilter
                      ? "No commits match your filter criteria."
                      : "No commit history found. Link a repository or poll commits above."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredCommits.map((commit) => {
                  const isExpanded = expandedCommit === commit._id;
                  return (
                    <Card
                      key={commit._id}
                      className="border-border bg-card/40 hover:bg-card/70 transition-all duration-150"
                    >
                      <CardContent className="p-4 space-y-2.5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            {commit.commitAuthorAvatar ? (
                              <img
                                src={commit.commitAuthorAvatar}
                                alt={commit.commitAuthorName}
                                className="h-7 w-7 rounded-full bg-muted border border-border shrink-0"
                              />
                            ) : (
                              <div className="h-7 w-7 rounded-full bg-secondary border border-border flex items-center justify-center text-[10px] font-bold text-foreground shrink-0">
                                {commit.commitAuthorName?.[0]?.toUpperCase() || "U"}
                              </div>
                            )}
                            <div className="min-w-0">
                              <span className="text-xs font-semibold text-foreground truncate block">
                                {commit.commitAuthorName}
                              </span>
                              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                <Clock className="h-2.5 w-2.5" />
                                <span>{new Date(commit.commitDate).toLocaleString()}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {commit.commitHash && (
                              <button
                                onClick={() => handleCopy(commit.commitHash, commit._id)}
                                className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-secondary hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60 transition-colors"
                                title="Copy commit hash"
                              >
                                {copiedCmd === commit._id ? (
                                  <Check className="h-3 w-3 text-primary" />
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
                                className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
                                title="Open commit on GitHub"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            )}

                            {commit.summary && (
                              <button
                                onClick={() => setExpandedCommit(isExpanded ? null : commit._id)}
                                className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors ml-1"
                                title={isExpanded ? "Collapse summary" : "Expand AI summary"}
                              >
                                {isExpanded ? (
                                  <ChevronUp className="h-3.5 w-3.5 text-primary" />
                                ) : (
                                  <ChevronDown className="h-3.5 w-3.5" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Commit Message */}
                        <p className="text-xs font-medium text-foreground leading-relaxed pl-9">
                          {commit.commitMessage}
                        </p>

                        {/* Expanded AI Summary */}
                        {commit.summary && isExpanded && (
                          <div className="ml-9 p-3 rounded-lg bg-secondary/80 border border-border text-[11px] space-y-1.5 animate-fade-up">
                            <div className="flex items-center gap-1.5 text-primary font-semibold">
                              <Sparkles className="h-3 w-3" />
                              <span>AI Code Analysis</span>
                            </div>
                            <p className="text-foreground font-mono whitespace-pre-wrap leading-relaxed">
                              {commit.summary}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Sidebar Column */}
          <div className="lg:col-span-4 space-y-5">
            {/* Repository Connection Card */}
            {!currentProject.githubUrl ? (
              <Card className="border-border">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <GitBranch className="h-4 w-4 text-primary" />
                    <CardTitle className="text-sm font-semibold">Connect GitHub</CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    Link your repository to automatically index code, inspect commits, and produce architecture maps.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLinkRepo} className="space-y-2.5">
                    <div className="relative">
                      <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        value={githubUrl}
                        onChange={(e) => setGithubUrl(e.target.value)}
                        placeholder="https://github.com/org/repo"
                        className="pl-9 text-xs h-9 bg-background/50"
                      />
                    </div>
                    <Button type="submit" size="sm" disabled={isActionLoading} className="w-full text-xs h-9">
                      {isActionLoading ? "Linking…" : "Link Repository"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-border bg-card/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                      <GitBranch className="h-4 w-4 text-primary" />
                      <span>Connected Repository</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] text-primary border-primary/30">
                      Live
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <a
                    href={currentProject.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-mono text-foreground hover:underline flex items-center justify-between p-2 rounded-lg bg-secondary border border-border"
                  >
                    <span className="truncate">{currentProject.githubUrl.replace("https://github.com/", "")}</span>
                    <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0 ml-1" />
                  </a>

                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
                      Clone URL
                    </span>
                    <div className="flex items-center gap-1.5">
                      <code className="text-[11px] font-mono bg-background/80 px-2 py-1.5 rounded border border-border flex-1 truncate text-foreground">
                        git clone {currentProject.githubUrl}.git
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopy(`git clone ${currentProject.githubUrl}.git`, "clone")}
                        className="h-8 px-2.5 text-xs"
                      >
                        {copiedCmd === "clone" ? (
                          <Check className="h-3.5 w-3.5 text-primary" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Navigation launchpad */}
            <Card className="border-border bg-card/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Workspace Hub
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {[
                  {
                    title: "Architecture Map",
                    desc: "Interactive file visualizer & diagram",
                    href: `/projects/${id}/visualise`,
                    icon: FolderTree,
                  },
                  {
                    title: "Technical Manual",
                    desc: "12 structured technical sections",
                    href: `/projects/${id}/documentation`,
                    icon: BookText,
                  },
                  {
                    title: "Codebase Q&A",
                    desc: "RAG engine backed by vector search",
                    href: `/projects/${id}/qna`,
                    icon: FileQuestion,
                  },
                  {
                    title: "Meeting Summaries",
                    desc: "Audio transcription & issue log",
                    href: `/projects/${id}/meetings`,
                    icon: Presentation,
                  },
                ].map((item, idx) => (
                  <Link
                    key={idx}
                    to={item.href}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-border/40 bg-secondary/40 hover:bg-secondary hover:border-primary/30 transition-all group"
                  >
                    <div className="flex items-center gap-2.5">
                      <item.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      <div>
                        <p className="text-xs font-medium text-foreground">{item.title}</p>
                        <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ─── Tab: Quickstart / Commands ───────────────────────────────── */}
      {activeTab === "quickstart" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-up">
          <Card className="border-border">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-primary" />
                <CardTitle className="text-base font-semibold">Git & CLI Commands</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Essential terminal commands configured for this repository.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "Clone repo", cmd: `git clone ${currentProject.githubUrl || "https://github.com/..."}.git` },
                { label: "Check status", cmd: "git status" },
                { label: "Fetch recent branches", cmd: "git fetch --all --prune" },
                { label: "Show recent commit log", cmd: "git log --oneline -n 10" },
              ].map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <span className="text-[11px] font-medium text-muted-foreground">{item.label}</span>
                  <div className="flex items-center justify-between p-2.5 rounded-md bg-secondary border border-border text-xs font-mono">
                    <span className="truncate pr-2">{item.cmd}</span>
                    <button
                      onClick={() => handleCopy(item.cmd, `cli-${idx}`)}
                      className="p-1 rounded text-muted-foreground hover:text-foreground shrink-0"
                    >
                      {copiedCmd === `cli-${idx}` ? (
                        <Check className="h-3.5 w-3.5 text-primary" />
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
            <CardHeader>
              <div className="flex items-center gap-2">
                <Code2 className="h-4 w-4 text-primary" />
                <CardTitle className="text-base font-semibold">Intelligence Infrastructure</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Active vector search, LLM reasoning, and pipeline status.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 font-mono text-xs">
              <div className="flex justify-between py-2 border-b border-border/40">
                <span className="text-muted-foreground">Vector Store</span>
                <span className="text-primary font-semibold">Pinecone (Serverless)</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/40">
                <span className="text-muted-foreground">LLM Reasoning Engine</span>
                <span className="text-foreground">Gemini 1.5 Pro</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/40">
                <span className="text-muted-foreground">Audio Transcription</span>
                <span className="text-foreground">AssemblyAI / Whisper</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/40">
                <span className="text-muted-foreground">Embedding Dimension</span>
                <span className="text-foreground">768-dim (Text-Embedding-004)</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Project Created</span>
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

      {/* ─── Tab: Team Members ────────────────────────────────────────── */}
      {activeTab === "team" && (
        <Card className="border-border animate-fade-up">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Workspace Collaborators</CardTitle>
                <CardDescription className="text-xs">
                  Team members with access to this project workspace.
                </CardDescription>
              </div>
              <Button size="sm" onClick={() => setShowInvite(true)} className="text-xs h-8">
                <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                Invite Member
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border/40">
              {currentProject.members?.map((member, i) => (
                <div key={member._id || i} className="py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-secondary border border-border flex items-center justify-center text-xs font-bold text-foreground">
                      {member.name?.[0]?.toUpperCase() || "U"}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={i === 0 ? "default" : "secondary"} className="text-xs font-medium">
                      {i === 0 ? "Owner" : "Collaborator"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

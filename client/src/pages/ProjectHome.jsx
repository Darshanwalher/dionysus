import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchProject, linkRepo, pollCommits, inviteUser } from "@/store/slices/projectSlice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
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
} from "lucide-react";

export default function ProjectHome() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { currentProject, isLoading, isActionLoading } = useSelector(
    (state) => state.project
  );
  const [githubUrl, setGithubUrl] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedClone, setCopiedClone] = useState(false);
  const [commitFilter, setCommitFilter] = useState("");
  const [expandedCommit, setExpandedCommit] = useState(null);

  useEffect(() => {
    dispatch(fetchProject(id));
  }, [dispatch, id]);

  const handleLinkRepo = async (e) => {
    e.preventDefault();
    if (!githubUrl.trim()) return;
    const res = await dispatch(linkRepo({ projectId: id, githubUrl }));
    if (res.meta.requestStatus === "fulfilled") {
      toast.success("GitHub repository connected successfully!");
    } else {
      toast.error(res.payload || "Failed to link repository");
    }
  };

  const handlePollCommits = async () => {
    const res = await dispatch(pollCommits(id));
    if (res.meta.requestStatus === "fulfilled") {
      toast.success("Commits updated from GitHub!");
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

  const handleCopyId = () => {
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    toast.success("Project ID copied to clipboard");
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCopyClone = () => {
    if (!currentProject?.githubUrl) return;
    const cloneCmd = `git clone ${currentProject.githubUrl}.git`;
    navigator.clipboard.writeText(cloneCmd);
    setCopiedClone(true);
    toast.success("Clone command copied!");
    setTimeout(() => setCopiedClone(false), 2000);
  };

  const filteredCommits = useMemo(() => {
    if (!currentProject?.commits) return [];
    if (!commitFilter.trim()) return currentProject.commits;
    const term = commitFilter.toLowerCase();
    return currentProject.commits.filter(
      (c) =>
        c.commitMessage?.toLowerCase().includes(term) ||
        c.commitAuthorName?.toLowerCase().includes(term) ||
        c.commitHash?.toLowerCase().includes(term) ||
        c.summary?.toLowerCase().includes(term)
    );
  }, [currentProject?.commits, commitFilter]);

  if (isLoading || !currentProject) {
    return (
      <div className="w-full max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-12 w-80 bg-muted/40" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl bg-muted/30" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Skeleton className="lg:col-span-8 h-96 rounded-xl bg-muted/30" />
          <Skeleton className="lg:col-span-4 h-96 rounded-xl bg-muted/30" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8">
      {/* ─── Hero Header Bar ────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-border/50">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              {currentProject.name}
            </h1>
            <Badge
              variant="outline"
              className="text-xs font-mono bg-muted/60 border-border text-muted-foreground"
            >
              <ShieldCheck className="h-3 w-3 mr-1 text-emerald-400" />
              Active Project
            </Badge>
            <button
              onClick={handleCopyId}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded-md bg-muted/40 hover:bg-muted/70 text-muted-foreground hover:text-foreground transition-colors border border-border/50"
              title="Click to copy full Project ID"
            >
              {copiedId ? (
                <Check className="h-3 w-3 text-emerald-400" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
              <span>ID: {id.slice(0, 8)}…</span>
            </button>
          </div>
          <p className="text-sm text-muted-foreground mt-1.5 flex items-center gap-2">
            AI-powered code intelligence, architecture visualization, and meeting analysis
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {currentProject.githubUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={handlePollCommits}
              disabled={isActionLoading}
              className="border-border/60 text-xs h-9"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 mr-1.5 ${isActionLoading ? "animate-spin text-primary" : ""}`}
              />
              Poll Commits
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowInvite(!showInvite)}
            className="border-border/60 text-xs h-9"
          >
            <UserPlus className="h-3.5 w-3.5 mr-1.5" />
            Invite Member
          </Button>

          <Link to={`/projects/${id}/visualise`}>
            <Button size="sm" className="text-xs h-9 shadow-sm">
              <FolderTree className="h-3.5 w-3.5 mr-1.5" />
              Architecture View
            </Button>
          </Link>
        </div>
      </div>

      {/* Inline Invite Bar */}
      {showInvite && (
        <Card className="glass border-border/60 bg-card/60 backdrop-blur-md animate-in fade-in duration-200">
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
                className="text-xs h-9 bg-background/50"
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

      {/* ─── Metric Cards Grid ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Commits */}
        <Card className="glass border-border/50 hover:border-border transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Commits Tracked
              </span>
              <div className="text-2xl font-bold font-mono">
                {currentProject.commits?.length || 0}
              </div>
              <p className="text-[11px] text-muted-foreground">
                {currentProject.githubUrl ? "Synced with GitHub" : "No repo connected"}
              </p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground">
              <GitGraph className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Documentation Sections */}
        <Link to={`/projects/${id}/documentation`} className="block group">
          <Card className="glass border-border/50 group-hover:border-primary/40 transition-all h-full">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Documentation
                </span>
                <div className="text-2xl font-bold font-mono group-hover:text-primary transition-colors">
                  12 Sections
                </div>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                  Architecture & setup guides <ChevronDown className="h-3 w-3 -rotate-90" />
                </p>
              </div>
              <div className="h-11 w-11 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                <BookText className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Codebase Q&A */}
        <Link to={`/projects/${id}/qna`} className="block group">
          <Card className="glass border-border/50 group-hover:border-primary/40 transition-all h-full">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Q & A Engine
                </span>
                <div className="text-2xl font-bold font-mono group-hover:text-primary transition-colors">
                  AI Ready
                </div>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                  Vector search over codebase <ChevronDown className="h-3 w-3 -rotate-90" />
                </p>
              </div>
              <div className="h-11 w-11 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                <FileQuestion className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Meeting Audio */}
        <Link to={`/projects/${id}/meetings`} className="block group">
          <Card className="glass border-border/50 group-hover:border-primary/40 transition-all h-full">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Audio Meetings
                </span>
                <div className="text-2xl font-bold font-mono group-hover:text-primary transition-colors">
                  {currentProject.meetings?.length || 0} Sessions
                </div>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                  Transcribe & extract topics <ChevronDown className="h-3 w-3 -rotate-90" />
                </p>
              </div>
              <div className="h-11 w-11 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                <Presentation className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* ─── Main Two-Column Screen Layout ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (8 cols): GitHub Status & Commit Timeline */}
        <div className="lg:col-span-8 space-y-6">
          {/* GitHub Connection Card */}
          {!currentProject.githubUrl ? (
            <Card className="glass border-border/60 bg-gradient-to-br from-card/80 to-muted/20">
              <CardHeader>
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-lg bg-muted border border-border flex items-center justify-center text-foreground">
                    <GitBranch className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Connect GitHub Repository</CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      Link a public or private GitHub repository to index code, generate diagrams, and poll commits.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLinkRepo} className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      placeholder="https://github.com/username/repository"
                      className="pl-10 text-xs h-10 bg-background/50 border-border/70"
                    />
                  </div>
                  <Button type="submit" disabled={isActionLoading} className="h-10 text-xs px-5">
                    {isActionLoading ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 mr-2 animate-spin" />
                        Connecting…
                      </>
                    ) : (
                      <>
                        <GitBranch className="h-3.5 w-3.5 mr-2" />
                        Link Repository
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card className="glass border-border/60 bg-card/40">
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-muted border border-border flex items-center justify-center text-foreground">
                      <GitBranch className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                          Connected Repository
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[10px] font-mono border-emerald-500/30 text-emerald-400 bg-emerald-500/10 px-2 py-0"
                        >
                          Live Sync
                        </Badge>
                      </div>
                      <a
                        href={currentProject.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-semibold text-foreground hover:underline flex items-center gap-1.5 mt-0.5"
                      >
                        {currentProject.githubUrl.replace("https://github.com/", "")}
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyClone}
                      className="h-8 text-xs border-border/60 font-mono"
                      title="Copy git clone command"
                    >
                      {copiedClone ? (
                        <>
                          <Check className="h-3 w-3 mr-1 text-emerald-400" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Code2 className="h-3 w-3 mr-1" />
                          git clone
                        </>
                      )}
                    </Button>
                    <a
                      href={currentProject.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="sm" className="h-8 text-xs border-border/60">
                        GitHub
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </Button>
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Commit Log Section */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/40">
              <div className="flex items-center gap-2">
                <GitGraph className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-base font-semibold text-foreground">Commit Activity & AI Summaries</h2>
                <Badge variant="secondary" className="text-xs font-mono ml-1">
                  {filteredCommits.length}
                </Badge>
              </div>

              {currentProject.commits?.length > 0 && (
                <div className="relative w-full sm:w-64">
                  <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-muted-foreground" />
                  <input
                    type="text"
                    value={commitFilter}
                    onChange={(e) => setCommitFilter(e.target.value)}
                    placeholder="Filter commits…"
                    className="w-full pl-8 pr-3 py-1 text-xs bg-muted/40 border border-border/60 rounded-lg focus:outline-none focus:border-ring text-foreground"
                  />
                </div>
              )}
            </div>

            {filteredCommits.length === 0 ? (
              <Card className="glass border-border/40">
                <CardContent className="py-12 text-center space-y-3">
                  <GitGraph className="h-10 w-10 text-muted-foreground mx-auto opacity-50" />
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    {commitFilter
                      ? "No commits match your search filter."
                      : "No commit history found. Click 'Poll Commits' above to fetch from GitHub."}
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
                      className="glass border-border/50 hover:border-primary/50 transition-all bg-card/30"
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
                              <div className="h-7 w-7 rounded-full bg-muted border border-border flex items-center justify-center text-[10px] font-bold text-muted-foreground shrink-0">
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
                            {currentProject.githubUrl && commit.commitHash && (
                              <a
                                href={`${currentProject.githubUrl}/commit/${commit.commitHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/50"
                              >
                                {commit.commitHash.slice(0, 7)}
                                <ExternalLink className="h-2.5 w-2.5" />
                              </a>
                            )}
                            {commit.summary && (
                              <button
                                onClick={() => setExpandedCommit(isExpanded ? null : commit._id)}
                                className="p-1 rounded hover:bg-muted/60 text-muted-foreground hover:text-foreground"
                                title={isExpanded ? "Collapse AI Summary" : "Expand AI Summary"}
                              >
                                {isExpanded ? (
                                  <ChevronUp className="h-3.5 w-3.5" />
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

                        {/* AI Summary Section */}
                        {commit.summary && isExpanded && (
                          <div className="ml-9 p-3 rounded-lg bg-muted/80 border border-border text-[11px] space-y-1.5 animate-in fade-in duration-150">
                            <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
                              <Sparkles className="h-3 w-3 text-amber-400" />
                              <span>AI Code Summary</span>
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
        </div>

        {/* Right Column (4 cols): Team, Shortcuts, Insights */}
        <div className="lg:col-span-4 space-y-6">
          {/* Team Collaborators Card */}
          <Card className="glass border-border/50 bg-card/40">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  Team Members
                </CardTitle>
                <Badge variant="outline" className="text-[10px] font-mono">
                  {currentProject.members?.length || 1}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                {currentProject.members?.map((member, i) => (
                  <div
                    key={member._id || i}
                    className="flex items-center justify-between p-2 rounded-lg bg-background/40 border border-border/40 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-7 w-7 rounded-full bg-muted border border-border flex items-center justify-center text-[10px] font-bold text-foreground shrink-0">
                        {member.name?.[0]?.toUpperCase() || "U"}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">{member.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{member.email}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
                      {i === 0 ? "Owner" : "Member"}
                    </Badge>
                  </div>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowInvite(true)}
                className="w-full text-xs h-8 border-border/60"
              >
                <UserPlus className="h-3 w-3 mr-1.5" />
                Invite Collaborator
              </Button>
            </CardContent>
          </Card>

          {/* Quick Launchpad Navigation */}
          <Card className="glass border-border/50 bg-card/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-muted-foreground" />
                Project Intelligence Tools
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link
                to={`/projects/${id}/documentation`}
                className="flex items-center justify-between p-2.5 rounded-lg border border-border/40 bg-background/30 hover:bg-muted/40 transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <BookText className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  <div>
                    <p className="text-xs font-medium text-foreground">Technical Manual</p>
                    <p className="text-[10px] text-muted-foreground">12 Structured onboarding guides</p>
                  </div>
                </div>
                <ChevronDown className="h-3.5 w-3.5 -rotate-90 text-muted-foreground group-hover:text-foreground" />
              </Link>

              <Link
                to={`/projects/${id}/qna`}
                className="flex items-center justify-between p-2.5 rounded-lg border border-border/40 bg-background/30 hover:bg-muted/40 transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <FileQuestion className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  <div>
                    <p className="text-xs font-medium text-foreground">Codebase Q&A</p>
                    <p className="text-[10px] text-muted-foreground">Ask AI questions about code</p>
                  </div>
                </div>
                <ChevronDown className="h-3.5 w-3.5 -rotate-90 text-muted-foreground group-hover:text-foreground" />
              </Link>

              <Link
                to={`/projects/${id}/meetings`}
                className="flex items-center justify-between p-2.5 rounded-lg border border-border/40 bg-background/30 hover:bg-muted/40 transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <Presentation className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  <div>
                    <p className="text-xs font-medium text-foreground">Meeting Audio</p>
                    <p className="text-[10px] text-muted-foreground">Audio transcription & topic analysis</p>
                  </div>
                </div>
                <ChevronDown className="h-3.5 w-3.5 -rotate-90 text-muted-foreground group-hover:text-foreground" />
              </Link>

              <Link
                to={`/projects/${id}/visualise`}
                className="flex items-center justify-between p-2.5 rounded-lg border border-border/40 bg-background/30 hover:bg-muted/40 transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <FolderTree className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  <div>
                    <p className="text-xs font-medium text-foreground">Architecture Diagram</p>
                    <p className="text-[10px] text-muted-foreground">Interactive file flowchart & tree</p>
                  </div>
                </div>
                <ChevronDown className="h-3.5 w-3.5 -rotate-90 text-muted-foreground group-hover:text-foreground" />
              </Link>
            </CardContent>
          </Card>

          {/* System Environment Information */}
          <Card className="glass border-border/40 bg-card/20 text-xs">
            <CardContent className="p-4 space-y-2 font-mono text-[11px] text-muted-foreground">
              <div className="flex justify-between py-1 border-b border-border/30">
                <span>Vector Index:</span>
                <span className="text-emerald-400 font-semibold">Active (Pinecone)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/30">
                <span>AI Model:</span>
                <span className="text-foreground">Gemini 1.5 Pro</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/30">
                <span>Transcription:</span>
                <span className="text-foreground">AssemblyAI / Whisper</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Created:</span>
                <span className="text-foreground">
                  {currentProject.createdAt
                    ? new Date(currentProject.createdAt).toLocaleDateString()
                    : "Recent"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

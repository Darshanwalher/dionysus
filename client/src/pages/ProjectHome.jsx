import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchProject, linkRepo, pollCommits, inviteUser } from "@/store/slices/projectSlice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  GitGraph,
  GitBranch,
  ExternalLink,
  UserPlus,
  Users,
  Link2,
  Copy,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ProjectHome() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { currentProject, isLoading, isActionLoading } = useSelector(
    (state) => state.project
  );
  const [githubUrl, setGithubUrl] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    dispatch(fetchProject(id));
  }, [dispatch, id]);

  const handleLinkRepo = async (e) => {
    e.preventDefault();
    if (!githubUrl.trim()) return;
    await dispatch(linkRepo({ projectId: id, githubUrl }));
  };

  const handlePollCommits = () => {
    dispatch(pollCommits(id));
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    await dispatch(inviteUser({ projectId: id, email: inviteEmail }));
    setInviteEmail("");
    setShowInvite(false);
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading || !currentProject) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Project Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">
            {currentProject.name}
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={handleCopyId}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {copied ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
              {id.slice(0, 12)}...
            </button>
          </div>
        </div>

        {/* Team Members */}
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {currentProject.members?.map((member, i) => (
              <div
                key={member._id || i}
                className="h-8 w-8 rounded-full bg-primary/20 border-2 border-background flex items-center justify-center text-xs font-medium text-primary"
                title={member.name}
              >
                {member.name?.[0]?.toUpperCase()}
              </div>
            ))}
          </div>
          {showInvite ? (
            <form onSubmit={handleInvite} className="flex gap-2">
              <Input
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="user@email.com"
                type="email"
                className="h-9 w-48 text-sm"
                autoFocus
              />
              <Button size="sm" type="submit">
                Invite
              </Button>
            </form>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowInvite(true)}
            >
              <UserPlus className="h-4 w-4 mr-1" />
              Invite
            </Button>
          )}
        </div>
      </div>

      {/* Link Repo Card */}
      {!currentProject.githubUrl ? (
        <Card className="glass border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <GitBranch className="h-5 w-5" />
              Link your GitHub Repository
            </CardTitle>
            <CardDescription>
              Connect a GitHub repo to generate documentation, track commits, and
              ask AI questions about your codebase.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLinkRepo} className="flex gap-3">
              <div className="relative flex-1">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/username/repo"
                  className="pl-10"
                />
              </div>
              <Button type="submit" isLoading={isActionLoading}>
                <GitBranch className="h-4 w-4 mr-2" />
                Link Repository
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card className="glass border-border/50">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <GitBranch className="h-5 w-5 text-primary" />
              <a
                href={currentProject.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                {currentProject.githubUrl}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <Badge variant="outline" className="text-green-400 border-green-400/30">
              Connected
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* Commit Log */}
      {currentProject.githubUrl && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Commit Log</h2>
            <Button
              variant="outline"
              onClick={handlePollCommits}
              isLoading={isActionLoading}
            >
              <GitGraph className="mr-2 h-4 w-4" />
              Poll Commits
            </Button>
          </div>

          {currentProject.commits?.length === 0 ? (
            <Card className="glass border-border/50">
              <CardContent className="py-8 text-center text-muted-foreground">
                No commits yet. Click "Poll Commits" to fetch the latest commits.
              </CardContent>
            </Card>
          ) : (
            <ul className="space-y-4">
              {currentProject.commits?.map((commit, idx) => (
                <li key={commit._id} className="relative flex gap-x-4">
                  <div
                    className={cn(
                      idx === currentProject.commits.length - 1
                        ? "h-6"
                        : "-bottom-6",
                      "absolute left-0 top-0 flex w-6 justify-center"
                    )}
                  >
                    <div className="w-px bg-border" />
                  </div>

                  {commit.commitAuthorAvatar ? (
                    <img
                      src={commit.commitAuthorAvatar}
                      alt=""
                      className="relative mt-3 h-8 w-8 flex-none rounded-full bg-muted ring-2 ring-background"
                    />
                  ) : (
                    <div className="relative mt-3 h-8 w-8 flex-none rounded-full bg-primary/20 flex items-center justify-center text-xs text-primary ring-2 ring-background">
                      {commit.commitAuthorName?.[0]?.toUpperCase()}
                    </div>
                  )}

                  <Card className="flex-auto glass border-border/50 hover:border-primary/30 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex justify-between gap-x-4">
                        <a
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                          href={`${currentProject.githubUrl}/commit/${commit.commitHash}`}
                        >
                          <span className="font-medium text-foreground">
                            {commit.commitAuthorName}
                          </span>{" "}
                          <span className="inline-flex items-center gap-1">
                            committed
                            <ExternalLink className="h-3 w-3" />
                          </span>
                        </a>
                        <time className="flex-none text-xs text-muted-foreground">
                          {new Date(commit.commitDate).toLocaleString()}
                        </time>
                      </div>
                      <p className="font-semibold mt-1 text-sm">
                        {commit.commitMessage}
                      </p>
                      <pre className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground leading-relaxed">
                        {commit.summary}
                      </pre>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

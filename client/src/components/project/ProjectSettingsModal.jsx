import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { updateProject, deleteProject } from "@/store/slices/projectSlice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Settings,
  X,
  Trash2,
  AlertTriangle,
  Save,
  Copy,
  Check,
  GitBranch,
  Users,
  ShieldAlert,
  Calendar,
  Layers,
  ArrowUpRight,
} from "lucide-react";

export default function ProjectSettingsModal({ project, isOpen, onClose }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isActionLoading } = useSelector((state) => state.project);

  const [activeTab, setActiveTab] = useState("general"); // "general" | "danger"
  const [name, setName] = useState("");
  const [confirmName, setConfirmName] = useState("");
  const [copiedId, setCopiedId] = useState(false);

  useEffect(() => {
    if (project) {
      setName(project.name || "");
      setConfirmName("");
      setActiveTab("general");
    }
  }, [project, isOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !project) return null;

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Project name cannot be empty");
      return;
    }
    const res = await dispatch(
      updateProject({ projectId: project._id, name: name.trim() })
    );
    if (res.meta.requestStatus === "fulfilled") {
      toast.success("Project updated successfully");
      onClose();
    } else {
      toast.error(res.payload || "Failed to update project");
    }
  };

  const handleDelete = async () => {
    if (confirmName.trim() !== project.name) {
      toast.error("Project name confirmation does not match");
      return;
    }

    const res = await dispatch(deleteProject(project._id));
    if (res.meta.requestStatus === "fulfilled") {
      toast.success(`Project "${project.name}" has been deleted`);
      onClose();
      navigate("/");
    } else {
      toast.error(res.payload || "Failed to delete project");
    }
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(project._id);
    setCopiedId(true);
    toast.success("Project ID copied to clipboard");
    setTimeout(() => setCopiedId(false), 2000);
  };

  const formattedDate = project.createdAt
    ? new Date(project.createdAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-fade-in cursor-default"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-border/80 bg-card/95 shadow-[0_24px_64px_-12px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.05)] overflow-hidden animate-scale-in flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Accent Shimmer Line */}
        <div
          className={`h-0.5 w-full transition-all duration-300 ${
            activeTab === "danger"
              ? "bg-gradient-to-r from-transparent via-rose-500 to-transparent"
              : "bg-gradient-to-r from-transparent via-primary to-transparent"
          }`}
        />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border/50 bg-secondary/15">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-primary shadow-xs">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold tracking-tight text-foreground">
                  Project Settings
                </h2>
                <Badge
                  variant="outline"
                  className="text-[10px] py-0 px-1.5 h-4 font-mono border-border/60 text-muted-foreground"
                >
                  Owner
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground truncate max-w-[280px]">
                {project.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary/80 hover:text-foreground transition-all active:scale-95 cursor-pointer"
            title="Close (Esc)"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Segmented Pill Tabs */}
        <div className="px-6 pt-4 pb-2">
          <div className="grid grid-cols-2 p-1 rounded-xl bg-secondary/50 border border-border/40 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab("general")}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-medium transition-all cursor-pointer ${
                activeTab === "general"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Settings className="h-3.5 w-3.5" />
              General
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("danger")}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-medium transition-all cursor-pointer ${
                activeTab === "danger"
                  ? "bg-rose-500/15 text-rose-400 shadow-xs font-semibold border border-rose-500/30"
                  : "text-muted-foreground hover:text-rose-400"
              }`}
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              Danger Zone
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 pt-3 space-y-4 overflow-y-auto max-h-[70vh]">
          {activeTab === "general" && (
            <form onSubmit={handleUpdate} className="space-y-5">
              {/* Project Name Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="project-name" className="text-xs font-medium text-foreground">
                    Project Name
                  </Label>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    {name.length}/60
                  </span>
                </div>
                <Input
                  id="project-name"
                  value={name}
                  maxLength={60}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dionysus AI Suite"
                  className="h-10 text-sm bg-background/80 border-border/70 focus:border-primary transition-colors"
                  autoFocus
                />
              </div>

              {/* Workspace Metadata Cards */}
              <div className="rounded-xl border border-border/60 bg-secondary/20 p-4 space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Workspace Details
                </p>

                {/* Project ID */}
                <div className="flex items-center justify-between gap-2 text-xs pt-1">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5" />
                    Project ID
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyId}
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-secondary/60 hover:bg-secondary text-[11px] font-mono text-muted-foreground hover:text-foreground border border-border/60 transition-all cursor-pointer active:scale-95"
                    title="Click to copy ID"
                  >
                    {copiedId ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-400" />
                        <span className="text-emerald-400 font-semibold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>{project._id.slice(0, 12)}…</span>
                      </>
                    )}
                  </button>
                </div>

                {/* GitHub Repository */}
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <GitBranch className="h-3.5 w-3.5" />
                    GitHub Repo
                  </span>
                  {project.githubUrl ? (
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-mono text-primary hover:underline cursor-pointer"
                    >
                      <span className="truncate max-w-[200px]">
                        {project.githubUrl.replace("https://github.com/", "")}
                      </span>
                      <ArrowUpRight className="h-3 w-3" />
                    </a>
                  ) : (
                    <Badge variant="secondary" className="text-[10px] font-normal text-muted-foreground">
                      None linked
                    </Badge>
                  )}
                </div>

                {/* Team Members */}
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" />
                    Collaborators
                  </span>
                  <span className="text-xs font-medium text-foreground">
                    {project.members?.length || 1} team member{project.members?.length === 1 ? "" : "s"}
                  </span>
                </div>

                {/* Created Date */}
                {formattedDate && (
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      Created
                    </span>
                    <span className="text-xs font-mono text-muted-foreground">
                      {formattedDate}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  className="text-xs h-9 px-4 cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isActionLoading || !name.trim() || name.trim() === project.name}
                  className="text-xs h-9 px-4 cursor-pointer disabled:cursor-not-allowed"
                >
                  <Save className="h-3.5 w-3.5 mr-1.5" />
                  Save Changes
                </Button>
              </div>
            </form>
          )}

          {activeTab === "danger" && (
            <div className="space-y-4">
              {/* Warning Alert Banner */}
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 space-y-2.5">
                <div className="flex items-center gap-2 font-semibold text-rose-400 text-sm">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
                  Destructive &amp; Irreversible Action
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Deleting this project will permanently scrub all associated assets from both MongoDB and Pinecone:
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-muted-foreground font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-400 shrink-0" />
                    Commit summaries
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-400 shrink-0" />
                    Generated documentation
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-400 shrink-0" />
                    Meeting transcripts
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-400 shrink-0" />
                    Pinecone vector index
                  </div>
                </div>
              </div>

              {/* Confirmation Input Box */}
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <Label htmlFor="confirm-delete" className="font-medium text-foreground">
                    Confirm deletion:
                  </Label>
                  <button
                    type="button"
                    onClick={() => setConfirmName(project.name)}
                    className="text-[11px] text-primary hover:underline cursor-pointer"
                    title="Click to auto-fill"
                  >
                    Auto-fill name
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Please type{" "}
                  <code
                    onClick={() => setConfirmName(project.name)}
                    className="rounded bg-rose-500/15 border border-rose-500/30 px-1.5 py-0.5 font-mono font-bold text-rose-400 cursor-pointer hover:bg-rose-500/25 transition-colors"
                    title="Click to copy into input"
                  >
                    {project.name}
                  </code>{" "}
                  to proceed:
                </p>
                <Input
                  id="confirm-delete"
                  value={confirmName}
                  onChange={(e) => setConfirmName(e.target.value)}
                  placeholder={project.name}
                  className="h-10 text-sm border-rose-500/40 focus:border-rose-500 focus-visible:ring-rose-500/30 font-mono"
                  autoFocus
                />
              </div>

              {/* Danger Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/50">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  className="text-xs h-9 px-4 cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={confirmName.trim() !== project.name || isActionLoading}
                  onClick={handleDelete}
                  className="text-xs h-9 px-4 bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  Permanently Delete
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

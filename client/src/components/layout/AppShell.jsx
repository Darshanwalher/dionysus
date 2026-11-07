import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import ThemeToggle from "@/components/theme/ThemeToggle";
import CommandPalette from "@/components/layout/CommandPalette";
import { logout } from "@/store/slices/authSlice";
import { createProject } from "@/store/slices/projectSlice";
import {
  BookText,
  FileQuestion,
  FolderTree,
  Home,
  Menu,
  Presentation,
  X,
  Plus,
  LogOut,
  Zap,
  User,
  ChevronRight,
  Settings,
  Search,
  GitBranch,
  ExternalLink,
  PanelLeftClose,
  PanelLeft,
  Activity,
  Layers,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import ProjectSettingsModal from "@/components/project/ProjectSettingsModal";

export default function AppShell({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showProjectSettings, setShowProjectSettings] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.auth);
  const { projects, currentProject, isLoading, isArchitectureLoading, isDependencyLoading } = useSelector(
    (state) => state.project
  );

  const isOwner = Boolean(
    user?._id &&
      currentProject &&
      String(currentProject.owner?._id || currentProject.owner) === String(user._id)
  );

  const isAnalyzing = isArchitectureLoading || isDependencyLoading;

  const navigation = currentProject
    ? [
        { name: "Overview", href: `/projects/${currentProject._id}`, icon: Home },
        { name: "Architecture & Graph", href: `/projects/${currentProject._id}/visualise`, icon: FolderTree },
        { name: "Meetings", href: `/projects/${currentProject._id}/meetings`, icon: Presentation },
        { name: "Documentation", href: `/projects/${currentProject._id}/documentation`, icon: BookText },
        { name: "Codebase Q & A", href: `/projects/${currentProject._id}/qna`, icon: FileQuestion },
      ]
    : [];

  const currentPageName = navigation.find((n) => n.href === location.pathname)?.name ?? null;

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowCommandPalette((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    const result = await dispatch(createProject({ name: newProjectName }));
    if (result.meta.requestStatus === "fulfilled") {
      setNewProjectName("");
      setShowCreateProject(false);
      navigate(`/projects/${result.payload._id}`);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const sidebarContent = (
    <div className="flex grow flex-col gap-y-3.5 overflow-y-auto bg-sidebar px-3 py-3 border-r border-sidebar-border select-none">
      {/* Brand & Collapse Header */}
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-sidebar-border px-1">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-card shadow-2xs group-hover:border-foreground/30 transition-colors">
            <Zap className="h-3.5 w-3.5 text-foreground" />
          </div>
          {!sidebarCollapsed && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold tracking-tight text-foreground uppercase font-mono">
                Dionysus
              </span>
              <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-secondary text-muted-foreground border border-border">
                v2.0
              </span>
            </div>
          )}
        </Link>
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="hidden lg:flex text-muted-foreground hover:text-foreground p-1 rounded hover:bg-secondary cursor-pointer transition-colors"
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? <PanelLeft className="h-3.5 w-3.5" /> : <PanelLeftClose className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Project Switcher Pill */}
      {currentProject && !sidebarCollapsed && (
        <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-secondary/50 px-2.5 py-1.5 hover:bg-secondary/80 transition-colors">
          <Link
            to={`/projects/${currentProject._id}`}
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-2 min-w-0 flex-1"
          >
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-border bg-card text-[10px] font-mono font-bold text-foreground">
              {currentProject.name[0]?.toUpperCase()}
            </span>
            <div className="flex flex-col min-w-0">
              <span className="truncate text-xs font-semibold text-foreground leading-tight">
                {currentProject.name}
              </span>
              <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
                <span className={cn("h-1.5 w-1.5 rounded-full", isAnalyzing ? "bg-amber-400 animate-pulse" : "bg-emerald-500")} />
                {isAnalyzing ? "Analyzing AST..." : "Ready"}
              </span>
            </div>
          </Link>
          {isOwner && (
            <button
              onClick={() => setShowProjectSettings(true)}
              className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-card cursor-pointer transition-colors"
              title="Workspace Settings"
            >
              <Settings className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex flex-1 flex-col">
        <ul className="flex flex-1 flex-col gap-y-4">
          <li>
            <div className={cn("mb-1 px-1", sidebarCollapsed && "text-center")}>
              {!sidebarCollapsed && (
                <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                  Workspace
                </span>
              )}
            </div>
            <ul className="space-y-0.5">
              {navigation.map((item) => {
                const active = location.pathname === item.href;
                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      onClick={() => setSidebarOpen(false)}
                      title={sidebarCollapsed ? item.name : undefined}
                      className={cn(
                        "group relative flex items-center gap-x-2.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all duration-150",
                        active
                          ? "bg-foreground text-background font-semibold shadow-xs"
                          : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                        sidebarCollapsed && "justify-center px-0 h-9"
                      )}
                    >
                      <item.icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      {!sidebarCollapsed && <span className="truncate">{item.name}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </li>

          {/* Project List */}
          {!sidebarCollapsed && (
            <li>
              <div className="flex items-center justify-between mb-1 px-1">
                <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                  Repositories
                </span>
                <span className="text-[10px] font-mono px-1 rounded bg-secondary text-muted-foreground">
                  {projects?.length || 0}
                </span>
              </div>

              <ul className="space-y-0.5 max-h-36 overflow-y-auto pr-1">
                {isLoading &&
                  [1, 2].map((i) => (
                    <Skeleton key={i} className="h-7 bg-sidebar-accent/50 my-1 rounded" />
                  ))}
                {projects?.map((project) => (
                  <li key={project._id}>
                    <Link
                      to={`/projects/${project._id}`}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        currentProject?._id === project._id
                          ? "bg-secondary text-foreground font-semibold border border-border"
                          : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                        "flex items-center gap-x-2 rounded px-2 py-1.5 text-xs transition-colors"
                      )}
                    >
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-border bg-card text-[9px] font-mono font-semibold">
                        {project.name[0]?.toUpperCase()}
                      </span>
                      <span className="truncate">{project.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>

              {showCreateProject ? (
                <form onSubmit={handleCreateProject} className="mt-2 flex gap-1.5 px-0.5">
                  <Input
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="Repo name…"
                    className="h-7 text-xs"
                    autoFocus
                  />
                  <Button type="submit" size="xs" className="h-7 px-2 shrink-0">
                    <Plus className="h-3 w-3" />
                  </Button>
                </form>
              ) : (
                <button
                  onClick={() => setShowCreateProject(true)}
                  className="mt-2 flex w-full items-center justify-center gap-1.5 rounded border border-dashed border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground hover:bg-secondary cursor-pointer"
                >
                  <Plus className="h-3 w-3" />
                  <span>Connect Repository</span>
                </button>
              )}
            </li>
          )}

          {/* User Footer */}
          <li className="mt-auto">
            <div className="rounded-md border border-border bg-card p-2 flex items-center justify-between gap-2 shadow-2xs">
              <div className="flex items-center gap-2 min-w-0">
                <div className="h-6 w-6 rounded bg-secondary border border-border flex items-center justify-center text-[10px] font-mono font-bold text-foreground shrink-0">
                  {user?.name?.[0]?.toUpperCase() || <User className="h-3 w-3" />}
                </div>
                {!sidebarCollapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate leading-none">{user?.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate font-mono mt-0.5">{user?.email}</p>
                  </div>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer shrink-0"
                title="Sign out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          </li>
        </ul>
      </nav>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex selection:bg-foreground/15">
      {/* Mobile drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-xs"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-64 animate-fade-up">
            <div className="absolute right-0 top-0 -mr-10 pt-3">
              <button
                onClick={() => setSidebarOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-md text-foreground cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className={cn(
        "hidden lg:flex lg:flex-col shrink-0 transition-all duration-200",
        sidebarCollapsed ? "w-16" : "w-60"
      )}>
        <div className="fixed inset-y-0 z-30 flex flex-col" style={{ width: sidebarCollapsed ? "4rem" : "15rem" }}>
          {sidebarContent}
        </div>
      </aside>

      {/* Main Workspace Viewport */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-12 shrink-0 items-center justify-between border-b border-border bg-background/90 px-4 sm:px-6 backdrop-blur-md">
          {/* Left: Mobile trigger & Breadcrumb */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              className="p-1.5 text-muted-foreground hover:text-foreground lg:hidden cursor-pointer"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-4 w-4" />
            </button>

            {/* Breadcrumbs */}
            <div className="flex items-center gap-1.5 text-xs min-w-0 font-medium">
              <Link to="/" className="text-muted-foreground hover:text-foreground truncate">
                Dionysus
              </Link>
              {currentProject && (
                <>
                  <ChevronRight className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                  <Link
                    to={`/projects/${currentProject._id}`}
                    className="text-muted-foreground hover:text-foreground truncate"
                  >
                    {currentProject.name}
                  </Link>
                  {currentPageName && (
                    <>
                      <ChevronRight className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                      <span className="font-semibold text-foreground truncate">{currentPageName}</span>
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Right: Quick Search Pill, Repo Badge, Theme Toggle */}
          <div className="flex items-center gap-2">
            {/* Quick Command Palette Trigger */}
            <button
              onClick={() => setShowCommandPalette(true)}
              className="flex items-center gap-2 px-2.5 py-1 rounded-md border border-border bg-secondary/50 text-xs text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-all cursor-pointer shadow-2xs"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Search repo, docs, nodes</span>
              <kbd className="hidden sm:inline-flex text-[10px]">⌘K</kbd>
            </button>

            {/* GitHub Repo Link Badge */}
            {currentProject?.githubUrl && (
              <a
                href={currentProject.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border bg-card text-xs text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors font-mono"
              >
                <GitBranch className="h-3 w-3 text-foreground" />
                <span className="truncate max-w-[130px]">
                  {currentProject.githubUrl.replace(/^https?:\/\/github\.com\//, "")}
                </span>
                <ExternalLink className="h-2.5 w-2.5 opacity-50" />
              </a>
            )}

            <ThemeToggle className="h-7 w-7" />
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Command Palette Modal */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onOpenCreateProject={() => setShowCreateProject(true)}
        onOpenSettings={() => setShowProjectSettings(true)}
      />

      {/* Project Settings Modal */}
      <ProjectSettingsModal
        project={currentProject}
        isOpen={showProjectSettings}
        onClose={() => setShowProjectSettings(false)}
      />
    </div>
  );
}

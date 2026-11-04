import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
  const { projects, currentProject, isLoading } = useSelector(
    (state) => state.project
  );

  const isOwner = Boolean(
    user?._id &&
      currentProject &&
      String(currentProject.owner?._id || currentProject.owner) === String(user._id)
  );

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

  // Global Ctrl+K / Cmd+K shortcut listener
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
    <div className="flex grow flex-col gap-y-4 overflow-y-auto bg-sidebar px-3.5 pb-3.5 border-r border-sidebar-border">
      {/* Brand & Collapse Header */}
      <div className="flex h-13 shrink-0 items-center justify-between border-b border-sidebar-border px-1">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="icon-tile h-7 w-7 rounded">
            <Zap className="h-3.5 w-3.5" />
          </div>
          {!sidebarCollapsed && (
            <span className="text-sm font-semibold tracking-tight text-foreground">
              Dionysus
            </span>
          )}
        </Link>
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="hidden lg:flex text-muted-foreground hover:text-foreground p-1 rounded hover:bg-secondary cursor-pointer"
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? <PanelLeft className="h-3.5 w-3.5" /> : <PanelLeftClose className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Project Switcher Pill */}
      {currentProject && !sidebarCollapsed && (
        <div className="flex items-center justify-between gap-2 rounded-md border border-border/80 bg-sidebar-accent/50 px-2.5 py-1.5 hover:bg-sidebar-accent transition-colors">
          <Link
            to={`/projects/${currentProject._id}`}
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-2 min-w-0 flex-1"
          >
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-primary/30 bg-primary/10 text-[10px] font-mono font-bold text-primary">
              {currentProject.name[0]?.toUpperCase()}
            </span>
            <span className="flex-1 truncate text-xs font-medium text-foreground">
              {currentProject.name}
            </span>
          </Link>
          {isOwner && (
            <button
              onClick={() => setShowProjectSettings(true)}
              className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-card cursor-pointer"
              title="Project Settings"
            >
              <Settings className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex flex-1 flex-col">
        <ul className="flex flex-1 flex-col gap-y-5">
          <li>
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
                        "group relative flex items-center gap-x-2.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                        active
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground",
                        sidebarCollapsed && "justify-center px-0"
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                      {!sidebarCollapsed && <span>{item.name}</span>}
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
                  Workspaces
                </span>
                <span className="text-[10px] font-mono text-muted-foreground">
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
                          ? "bg-secondary text-foreground font-medium"
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
                    placeholder="Workspace name…"
                    className="h-7 text-xs"
                    autoFocus
                  />
                  <Button type="submit" size="sm" className="h-7 px-2 shrink-0">
                    <Plus className="h-3 w-3" />
                  </Button>
                </form>
              ) : (
                <button
                  onClick={() => setShowCreateProject(true)}
                  className="mt-2 flex w-full items-center gap-1.5 rounded border border-dashed border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground hover:bg-secondary cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>New Workspace</span>
                </button>
              )}
            </li>
          )}

          {/* User Footer */}
          <li className="mt-auto">
            <div className="rounded-md border border-border bg-card p-2.5 flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] font-mono font-bold text-primary shrink-0">
                {user?.name?.[0]?.toUpperCase() || <User className="h-3 w-3" />}
              </div>
              {!sidebarCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate leading-none">{user?.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate font-mono mt-0.5">{user?.email}</p>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
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
    <div className="min-h-screen bg-background text-foreground flex">
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
                className="flex h-8 w-8 items-center justify-center rounded-md text-foreground"
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

      {/* Main Container */}
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

            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-xs min-w-0">
              <Link to="/" className="text-muted-foreground hover:text-foreground font-medium truncate">
                Dionysus
              </Link>
              {currentProject && (
                <>
                  <ChevronRight className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                  <Link
                    to={`/projects/${currentProject._id}`}
                    className="font-medium text-foreground hover:text-primary truncate"
                  >
                    {currentProject.name}
                  </Link>
                  {currentPageName && (
                    <>
                      <ChevronRight className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                      <span className="font-semibold text-primary truncate">{currentPageName}</span>
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Right: Command Palette trigger, Repo Pill, Theme, Settings */}
          <div className="flex items-center gap-2">
            {/* Quick Command Palette Button */}
            <button
              onClick={() => setShowCommandPalette(true)}
              className="flex items-center gap-2 px-2.5 py-1 rounded-md border border-border bg-secondary/50 text-xs text-muted-foreground hover:text-foreground hover:border-border/80 transition-colors cursor-pointer"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Search & Navigate</span>
              <kbd className="hidden sm:inline-flex">Ctrl K</kbd>
            </button>

            {/* GitHub Repo Link Badge */}
            {currentProject?.githubUrl && (
              <a
                href={currentProject.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border bg-card text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors font-mono"
              >
                <GitBranch className="h-3 w-3 text-primary" />
                <span className="truncate max-w-[140px]">
                  {currentProject.githubUrl.replace(/^https?:\/\/github\.com\//, "")}
                </span>
                <ExternalLink className="h-2.5 w-2.5 opacity-60" />
              </a>
            )}

            <ThemeToggle className="h-8 w-8" />
          </div>
        </header>

        {/* Content */}
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

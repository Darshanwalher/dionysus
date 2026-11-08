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
  Activity,
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
  FolderGit2,
} from "lucide-react";
import ProjectSettingsModal from "@/components/project/ProjectSettingsModal";

export default function AppShell({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem("dionysus_sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });
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
  const isVisualisePage = location.pathname.endsWith("/visualise");

  const navigation = currentProject
    ? [
        { name: "Overview", href: `/projects/${currentProject._id}`, icon: Home },
        { name: "Repository Health", href: `/projects/${currentProject._id}/health`, icon: Activity },
        { name: "Architecture & Graph", href: `/projects/${currentProject._id}/visualise`, icon: FolderTree },
        { name: "Meetings", href: `/projects/${currentProject._id}/meetings`, icon: Presentation },
        { name: "Documentation", href: `/projects/${currentProject._id}/documentation`, icon: BookText },
        { name: "Codebase Q & A", href: `/projects/${currentProject._id}/qna`, icon: FileQuestion },
      ]
    : [];

  const currentPageName = navigation.find((n) => n.href === location.pathname)?.name ?? null;

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("dionysus_sidebar_collapsed", String(next));
      } catch {}
      return next;
    });
  };

  // Global Keyboard listener: ⌘K for Command Palette, ⌘B for Sidebar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setShowCommandPalette((prev) => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleSidebar();
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

  // Render Sidebar Content (supports forceExpanded for mobile drawer)
  const renderSidebarContent = (isMobile = false) => {
    const collapsed = isMobile ? false : sidebarCollapsed;

    return (
      <div
        className={cn(
          "flex grow flex-col h-full bg-sidebar border-r border-sidebar-border select-none transition-all duration-200",
          collapsed ? "px-2 py-3 overflow-visible" : "px-3 py-3 overflow-y-auto"
        )}
      >
        {/* Brand Header */}
        <div
          className={cn(
            "flex h-12 shrink-0 items-center border-b border-sidebar-border/70 mb-3",
            collapsed ? "justify-center px-0" : "justify-between px-1"
          )}
        >
          {collapsed ? (
            /* Collapsed Brand: Sleek interactive button with smooth hover expand indicator */
            <div className="relative group flex items-center justify-center">
              <button
                type="button"
                onClick={toggleSidebar}
                className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border/70 bg-card/80 hover:bg-secondary hover:border-foreground/30 transition-all shadow-xs cursor-pointer"
              >
                <Zap className="h-4 w-4 text-amber-500 fill-amber-500/10 transition-transform duration-200 group-hover:scale-0 group-hover:opacity-0" />
                <PanelLeft className="h-4 w-4 text-foreground transition-transform duration-200 scale-0 opacity-0 group-hover:scale-100 group-hover:opacity-100 absolute" />
              </button>
              {/* Tooltip */}
              <div className="pointer-events-none absolute left-full ml-2.5 z-50 hidden rounded-md border border-border bg-popover px-2.5 py-1 text-xs font-medium text-popover-foreground shadow-md transition-opacity group-hover:flex items-center gap-1.5 whitespace-nowrap">
                <span>Expand sidebar</span>
                <kbd className="text-[10px] font-mono text-muted-foreground bg-muted px-1 rounded">⌘B</kbd>
              </div>
            </div>
          ) : (
            /* Expanded Brand */
            <>
              <Link to="/" className="flex items-center gap-2.5 group">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/80 bg-gradient-to-b from-card to-secondary/60 shadow-xs group-hover:border-foreground/30 transition-all">
                  <Zap className="h-4 w-4 text-amber-500 fill-amber-500/15" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold tracking-tight text-foreground font-sans">
                    DIONYSUS
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border font-medium">
                    v2.0
                  </span>
                </div>
              </Link>
              {!isMobile && (
                <button
                  type="button"
                  onClick={toggleSidebar}
                  className="text-muted-foreground hover:text-foreground p-1.5 rounded-md hover:bg-secondary cursor-pointer transition-colors"
                  title="Collapse sidebar (⌘B)"
                >
                  <PanelLeftClose className="h-4 w-4" />
                </button>
              )}
            </>
          )}
        </div>

        {/* Active Project / Workspace Selector */}
        {currentProject && (
          <div className="mb-3 shrink-0">
            {collapsed ? (
              /* Collapsed Active Project */
              <div className="relative group flex justify-center">
                <Link
                  to={`/projects/${currentProject._id}`}
                  className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border/80 bg-card hover:bg-secondary hover:border-foreground/20 transition-all text-xs font-bold font-mono text-foreground shadow-2xs"
                >
                  {currentProject.name[0]?.toUpperCase()}
                  <span
                    className={cn(
                      "absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border-2 border-sidebar",
                      isAnalyzing
                        ? "bg-amber-400 animate-pulse"
                        : "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.7)]"
                    )}
                  />
                </Link>
                {/* Floating Tooltip */}
                <div className="pointer-events-none absolute left-full ml-2.5 z-50 hidden rounded-md border border-border bg-popover px-2.5 py-1 text-xs font-medium text-popover-foreground shadow-md transition-opacity group-hover:flex items-center gap-1.5 whitespace-nowrap">
                  <span className="font-semibold">{currentProject.name}</span>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    ({isAnalyzing ? "Analyzing AST..." : "Ready"})
                  </span>
                </div>
              </div>
            ) : (
              /* Expanded Active Project Card */
              <div className="group relative flex items-center justify-between gap-2 rounded-lg border border-border/70 bg-secondary/35 p-2 hover:bg-secondary/65 hover:border-border transition-all">
                <Link
                  to={`/projects/${currentProject._id}`}
                  onClick={() => isMobile && setSidebarOpen(false)}
                  className="flex items-center gap-2.5 min-w-0 flex-1"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-border bg-card text-[11px] font-mono font-bold text-foreground shadow-2xs">
                    {currentProject.name[0]?.toUpperCase()}
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className="truncate text-xs font-semibold text-foreground leading-snug">
                      {currentProject.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-1.5">
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full shrink-0",
                          isAnalyzing
                            ? "bg-amber-400 animate-pulse"
                            : "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.7)]"
                        )}
                      />
                      <span className="truncate">{isAnalyzing ? "Analyzing AST..." : "Ready"}</span>
                    </span>
                  </div>
                </Link>
                {isOwner && (
                  <button
                    type="button"
                    onClick={() => setShowProjectSettings(true)}
                    className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-card cursor-pointer transition-colors shrink-0"
                    title="Workspace Settings"
                  >
                    <Settings className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Main Navigation */}
        <nav className={cn("flex flex-1 flex-col", collapsed ? "overflow-visible" : "overflow-y-auto pr-0.5")}>
          <ul className="flex flex-1 flex-col gap-y-4">
            {/* Workspace Links */}
            <li>
              {!collapsed ? (
                <div className="mb-1.5 px-1.5">
                  <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground/75">
                    Workspace
                  </span>
                </div>
              ) : (
                <div className="my-1.5 border-t border-sidebar-border/50" />
              )}

              <ul className="space-y-1">
                {navigation.map((item) => {
                  const active = location.pathname === item.href;
                  return (
                    <li key={item.name} className="relative group">
                      <Link
                        to={item.href}
                        onClick={() => isMobile && setSidebarOpen(false)}
                        className={cn(
                          "relative flex items-center rounded-lg text-xs font-medium transition-all duration-150",
                          collapsed
                            ? "h-9 w-9 mx-auto justify-center"
                            : "gap-x-2.5 px-2.5 py-2",
                          active
                            ? "bg-primary/10 text-primary font-semibold dark:bg-primary/15 dark:text-foreground shadow-2xs border border-primary/15"
                            : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
                        )}
                      >
                        {/* Subtle Active Accent Bar */}
                        {active && (
                          <span
                            className={cn(
                              "absolute rounded-r-full bg-primary",
                              collapsed
                                ? "left-0 top-2 bottom-2 w-0.5"
                                : "left-0 top-1.5 bottom-1.5 w-1"
                            )}
                          />
                        )}
                        <item.icon
                          className={cn(
                            "h-4 w-4 shrink-0 transition-colors",
                            active ? "text-primary dark:text-foreground" : "text-muted-foreground group-hover:text-foreground"
                          )}
                          aria-hidden="true"
                        />
                        {!collapsed && <span className="truncate">{item.name}</span>}

                        {/* Collapsed Tooltip */}
                        {collapsed && (
                          <div className="pointer-events-none absolute left-full ml-2.5 z-50 hidden rounded-md border border-border bg-popover px-2.5 py-1 text-xs font-medium text-popover-foreground shadow-md transition-opacity group-hover:flex items-center whitespace-nowrap">
                            {item.name}
                          </div>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </li>

            {/* Repositories Section */}
            {collapsed ? (
              /* Collapsed Repositories shortcut button */
              <li className="pt-1">
                <div className="my-1.5 border-t border-sidebar-border/50" />
                <div className="relative group flex justify-center">
                  <button
                    type="button"
                    onClick={toggleSidebar}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/70 transition-colors cursor-pointer"
                  >
                    <FolderGit2 className="h-4 w-4" />
                  </button>
                  <div className="pointer-events-none absolute left-full ml-2.5 z-50 hidden rounded-md border border-border bg-popover px-2.5 py-1 text-xs font-medium text-popover-foreground shadow-md transition-opacity group-hover:flex items-center gap-1.5 whitespace-nowrap">
                    <span>Repositories</span>
                    <span className="text-[10px] font-mono px-1.5 rounded bg-muted text-muted-foreground">
                      {projects?.length || 0}
                    </span>
                  </div>
                </div>
              </li>
            ) : (
              /* Expanded Repositories List */
              <li>
                <div className="flex items-center justify-between mb-1.5 px-1.5">
                  <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground/75">
                    Repositories
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-secondary text-muted-foreground border border-border/50 font-medium">
                    {projects?.length || 0}
                  </span>
                </div>

                <ul className="space-y-0.5 max-h-36 overflow-y-auto pr-0.5">
                  {isLoading &&
                    [1, 2].map((i) => (
                      <Skeleton key={i} className="h-7 bg-sidebar-accent/50 my-1 rounded-md" />
                    ))}
                  {projects?.map((project) => {
                    const isSelected = currentProject?._id === project._id;
                    return (
                      <li key={project._id}>
                        <Link
                          to={`/projects/${project._id}`}
                          onClick={() => isMobile && setSidebarOpen(false)}
                          className={cn(
                            "flex items-center justify-between rounded-md px-2 py-1.5 text-xs transition-colors",
                            isSelected
                              ? "bg-secondary text-foreground font-semibold border border-border/70"
                              : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                          )}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-border bg-card text-[9px] font-mono font-semibold">
                              {project.name[0]?.toUpperCase()}
                            </span>
                            <span className="truncate">{project.name}</span>
                          </div>
                          {isSelected && (
                            <span className="h-1.5 w-1.5 rounded-full bg-primary/70 shrink-0 ml-1.5" />
                          )}
                        </Link>
                      </li>
                    );
                  })}
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
                    type="button"
                    onClick={() => setShowCreateProject(true)}
                    className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-border/60 bg-card/40 px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:border-foreground/30 hover:text-foreground hover:bg-secondary cursor-pointer shadow-2xs"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Connect Repository</span>
                  </button>
                )}
              </li>
            )}

            {/* User Footer Profile */}
            <li className="mt-auto pt-3">
              {collapsed ? (
                /* Collapsed User Footer: Clean, centered, glitch-free with instant tooltips */
                <div className="flex flex-col items-center gap-2 pt-2 border-t border-sidebar-border/60">
                  {/* Avatar */}
                  <div className="relative group flex justify-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary border border-border text-[11px] font-mono font-bold text-foreground shadow-2xs cursor-default">
                      {user?.name?.[0]?.toUpperCase() || <User className="h-3.5 w-3.5" />}
                    </div>
                    <div className="pointer-events-none absolute left-full ml-2.5 z-50 hidden rounded-md border border-border bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-md transition-opacity group-hover:flex flex-col whitespace-nowrap">
                      <span className="font-semibold text-foreground">{user?.name}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">{user?.email}</span>
                    </div>
                  </div>

                  {/* Sign Out Action Button */}
                  <div className="relative group flex justify-center">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                      title="Sign out"
                    >
                      <LogOut className="h-4 w-4" />
                    </button>
                    <div className="pointer-events-none absolute left-full ml-2.5 z-50 hidden rounded-md border border-border bg-popover px-2 py-1 text-xs font-medium text-destructive shadow-md transition-opacity group-hover:flex items-center whitespace-nowrap">
                      Sign out
                    </div>
                  </div>
                </div>
              ) : (
                /* Expanded User Footer */
                <div className="rounded-xl border border-border/70 bg-card/60 p-2 flex items-center justify-between gap-2 shadow-2xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-7 w-7 rounded-lg bg-secondary border border-border flex items-center justify-center text-[11px] font-mono font-bold text-foreground shrink-0 shadow-2xs">
                      {user?.name?.[0]?.toUpperCase() || <User className="h-3.5 w-3.5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate leading-tight">
                        {user?.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate font-mono mt-0.5" title={user?.email}>
                        {user?.email}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer shrink-0"
                    title="Sign out"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              )}
            </li>
          </ul>
        </nav>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex selection:bg-foreground/15">
      {/* Mobile Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-xs transition-opacity"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-64 animate-fade-up bg-sidebar shadow-2xl">
            <div className="absolute right-0 top-0 -mr-10 pt-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-md text-foreground cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {renderSidebarContent(true)}
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex lg:flex-col shrink-0 transition-[width] duration-200 ease-out",
          sidebarCollapsed ? "w-16" : "w-64"
        )}
      >
        <div
          className="fixed inset-y-0 z-30 flex flex-col transition-[width] duration-200 ease-out"
          style={{ width: sidebarCollapsed ? "4rem" : "16rem" }}
        >
          {renderSidebarContent(false)}
        </div>
      </aside>

      {/* Main Workspace Viewport */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-20 flex h-12 shrink-0 items-center justify-between border-b border-border bg-background/90 px-4 sm:px-6 backdrop-blur-md">
          {/* Left: Mobile trigger & Breadcrumbs */}
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Mobile Hamburger */}
            <button
              type="button"
              className="p-1.5 text-muted-foreground hover:text-foreground lg:hidden cursor-pointer rounded-md hover:bg-secondary"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu className="h-4 w-4" />
            </button>

            {/* Desktop Quick Toggle in Topbar */}
            <button
              type="button"
              onClick={toggleSidebar}
              className="hidden lg:flex text-muted-foreground hover:text-foreground p-1.5 rounded-md hover:bg-secondary cursor-pointer transition-colors"
              title={sidebarCollapsed ? "Expand sidebar (⌘B)" : "Collapse sidebar (⌘B)"}
            >
              {sidebarCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </button>

            {/* Breadcrumbs */}
            <div className="flex items-center gap-1.5 text-xs min-w-0 font-medium pl-1">
              <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors truncate">
                Dionysus
              </Link>
              {currentProject && (
                <>
                  <ChevronRight className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                  <Link
                    to={`/projects/${currentProject._id}`}
                    className="text-muted-foreground hover:text-foreground transition-colors truncate"
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

          {/* Right: Quick Search, Repo Link, Theme Toggle */}
          <div className="flex items-center gap-2">
            {/* Command Palette Trigger */}
            <button
              type="button"
              onClick={() => setShowCommandPalette(true)}
              className="flex items-center gap-2 px-2.5 py-1 rounded-lg border border-border/80 bg-secondary/40 text-xs text-muted-foreground hover:text-foreground hover:border-foreground/20 hover:bg-secondary/70 transition-all cursor-pointer shadow-2xs"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Search repo, docs, nodes</span>
              <kbd className="hidden sm:inline-flex text-[10px] font-mono bg-muted/60 px-1 py-0.2 rounded border border-border/40">
                ⌘K
              </kbd>
            </button>

            {/* GitHub Repo Link Badge */}
            {currentProject?.githubUrl && (
              <a
                href={currentProject.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border/80 bg-card text-xs text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors font-mono shadow-2xs"
              >
                <GitBranch className="h-3 w-3 text-foreground" />
                <span className="truncate max-w-[130px]">
                  {currentProject.githubUrl.replace(/^https?:\/\/github\.com\//, "")}
                </span>
                <ExternalLink className="h-2.5 w-2.5 opacity-50" />
              </a>
            )}

            <ThemeToggle className="h-8 w-8" />
          </div>
        </header>

        {/* Main Workspace Viewport */}
        <main
          className={cn(
            "flex-1 w-full min-w-0",
            isVisualisePage
              ? "p-0 max-w-none h-[calc(100vh-3rem)] overflow-hidden flex flex-col"
              : "p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto"
          )}
        >
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

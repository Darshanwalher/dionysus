import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import ThemeToggle from "@/components/theme/ThemeToggle";
import Atmosphere from "@/components/theme/Atmosphere";
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
  ChevronsUpDown,
  ChevronRight,
} from "lucide-react";

export default function AppShell({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.auth);
  const { projects, currentProject, isLoading } = useSelector(
    (state) => state.project
  );

  const navigation = currentProject
    ? [
        { name: "Home", href: `/projects/${currentProject._id}`, icon: Home },
        { name: "Documentation", href: `/projects/${currentProject._id}/documentation`, icon: BookText },
        { name: "Q & A", href: `/projects/${currentProject._id}/qna`, icon: FileQuestion },
        { name: "Meetings", href: `/projects/${currentProject._id}/meetings`, icon: Presentation },
        { name: "File Visualisation", href: `/projects/${currentProject._id}/visualise`, icon: FolderTree },
      ]
    : [];

  const currentPageName = navigation.find((n) => n.href === location.pathname)?.name ?? null;

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
    <div className="flex grow flex-col gap-y-4 overflow-y-auto bg-sidebar/95 px-4 pb-4 backdrop-blur-md">
      {/* Brand */}
      <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-sidebar-border/60 px-1">
        <div className="icon-tile h-8 w-8 rounded-lg">
          <Zap className="h-3.5 w-3.5" />
        </div>
        <span className="text-base font-semibold tracking-tight text-foreground">
          Dionysus
        </span>
      </div>

      {/* Project Switcher Pill */}
      {currentProject && (
        <div className="mx-0.5 flex items-center gap-2 rounded-lg border border-border/60 bg-sidebar-accent/50 px-3 py-2 hover:bg-sidebar-accent transition-colors duration-150">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-primary/30 bg-primary/10 text-[10px] font-bold text-primary">
            {currentProject.name[0]?.toUpperCase()}
          </span>
          <span className="flex-1 truncate text-xs font-semibold text-foreground">
            {currentProject.name}
          </span>
          <ChevronsUpDown className="h-3 w-3 text-muted-foreground shrink-0" />
        </div>
      )}

      <nav className="flex flex-1 flex-col">
        <ul className="flex flex-1 flex-col gap-y-6">
          {/* Main Navigation */}
          <li>
            <ul className="space-y-0.5">
              {navigation.map((item) => {
                const active = location.pathname === item.href;
                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "group relative flex gap-x-3 rounded-lg px-3 py-2.5 text-sm font-medium leading-6 transition-all duration-200",
                        active
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"
                      )}
                    >
                      {/* Animated indicator */}
                      <span
                        className={cn(
                          "absolute left-0 top-1/2 -translate-y-1/2 rounded-full bg-primary transition-all duration-300",
                          active
                            ? "opacity-100 h-5 w-0.5"
                            : "opacity-0 h-0 w-0.5 group-hover:opacity-30 group-hover:h-3"
                        )}
                      />
                      <item.icon className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </li>

          {/* Project List */}
          <li>
            <div className="flex items-center gap-2 mb-2 px-1">
              <div className="h-px flex-1 bg-gradient-to-r from-border/0 via-border to-border/0" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">
                Projects
              </span>
              <div className="h-px flex-1 bg-gradient-to-r from-border/0 via-border to-border/0" />
            </div>

            <ul className="space-y-0.5">
              {isLoading &&
                [1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-9 bg-sidebar-accent/60 mx-0.5 my-1" />
                ))}
              {projects?.map((project) => (
                <li key={project._id}>
                  <Link
                    to={`/projects/${project._id}`}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      currentProject?._id === project._id
                        ? "bg-primary/10 text-primary"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground",
                      "group flex gap-x-2.5 rounded-lg px-3 py-2 text-sm font-medium leading-6 transition-all duration-200"
                    )}
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-primary/20 bg-primary/8 text-[10px] font-semibold text-primary group-hover:border-primary/40">
                      {project.name[0]?.toUpperCase()}
                    </span>
                    <span className="truncate">{project.name}</span>
                  </Link>
                </li>
              ))}
            </ul>

            {showCreateProject ? (
              <form
                onSubmit={handleCreateProject}
                className="mt-2 flex animate-fade-up gap-2 px-0.5"
              >
                <Input
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Project name…"
                  className="h-8 text-xs"
                  autoFocus
                />
                <Button type="submit" size="sm" className="h-8 shrink-0">
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </form>
            ) : (
              <button
                onClick={() => setShowCreateProject(true)}
                className="mt-2 flex w-full items-center gap-2 rounded-lg border border-dashed border-sidebar-border px-3 py-2 text-sm text-muted-foreground/70 transition-all duration-200 hover:border-primary/40 hover:text-foreground hover:bg-sidebar-accent/40"
              >
                <Plus className="h-3.5 w-3.5" />
                New Project
              </button>
            )}
          </li>

          {/* User Footer */}
          <li className="mt-auto">
            <div className="glass rounded-xl p-3 flex items-center gap-2.5">
              <div className="relative h-7 w-7 shrink-0">
                <div className="h-7 w-7 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                  {user?.name?.[0]?.toUpperCase() || <User className="h-3.5 w-3.5" />}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary/70 border-2 border-sidebar" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{user?.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                title="Logout"
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
    <div className="relative min-h-screen bg-background">
      <Atmosphere intensity="subtle" className="fixed inset-0" />

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-72 animate-fade-up">
            <div className="absolute right-0 top-0 -mr-12 pt-4">
              <button
                onClick={() => setSidebarOpen(false)}
                className="ml-1 flex h-10 w-10 items-center justify-center rounded-full text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden border-r border-sidebar-border/70 lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        {sidebarContent}
      </div>

      {/* Main Container */}
      <div className="relative lg:pl-64">
        {/* Topbar */}
        <div className="sticky top-0 z-40 flex h-12 shrink-0 items-center gap-x-4 border-b border-border/60 bg-background/70 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-muted-foreground transition-colors hover:text-foreground lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="h-4 w-px bg-border/60 lg:hidden" />

          {/* Breadcrumb */}
          <div className="flex flex-1 items-center gap-1.5 text-xs">
            {currentProject && (
              <>
                <span className="text-muted-foreground hidden sm:inline">Projects</span>
                <ChevronRight className="h-3 w-3 text-muted-foreground/50 hidden sm:inline" />
                <span className="font-medium text-foreground">{currentProject.name}</span>
                {currentPageName && (
                  <>
                    <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
                    <span className="font-medium text-primary">{currentPageName}</span>
                  </>
                )}
              </>
            )}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <ThemeToggle className="h-8 w-8 text-muted-foreground hover:text-foreground" />
          </div>
        </div>

        <main className="py-8">
          <div className="px-4 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}

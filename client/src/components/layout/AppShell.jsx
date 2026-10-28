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
        {
          name: "Home",
          href: `/projects/${currentProject._id}`,
          icon: Home,
        },
        {
          name: "Documentation",
          href: `/projects/${currentProject._id}/documentation`,
          icon: BookText,
        },
        {
          name: "Q & A",
          href: `/projects/${currentProject._id}/qna`,
          icon: FileQuestion,
        },
        {
          name: "Meetings",
          href: `/projects/${currentProject._id}/meetings`,
          icon: Presentation,
        },
        {
          name: "File Visualisation",
          href: `/projects/${currentProject._id}/visualise`,
          icon: FolderTree,
        },
      ]
    : [];

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
    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-sidebar/90 px-5 pb-4 backdrop-blur-md">
      <div className="flex h-16 shrink-0 items-center gap-2.5">
        <div className="icon-tile h-9 w-9">
          <Zap className="h-4 w-4" />
        </div>
        <span className="text-lg font-semibold tracking-tight gradient-text">
          Dionysus
        </span>
      </div>

      <nav className="flex flex-1 flex-col">
        <ul className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul className="space-y-1">
              {navigation.map((item) => {
                const active = location.pathname === item.href;
                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "group relative flex gap-x-3 rounded-lg p-2.5 text-sm font-medium leading-6 transition-all duration-200",
                        active
                          ? "bg-sidebar-accent text-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"
                      )}
                    >
                      <span
                        className={cn(
                          "absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-gold transition-opacity",
                          active ? "opacity-100" : "opacity-0 group-hover:opacity-40"
                        )}
                      />
                      <item.icon
                        className="h-5 w-5 shrink-0"
                        aria-hidden="true"
                      />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </li>

          <li>
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold/80">
              Your Projects
            </div>
            <ul className="mt-2 space-y-1">
              {isLoading &&
                [1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-9 bg-sidebar-accent" />
                ))}
              {projects?.map((project) => (
                <li key={project._id}>
                  <Link
                    to={`/projects/${project._id}`}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      currentProject?._id === project._id
                        ? "bg-sidebar-accent text-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground",
                      "group flex gap-x-3 rounded-lg p-2.5 text-sm font-medium leading-6 transition-all duration-200"
                    )}
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-gold/30 bg-sidebar text-xs font-medium text-gold group-hover:border-gold/60">
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
                className="mt-2 flex animate-fade-up gap-2"
              >
                <Input
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Project name..."
                  className="h-9 text-sm"
                  autoFocus
                />
                <Button type="submit" size="sm" className="shrink-0">
                  <Plus className="h-4 w-4" />
                </Button>
              </form>
            ) : (
              <button
                onClick={() => setShowCreateProject(true)}
                className="mt-2 flex w-full items-center gap-2 rounded-lg border border-dashed border-sidebar-border p-2.5 text-sm text-muted-foreground transition-all duration-200 hover:border-gold/50 hover:text-foreground"
              >
                <Plus className="h-4 w-4" />
                New Project
              </button>
            )}
          </li>

          <li className="mt-auto">
            <div className="gold-line mb-3" />
            <div className="flex items-center gap-3 rounded-lg p-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-gold/25 bg-primary/15 text-primary">
                <User className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {user?.name}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {user?.email}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="text-muted-foreground transition-colors hover:text-destructive"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
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

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-72 animate-in slide-in-from-left duration-300">
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

      <div className="hidden border-r border-sidebar-border lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        {sidebarContent}
      </div>

      <div className="relative lg:pl-72">
        <div className="sticky top-0 z-40 flex h-12 shrink-0 items-center gap-x-4 border-b border-border/70 bg-background/65 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-muted-foreground transition-colors hover:text-foreground lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="h-5 w-px bg-border lg:hidden" />

          <div className="flex flex-1 items-center gap-x-4 lg:gap-x-6">
            {currentProject && (
              <span className="inline-flex items-center rounded-full border border-gold/25 bg-card/60 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                {currentProject.name}
              </span>
            )}
          </div>

          <ThemeToggle className="h-9 w-9 text-muted-foreground hover:text-foreground" />
        </div>

        <main className="py-8">
          <div className="px-4 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}

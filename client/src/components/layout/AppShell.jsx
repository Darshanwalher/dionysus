import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-sidebar px-6 pb-4">
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center gap-2">
        <Zap className="h-7 w-7 text-primary" />
        <span className="text-xl font-bold gradient-text">Dionysus</span>
      </div>

      <nav className="flex flex-1 flex-col">
        <ul className="flex flex-1 flex-col gap-y-7">
          {/* Main Navigation */}
          <li>
            <ul className="-mx-2 space-y-1">
              {navigation.map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      location.pathname === item.href
                        ? "bg-sidebar-accent text-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground",
                      "group flex gap-x-3 rounded-lg p-2.5 text-sm font-medium leading-6 transition-all duration-200"
                    )}
                  >
                    <item.icon
                      className="h-5 w-5 shrink-0"
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </li>

          {/* Projects List */}
          <li>
            <div className="text-xs font-semibold leading-6 text-muted-foreground uppercase tracking-wider">
              Your Projects
            </div>
            <ul className="-mx-2 mt-2 space-y-1">
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
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-sidebar-border bg-sidebar text-xs font-medium text-sidebar-foreground group-hover:text-foreground">
                      {project.name[0]?.toUpperCase()}
                    </span>
                    <span className="truncate">{project.name}</span>
                  </Link>
                </li>
              ))}
            </ul>

            {/* Create Project */}
            {showCreateProject ? (
              <form
                onSubmit={handleCreateProject}
                className="mt-2 flex gap-2"
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
                className="mt-2 flex w-full items-center gap-2 rounded-lg border border-dashed border-sidebar-border p-2.5 text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all duration-200"
              >
                <Plus className="h-4 w-4" />
                New Project
              </button>
            )}
          </li>

          {/* User & Logout */}
          <li className="mt-auto">
            <div className="flex items-center gap-3 rounded-lg p-2 -mx-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary">
                <User className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="text-muted-foreground hover:text-destructive transition-colors"
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
    <div className="min-h-screen">
      {/* Mobile sidebar overlay */}
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

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col border-r border-sidebar-border">
        {sidebarContent}
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-x-4 border-b border-border bg-background/80 backdrop-blur-md px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-muted-foreground lg:hidden hover:text-foreground transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="h-5 w-px bg-border lg:hidden" />

          <div className="flex flex-1 items-center gap-x-4 lg:gap-x-6">
            {currentProject && (
              <h1 className="text-sm font-medium text-muted-foreground">
                {currentProject.name}
              </h1>
            )}
          </div>
        </div>

        {/* Page content */}
        <main className="py-8">
          <div className="px-4 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}

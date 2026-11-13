import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router-dom";
import gsap from "gsap";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import ThemeToggle from "@/components/theme/ThemeToggle";
import CommandPalette from "@/components/layout/CommandPalette";
import SmoothScroll from "@/components/motion/SmoothScroll";
import { logout } from "@/store/slices/authSlice";
import { createProject } from "@/store/slices/projectSlice";
import {
  BookText,
  BookOpen,
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

/* ────────────────────────────────────────────────────────────
   Motion is deliberately small and purposeful:
   1. nav indicator glides between items
   2. page content eases in on route change
   3. a thin progress line runs under the top bar while analysing
   4. the mobile drawer slides in and out
   5. sidebar sections and nav items stagger in on load / project change
   6. the breadcrumb page name swaps with a short slide
   7. the "connect repository" form unfolds
   8. the ⌘K badge presses when you hit the shortcut
   9. the project card flashes green when analysis finishes
   10. the top bar gains a soft shadow once you scroll
   Everything is skipped when the user prefers reduced motion.
   ──────────────────────────────────────────────────────────── */
const prefersReduced = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Hover label used by the collapsed sidebar. */
function Tip({ children }) {
  return (
    <span className="pointer-events-none absolute left-full z-50 ml-3 flex -translate-x-1 items-center gap-1.5 whitespace-nowrap rounded-md border border-border bg-popover px-2.5 py-1 text-xs font-medium text-popover-foreground opacity-0 shadow-md transition-all duration-150 group-hover:translate-x-0 group-hover:opacity-100">
      {children}
    </span>
  );
}

/** Green when ready, coral with a soft ping while analysing. */
function StatusDot({ analyzing, className }) {
  return (
    <span className={cn("relative flex h-2 w-2 shrink-0", className)}>
      {analyzing && (
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-highlight/60" />
      )}
      <span
        className={cn(
          "relative inline-flex h-2 w-2 rounded-full",
          analyzing ? "bg-highlight" : "bg-accent-emerald"
        )}
      />
    </span>
  );
}

/** Fades a block in from the left when it mounts. */
function Reveal({ children, className, delay = 0 }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    if (!ref.current || prefersReduced()) return;
    const ctx = gsap.context(() => {
      gsap.from(ref.current, {
        opacity: 0, x: -14, duration: 0.55, delay, ease: "power3.out", clearProps: "all",
      });
    });
    return () => ctx.revert();
  }, []);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

/** Text that slides up into place when its key changes. */
function SwapIn({ children, className }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    if (!ref.current || prefersReduced()) return;
    const ctx = gsap.context(() => {
      gsap.from(ref.current, { opacity: 0, y: 8, duration: 0.35, ease: "power2.out", clearProps: "all" });
    });
    return () => ctx.revert();
  }, []);
  return (
    <span ref={ref} className={className}>
      {children}
    </span>
  );
}

/** Unfolds its content to full height when it mounts. */
function Expand({ children, className }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    if (!ref.current || prefersReduced()) return;
    gsap.fromTo(
      ref.current,
      { height: 0, opacity: 0 },
      { height: "auto", opacity: 1, duration: 0.3, ease: "power2.out", clearProps: "height,opacity" }
    );
  }, []);
  return (
    <div ref={ref} className={cn("overflow-hidden", className)}>
      {children}
    </div>
  );
}

/** Thin sweeping line under the top bar while the repo is being analysed. */
function AnalyzeBar({ active }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    if (!active || !ref.current || prefersReduced()) return;
    const t = gsap.fromTo(
      ref.current,
      { xPercent: -100 },
      { xPercent: 300, duration: 1.4, repeat: -1, ease: "power1.inOut" }
    );
    return () => t.kill();
  }, [active]);
  if (!active) return null;
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] overflow-hidden">
      <div ref={ref} className="h-full w-1/3 bg-highlight" />
    </div>
  );
}

/** Nav list with one indicator that glides to the active item. */
function SlidingNav({ items, collapsed, pathname, onNavigate }) {
  const wrap = useRef(null);
  const ind = useRef(null);
  const placed = useRef(false);

  const place = useCallback((instant) => {
    const w = wrap.current;
    const i = ind.current;
    if (!w || !i) return;
    const a = w.querySelector('[data-active="true"]');
    if (!a) {
      gsap.set(i, { opacity: 0 });
      placed.current = false;
      return;
    }
    const vars = {
      x: a.offsetLeft,
      y: a.offsetTop,
      width: a.offsetWidth,
      height: a.offsetHeight,
      opacity: 1,
    };
    gsap.killTweensOf(i);
    if (instant || !placed.current || prefersReduced()) gsap.set(i, vars);
    else gsap.to(i, { ...vars, duration: 0.4, ease: "power3.out" });
    placed.current = true;
  }, []);

  useLayoutEffect(() => {
    place(false);
  }, [pathname, collapsed, items.length, place]);

  // Items stagger in when a project's navigation first appears
  const firstHref = items[0]?.href;
  useLayoutEffect(() => {
    if (!firstHref || !wrap.current || prefersReduced()) return;
    const ctx = gsap.context(() => {
      gsap.from(wrap.current.querySelectorAll("li"), {
        opacity: 0, x: -12, duration: 0.45, stagger: 0.05, ease: "power3.out", clearProps: "opacity,transform",
      });
    });
    return () => ctx.revert();
  }, [firstHref]);

  // Re-measure instantly while the sidebar width animates.
  useEffect(() => {
    if (!wrap.current || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => place(true));
    ro.observe(wrap.current);
    return () => ro.disconnect();
  }, [place]);

  return (
    <div ref={wrap} className="relative">
      <span
        ref={ind}
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 rounded-lg border border-border bg-surface-elevated shadow-[0_1px_2px_rgba(16,33,31,0.06)]"
        style={{ opacity: 0 }}
      >
        <span className="absolute bottom-2 left-0 top-2 w-[3px] rounded-r-full bg-highlight" />
      </span>
      <ul className="space-y-0.5">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <li key={item.name} className="group">
              <Link
                to={item.href}
                data-active={active}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative z-10 flex items-center rounded-lg text-[13px] font-medium transition-colors duration-150",
                  collapsed ? "mx-auto h-9 w-9 justify-center" : "gap-x-2.5 px-3 py-2",
                  active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-transform duration-200",
                    !collapsed && "group-hover:translate-x-0.5",
                    active ? "text-primary" : ""
                  )}
                  aria-hidden="true"
                />
                {!collapsed && <span className="truncate">{item.name}</span>}
                {collapsed && <Tip>{item.name}</Tip>}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

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

  const mainRef = useRef(null);
  const firstNav = useRef(true);
  const drawerRef = useRef(null);
  const overlayRef = useRef(null);
  const kbdRef = useRef(null);
  const wasAnalyzing = useRef(false);
  const [scrolled, setScrolled] = useState(false);

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
        { name: "Repo DeepWiki", href: `/projects/${currentProject._id}/wiki`, icon: BookOpen },
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

  // ⌘K opens the command palette, ⌘B toggles the sidebar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setShowCommandPalette((prev) => !prev);
        if (kbdRef.current && !prefersReduced()) {
          gsap.fromTo(
            kbdRef.current,
            { scale: 0.8, backgroundColor: "#FF6845", color: "#10211F" },
            { scale: 1, duration: 0.45, ease: "back.out(3)", clearProps: "all" }
          );
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Project card flashes green when analysis finishes
  useEffect(() => {
    if (wasAnalyzing.current && !isAnalyzing && !prefersReduced()) {
      const cards = document.querySelectorAll("[data-project-card]");
      if (cards.length) {
        gsap.fromTo(
          cards,
          { boxShadow: "0 0 0 4px rgba(31,138,91,0.35)" },
          { boxShadow: "0 0 0 0px rgba(31,138,91,0)", duration: 1.1, ease: "power2.out", clearProps: "boxShadow" }
        );
      }
    }
    wasAnalyzing.current = isAnalyzing;
  }, [isAnalyzing]);

  // Top bar gets a soft shadow after scrolling
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Page content eases in on route change
  useLayoutEffect(() => {
    if (firstNav.current) {
      firstNav.current = false;
      return;
    }
    if (!mainRef.current || prefersReduced()) return;
    gsap.fromTo(
      mainRef.current,
      { opacity: 0, y: 8 },
      { opacity: 1, y: 0, duration: 0.35, ease: "power2.out", clearProps: "all" }
    );
  }, [location.pathname]);

  // Mobile drawer slides in
  useLayoutEffect(() => {
    if (!sidebarOpen || prefersReduced()) return;
    gsap.fromTo(drawerRef.current, { xPercent: -100 }, { xPercent: 0, duration: 0.35, ease: "power3.out" });
    gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3 });
  }, [sidebarOpen]);

  const closeDrawer = () => {
    if (prefersReduced() || !drawerRef.current) {
      setSidebarOpen(false);
      return;
    }
    gsap.to(overlayRef.current, { opacity: 0, duration: 0.2 });
    gsap.to(drawerRef.current, {
      xPercent: -100,
      duration: 0.25,
      ease: "power2.in",
      onComplete: () => setSidebarOpen(false),
    });
  };

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

  const renderSidebarContent = (isMobile = false) => {
    const collapsed = isMobile ? false : sidebarCollapsed;
    const afterNav = isMobile ? closeDrawer : undefined;

    return (
      <div
        data-lenis-prevent
        className={cn(
          "flex h-full grow select-none flex-col border-r border-sidebar-border bg-sidebar",
          collapsed ? "overflow-visible px-2 py-3" : "overflow-y-auto px-3 py-3"
        )}
      >
        {/* Brand */}
        <Reveal className="shrink-0">
        <div
          className={cn(
            "mb-4 flex h-10 shrink-0 items-center",
            collapsed ? "justify-center" : "justify-between pl-1"
          )}
        >
          {collapsed ? (
            <div className="group relative flex items-center justify-center">
              <button
                type="button"
                onClick={toggleSidebar}
                aria-label="Expand sidebar"
                className="relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl bg-primary shadow-sm transition-colors hover:bg-primary/90"
              >
                <Zap className="h-4 w-4 text-primary-foreground transition-all duration-200 group-hover:scale-0 group-hover:opacity-0" />
                <PanelLeft className="absolute h-4 w-4 scale-0 text-primary-foreground opacity-0 transition-all duration-200 group-hover:scale-100 group-hover:opacity-100" />
              </button>
              <Tip>
                Expand sidebar
                <kbd>⌘B</kbd>
              </Tip>
            </div>
          ) : (
            <>
              <Link to="/" onClick={afterNav} className="group flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary shadow-sm transition-transform duration-300 group-hover:rotate-12">
                  <Zap className="h-4 w-4 text-primary-foreground" />
                </span>
                <span className="text-[15px] font-extrabold tracking-tight text-foreground">Dionysus</span>
                <span className="text-[11px] text-text-muted">v2.0</span>
              </Link>
              {!isMobile && (
                <button
                  type="button"
                  onClick={toggleSidebar}
                  className="cursor-pointer rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  title="Collapse sidebar (⌘B)"
                  aria-label="Collapse sidebar"
                >
                  <PanelLeftClose className="h-4 w-4" />
                </button>
              )}
            </>
          )}
        </div>
        </Reveal>

        {/* Active project */}
        {currentProject && (
          <Reveal className="mb-4 shrink-0" delay={0.08}>
            {collapsed ? (
              <div className="group relative flex justify-center">
                <Link
                  to={`/projects/${currentProject._id}`}
                  data-project-card
                  className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-xs font-bold text-foreground transition-colors hover:bg-secondary"
                >
                  {currentProject.name[0]?.toUpperCase()}
                  <StatusDot analyzing={isAnalyzing} className="absolute -bottom-0.5 -right-0.5 rounded-full ring-2 ring-sidebar" />
                </Link>
                <Tip>
                  <span className="font-semibold">{currentProject.name}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {isAnalyzing ? "Analyzing…" : "Ready"}
                  </span>
                </Tip>
              </div>
            ) : (
              <div data-project-card className="flex items-center gap-2 rounded-xl border border-border bg-card p-2 shadow-[0_1px_2px_rgba(16,33,31,0.04)]">
                <Link
                  to={`/projects/${currentProject._id}`}
                  onClick={afterNav}
                  className="flex min-w-0 flex-1 items-center gap-2.5"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                    {currentProject.name[0]?.toUpperCase()}
                  </span>
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-[13px] font-semibold leading-tight text-foreground">
                      {currentProject.name}
                    </span>
                    <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <StatusDot analyzing={isAnalyzing} />
                      {isAnalyzing ? "Analyzing…" : "Ready"}
                    </span>
                  </div>
                </Link>
                {isOwner && (
                  <button
                    type="button"
                    onClick={() => setShowProjectSettings(true)}
                    className="shrink-0 cursor-pointer rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    title="Workspace settings"
                    aria-label="Workspace settings"
                  >
                    <Settings className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}
          </Reveal>
        )}

        {/* Navigation */}
        <nav className={cn("flex flex-1 flex-col", collapsed ? "overflow-visible" : "overflow-y-auto")}>
          <div className="flex flex-1 flex-col gap-y-5">
            <div>
              {!collapsed ? (
                <p className="mb-1.5 px-3 text-[11px] font-medium text-text-muted">Workspace</p>
              ) : (
                <div className="mb-2 border-t border-sidebar-border" />
              )}
              <SlidingNav
                items={navigation}
                collapsed={collapsed}
                pathname={location.pathname}
                onNavigate={afterNav}
              />
            </div>

            {/* Repositories */}
            <Reveal delay={0.3}>
            {collapsed ? (
              <div>
                <div className="mb-2 border-t border-sidebar-border" />
                <div className="group relative flex justify-center">
                  <button
                    type="button"
                    onClick={toggleSidebar}
                    aria-label="Show repositories"
                    className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  >
                    <FolderGit2 className="h-4 w-4" />
                  </button>
                  <Tip>
                    Repositories
                    <span className="text-[11px] text-muted-foreground">{projects?.length || 0}</span>
                  </Tip>
                </div>
              </div>
            ) : (
              <div>
                <div className="mb-1.5 flex items-center justify-between px-3">
                  <span className="text-[11px] font-medium text-text-muted">Repositories</span>
                  <span className="text-[11px] text-text-muted">{projects?.length || 0}</span>
                </div>

                <ul data-lenis-prevent className="max-h-40 space-y-0.5 overflow-y-auto">
                  {isLoading &&
                    [1, 2].map((i) => <Skeleton key={i} className="my-1 h-8 rounded-lg bg-sidebar-accent/60" />)}
                  {projects?.map((project) => {
                    const isSelected = currentProject?._id === project._id;
                    return (
                      <li key={project._id}>
                        <Link
                          to={`/projects/${project._id}`}
                          onClick={afterNav}
                          className={cn(
                            "flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-[13px] transition-colors",
                            isSelected
                              ? "bg-secondary font-semibold text-foreground"
                              : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                          )}
                        >
                          <FolderGit2 className={cn("h-3.5 w-3.5 shrink-0", isSelected && "text-primary")} />
                          <span className="truncate font-mono text-xs">{project.name}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>

                {showCreateProject ? (
                  <Expand className="-mx-0.5 mt-2 px-0.5 py-0.5">
                  <form onSubmit={handleCreateProject} className="flex gap-1.5">
                    <Input
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      onKeyDown={(e) => e.key === "Escape" && setShowCreateProject(false)}
                      placeholder="Repo name…"
                      className="h-8 rounded-lg text-xs"
                      autoFocus
                    />
                    <Button type="submit" size="xs" className="h-8 shrink-0 px-2.5" aria-label="Create repository">
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </form>
                  </Expand>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowCreateProject(true)}
                    className="group mt-2 flex w-full cursor-pointer items-center gap-2.5 rounded-lg border border-dashed border-border px-3 py-1.5 text-[13px] text-muted-foreground transition-colors hover:border-primary/50 hover:bg-card hover:text-primary"
                  >
                    <Plus className="h-3.5 w-3.5 transition-transform duration-300 group-hover:rotate-90" />
                    Connect repository
                  </button>
                )}
              </div>
            )}
            </Reveal>

            {/* User */}
            <Reveal className="mt-auto pt-2" delay={0.4}>
              {collapsed ? (
                <div className="flex flex-col items-center gap-2 border-t border-sidebar-border pt-3">
                  <div className="group relative flex justify-center">
                    <div className="flex h-8 w-8 cursor-default items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                      {user?.name?.[0]?.toUpperCase() || <User className="h-3.5 w-3.5" />}
                    </div>
                    <Tip>
                      <span className="font-semibold">{user?.name}</span>
                      <span className="text-[11px] text-muted-foreground">{user?.email}</span>
                    </Tip>
                  </div>
                  <div className="group relative flex justify-center">
                    <button
                      type="button"
                      onClick={handleLogout}
                      aria-label="Sign out"
                      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <LogOut className="h-4 w-4" />
                    </button>
                    <Tip>Sign out</Tip>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2 border-t border-sidebar-border pt-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                      {user?.name?.[0]?.toUpperCase() || <User className="h-3.5 w-3.5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold leading-tight text-foreground">{user?.name}</p>
                      <p className="mt-0.5 truncate text-[11px] text-muted-foreground" title={user?.email}>
                        {user?.email}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    title="Sign out"
                    aria-label="Sign out"
                    className="shrink-0 cursor-pointer rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              )}
            </Reveal>
          </div>
        </nav>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground selection:bg-highlight/25">
      <SmoothScroll />
      {/* Mobile drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div ref={overlayRef} className="fixed inset-0 bg-foreground/30 backdrop-blur-[2px]" onClick={closeDrawer} />
          <div ref={drawerRef} className="fixed inset-y-0 left-0 z-50 w-64 bg-sidebar shadow-2xl">
            <button
              type="button"
              onClick={closeDrawer}
              aria-label="Close sidebar"
              className="absolute -right-10 top-3 flex h-8 w-8 cursor-pointer items-center justify-center rounded-md bg-card text-foreground shadow"
            >
              <X className="h-4 w-4" />
            </button>
            {renderSidebarContent(true)}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden shrink-0 transition-[width] duration-200 ease-out lg:flex lg:flex-col",
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

      {/* Workspace */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className={cn(
            "sticky top-0 z-20 flex h-12 shrink-0 items-center justify-between border-b border-border bg-background/95 px-4 transition-shadow duration-300 sm:px-6",
            scrolled && "shadow-[0_8px_24px_-14px_rgba(16,33,31,0.3)]"
          )}>
          <div className="flex min-w-0 items-center gap-2.5">
            <button
              type="button"
              className="cursor-pointer rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground lg:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu className="h-4 w-4" />
            </button>

            <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-[13px] font-medium">
              <Link to="/" className="truncate text-muted-foreground transition-colors hover:text-foreground">
                Dionysus
              </Link>
              {currentProject && (
                <>
                  <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground/50" />
                  <Link
                    to={`/projects/${currentProject._id}`}
                    className="truncate text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {currentProject.name}
                  </Link>
                  {currentPageName && (
                    <>
                      <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground/50" />
                      <SwapIn key={currentPageName} className="truncate font-semibold text-foreground">
                        {currentPageName}
                      </SwapIn>
                    </>
                  )}
                </>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowCommandPalette(true)}
              className="flex h-8 cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-2.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground sm:w-64"
            >
              <Search className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden flex-1 text-left sm:inline">Search repo, docs, nodes</span>
              <kbd ref={kbdRef} className="hidden sm:inline-flex">⌘K</kbd>
            </button>

            {currentProject?.githubUrl && (
              <a
                href={currentProject.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="hidden h-8 items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 font-mono text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground md:flex"
              >
                <GitBranch className="h-3 w-3 text-primary" />
                <span className="max-w-[130px] truncate">
                  {currentProject.githubUrl.replace(/^https?:\/\/github\.com\//, "")}
                </span>
                <ExternalLink className="h-2.5 w-2.5 opacity-50" />
              </a>
            )}

            <ThemeToggle className="h-8 w-8" />
          </div>

          <AnalyzeBar active={isAnalyzing} />
        </header>

        <main
          ref={mainRef}
          className={cn(
            "w-full min-w-0 flex-1",
            isVisualisePage
              ? "flex h-[calc(100vh-3rem)] max-w-none flex-col overflow-hidden p-0"
              : "mx-auto max-w-7xl p-4 sm:p-6 lg:p-8"
          )}
        >
          {children}
        </main>
      </div>

      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onOpenCreateProject={() => setShowCreateProject(true)}
        onOpenSettings={() => setShowProjectSettings(true)}
      />

      <ProjectSettingsModal
        project={currentProject}
        isOpen={showProjectSettings}
        onClose={() => setShowProjectSettings(false)}
      />
    </div>
  );
}
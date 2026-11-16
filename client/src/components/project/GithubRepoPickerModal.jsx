import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { fetchGithubRepos } from "@/store/slices/authSlice";
import { createProject, fetchProjects } from "@/store/slices/projectSlice";
import { Button } from "@/components/ui/button";
import {
  X,
  Search,
  Lock,
  Globe,
  Star,
  Loader2,
  RefreshCw,
  ArrowRight,
  ArrowUpDown,
  FolderGit2,
  AlertCircle,
} from "lucide-react";
import { GithubIcon } from "@/components/ui/github-icon";
import { cn } from "@/lib/utils";
import api from "@/lib/api";

const TABS = [
  { key: "all", label: "All" },
  { key: "public", label: "Public" },
  { key: "private", label: "Private" },
];

const SORTS = [
  { key: "updated", label: "Recently updated" },
  { key: "name", label: "Name A–Z" },
  { key: "stars", label: "Most stars" },
];

const LANG_COLORS = {
  JavaScript: "#f1e05a",
  TypeScript: "#3178c6",
  Python: "#3572a5",
  Java: "#b07219",
  HTML: "#e34c26",
  CSS: "#7c5cbf",
  SCSS: "#c6538c",
  Go: "#00add8",
  Rust: "#dea584",
  "C++": "#f34b7d",
  C: "#8a8a8a",
  "C#": "#178600",
  PHP: "#4f5d95",
  Ruby: "#cc342d",
  Kotlin: "#a97bff",
  Swift: "#f05138",
  Dart: "#00b4ab",
  Shell: "#89e051",
  Vue: "#41b883",
};

function timeAgo(date) {
  if (!date) return "";
  const s = (Date.now() - new Date(date).getTime()) / 1000;
  if (s < 60) return "just now";
  const m = s / 60;
  if (m < 60) return `${Math.floor(m)}m ago`;
  const h = m / 60;
  if (h < 24) return `${Math.floor(h)}h ago`;
  const d = h / 24;
  if (d < 30) return `${Math.floor(d)}d ago`;
  const mo = d / 30;
  if (mo < 12) return `${Math.floor(mo)}mo ago`;
  return `${Math.floor(mo / 12)}y ago`;
}

const MODAL_CSS = `
@keyframes gh-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes gh-pop  { from { opacity: 0; transform: translateY(12px) scale(.985); } to { opacity: 1; transform: none; } }
@keyframes gh-row  { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
.gh-backdrop { animation: gh-fade .2s ease both; }
.gh-modal    { animation: gh-pop .28s cubic-bezier(.22,1,.36,1) both; }
.gh-row      { animation: gh-row .34s cubic-bezier(.22,1,.36,1) both; }
.gh-pill     { transition: transform .3s cubic-bezier(.22,1,.36,1); will-change: transform; }
@media (prefers-reduced-motion: reduce) {
  .gh-backdrop, .gh-modal, .gh-row { animation: none !important; }
  .gh-pill { transition: none !important; }
}
`;

export default function GithubRepoPickerModal({ isOpen, onClose }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { githubRepos, reposLoading, reposError, user } = useSelector((s) => s.auth);
  const [tab, setTab] = useState("all");
  const [sort, setSort] = useState("updated");
  const [search, setSearch] = useState("");
  const [importing, setImporting] = useState(null); // full_name of repo being imported

  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen && user?.githubId && githubRepos.length === 0) {
      dispatch(fetchGithubRepos());
    }
  }, [isOpen, user?.githubId, dispatch, githubRepos.length]);

  /* While open: keep wheel/touch events inside the modal (a global smooth-scroll on
     window/document can't swallow them), lock the page behind it, close on Escape. */
  useEffect(() => {
    if (!isOpen) return;

    const el = modalRef.current;
    const stop = (e) => e.stopPropagation();
    el?.addEventListener("wheel", stop, { passive: true });
    el?.addEventListener("touchmove", stop, { passive: true });

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      el?.removeEventListener("wheel", stop);
      el?.removeEventListener("touchmove", stop);
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, onClose]);

  const counts = useMemo(
    () => ({
      all: githubRepos.length,
      public: githubRepos.filter((r) => !r.private).length,
      private: githubRepos.filter((r) => r.private).length,
    }),
    [githubRepos]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = githubRepos.filter((r) => {
      if (tab === "public" && r.private) return false;
      if (tab === "private" && !r.private) return false;
      if (q && !r.name.toLowerCase().includes(q) && !(r.description || "").toLowerCase().includes(q)) return false;
      return true;
    });
    const sorted = [...list];
    if (sort === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === "stars") sorted.sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0));
    else sorted.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    return sorted;
  }, [githubRepos, tab, search, sort]);

  if (!isOpen) return null;

  const tabIndex = TABS.findIndex((t) => t.key === tab);
  const sortLabel = SORTS.find((s) => s.key === sort)?.label;
  const cycleSort = () => setSort((s) => SORTS[(SORTS.findIndex((x) => x.key === s) + 1) % SORTS.length].key);

  const handleImport = async (repo) => {
    setImporting(repo.full_name);
    try {
      const created = await dispatch(createProject({ name: repo.name }));
      if (created.meta.requestStatus !== "fulfilled") {
        toast.error("Failed to create project");
        setImporting(null);
        return;
      }
      const projectId = created.payload._id;

      // Link the repo — backend will clone and analyze
      await api.post(`/github/${projectId}/link-repo`, { githubUrl: repo.html_url });
      dispatch(fetchProjects());

      toast.success(`"${repo.name}" imported and analysis started!`);
      onClose();
      navigate(`/projects/${projectId}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Import failed");
    } finally {
      setImporting(null);
    }
  };

  // Portal → no transformed/scrolling ancestor can break `fixed` positioning or scrolling
  return createPortal(
    <>
      <style>{MODAL_CSS}</style>

      {/* Backdrop */}
      <div className="gh-backdrop fixed inset-0 z-50 bg-foreground/40 backdrop-blur-[2px]" onClick={onClose} />

      {/* Positioning layer (clicks pass through to the backdrop) */}
      <div className="pointer-events-none fixed inset-0 z-50 flex items-start justify-center px-4 pt-[7vh]">
        <div
          ref={modalRef}
          className="gh-modal pointer-events-auto flex max-h-[86vh] w-full max-w-[680px] flex-col overflow-hidden rounded-2xl border border-border bg-card font-sans shadow-2xl"
        >
          {/* ───── Header ───── */}
          <div className="flex shrink-0 items-center justify-between gap-3 px-6 pb-4 pt-5">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-secondary">
                <GithubIcon className="h-5 w-5 text-foreground" />
              </div>
              <div className="min-w-0">
                <h2 className="text-[15px] font-semibold leading-tight tracking-tight text-foreground">
                  Import from GitHub
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Choose a repository to clone and analyze.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8 transition-transform active:scale-90"
                onClick={() => dispatch(fetchGithubRepos())}
                title="Refresh repositories"
              >
                <RefreshCw className={cn("h-4 w-4", reposLoading && "animate-spin")} />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8 transition-transform active:scale-90"
                onClick={onClose}
                title="Close (Esc)"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* ───── Search + filters ───── */}
          <div className="shrink-0 space-y-3 border-b border-border px-6 pb-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or description…"
                className="h-10 w-full rounded-xl border border-border bg-secondary/40 pl-10 pr-9 text-sm text-foreground transition-[border-color,background-color,box-shadow] placeholder:text-muted-foreground hover:bg-secondary/60 focus:border-primary/50 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/15"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            <div className="flex items-center justify-between gap-3">
              {/* segmented tabs with sliding pill */}
              <div className="relative grid w-full max-w-[310px] grid-cols-3 rounded-lg border border-border bg-secondary p-0.5">
                <div
                  aria-hidden
                  className="gh-pill absolute inset-y-0.5 left-0.5 w-[calc(33.333%-2px)] rounded-md bg-card shadow-sm"
                  style={{ transform: `translateX(${tabIndex * 100}%)` }}
                />
                {TABS.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setTab(t.key)}
                    className={cn(
                      "relative z-10 flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-colors duration-200",
                      tab === t.key ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {t.key === "private" && <Lock className="h-3 w-3" />}
                    {t.label}
                    <span className="tabular-nums text-[11px] opacity-60">{counts[t.key]}</span>
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={cycleSort}
                title="Change sort order"
                className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 text-xs font-medium text-muted-foreground transition-[color,background-color,transform] hover:bg-secondary hover:text-foreground active:scale-95"
              >
                <ArrowUpDown className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{sortLabel}</span>
              </button>
            </div>
          </div>

          {/* ───── List (fills remaining height, scrolls on its own) ───── */}
          <div data-lenis-prevent className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-2">
            {/* loading skeleton */}
            {reposLoading && githubRepos.length === 0 && (
              <div className="space-y-1 py-1">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex animate-pulse items-center gap-3 rounded-xl px-3 py-3">
                    <div className="h-9 w-9 rounded-lg bg-secondary" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-40 rounded bg-secondary" />
                      <div className="h-2.5 w-3/4 rounded bg-secondary" />
                    </div>
                    <div className="h-8 w-20 rounded-lg bg-secondary" />
                  </div>
                ))}
              </div>
            )}

            {/* error */}
            {reposError && !reposLoading && (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-destructive/30 bg-destructive/10">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                </div>
                <p className="max-w-xs text-sm text-muted-foreground">{reposError}</p>
                <Button size="sm" variant="outline" onClick={() => dispatch(fetchGithubRepos())}>
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                  Try again
                </Button>
              </div>
            )}

            {/* empty */}
            {!reposLoading && !reposError && filtered.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-14 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-secondary">
                  <FolderGit2 className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">
                  {search ? "No matching repositories" : "No repositories found"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {search ? `Nothing matches “${search}”. Try a different search.` : "Connect GitHub or refresh the list."}
                </p>
              </div>
            )}

            {/* rows */}
            {!reposError &&
              filtered.map((repo, i) => {
                const isImporting = importing === repo.full_name;
                return (
                  <div
                    key={repo.full_name}
                    className="gh-row group flex items-center gap-3.5 rounded-xl px-3 py-3 transition-colors hover:bg-secondary/60"
                    style={{ animationDelay: `${Math.min(i, 10) * 25}ms` }}
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-secondary/60 text-muted-foreground transition-colors group-hover:border-primary/30 group-hover:text-primary">
                      {repo.private ? <Lock className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold text-foreground">{repo.name}</span>
                        <span
                          className={cn(
                            "shrink-0 rounded-full border px-2 py-px text-[10px] font-medium",
                            repo.private
                              ? "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                              : "border-border bg-secondary text-muted-foreground"
                          )}
                        >
                          {repo.private ? "Private" : "Public"}
                        </span>
                      </div>

                      {repo.description && (
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">{repo.description}</p>
                      )}

                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[11px] text-muted-foreground">
                        {repo.language && (
                          <span className="flex items-center gap-1.5">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: LANG_COLORS[repo.language] || "#94a3b8" }}
                            />
                            {repo.language}
                          </span>
                        )}
                        {repo.stargazers_count > 0 && (
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            {repo.stargazers_count}
                          </span>
                        )}
                        <span title={new Date(repo.updated_at).toLocaleString()}>
                          Updated {timeAgo(repo.updated_at)}
                        </span>
                      </div>
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={importing !== null}
                      onClick={() => handleImport(repo)}
                      className="min-w-[92px] shrink-0 gap-1.5 transition-transform active:scale-95"
                    >
                      {isImporting ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Importing…
                        </>
                      ) : (
                        <>
                          Import
                          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                        </>
                      )}
                    </Button>
                  </div>
                );
              })}
          </div>

          {/* ───── Footer ───── */}
          <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border bg-secondary/30 px-6 py-3 text-xs text-muted-foreground">
            <span>
              Showing <span className="font-medium tabular-nums text-foreground">{filtered.length}</span> of{" "}
              <span className="tabular-nums">{githubRepos.length}</span> repositories
            </span>
            <span className="hidden truncate sm:inline">Private repos need the “repo” scope on your GitHub connection</span>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
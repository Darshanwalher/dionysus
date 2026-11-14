import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Search,
  File,
  Folder,
  FolderOpen,
  ChevronRight,
  FileJson,
  FileCode,
  FileText,
  Image,
  Settings,
  EyeOff,
  Eye,
  ChevronsDownUp,
  ChevronsUpDown,
  Copy,
  Check,
  ExternalLink,
  X,
  FolderTree,
  ListTree,
} from "lucide-react";
import {
  collectIdsToDepth,
  collectMatchingIds,
  countStats,
  filterNoise,
  isNoiseDir,
  getPathToNode,
} from "@/lib/fileTree";

const cx = (...parts) => parts.filter(Boolean).join(" ");

/* ───────────── file categories (icon colour + composition bar) ───────────── */

const CATS = {
  code: { label: "Code", icon: FileCode, text: "text-sky-400", bar: "bg-sky-500" },
  data: { label: "JSON / data", icon: FileJson, text: "text-amber-400", bar: "bg-amber-500" },
  docs: { label: "Docs", icon: FileText, text: "text-violet-400", bar: "bg-violet-500" },
  style: { label: "Styles", icon: FileCode, text: "text-pink-400", bar: "bg-pink-500" },
  markup: { label: "HTML", icon: FileCode, text: "text-orange-400", bar: "bg-orange-500" },
  config: { label: "Config", icon: Settings, text: "text-teal-400", bar: "bg-teal-500" },
  media: { label: "Media", icon: Image, text: "text-emerald-400", bar: "bg-emerald-500" },
  other: { label: "Other", icon: File, text: "text-muted-foreground", bar: "bg-slate-400" },
};

const EXT_CAT = {
  js: "code", jsx: "code", ts: "code", tsx: "code", mjs: "code", cjs: "code",
  py: "code", go: "code", rs: "code", java: "code",
  json: "data", jsonc: "data",
  md: "docs", mdx: "docs", txt: "docs",
  css: "style", scss: "style", less: "style",
  html: "markup",
  yml: "config", yaml: "config", toml: "config", ini: "config", env: "config",
  svg: "media", png: "media", jpg: "media", jpeg: "media", gif: "media", ico: "media", webp: "media",
};

function categoryOf(name = "") {
  if (name.startsWith(".")) return "config";
  const ext = name.includes(".") ? name.split(".").pop().toLowerCase() : "";
  return EXT_CAT[ext] || "other";
}

const extOf = (name = "") => (name.includes(".") && !name.startsWith(".") ? name.split(".").pop().toLowerCase() : "");

function analyze(node) {
  let files = 0;
  let folders = 0;
  const cats = new Map();
  const walk = (n) => {
    (n.children || []).forEach((c) => {
      if (c.type === "folder") {
        folders++;
        walk(c);
      } else {
        files++;
        const k = categoryOf(c.name);
        cats.set(k, (cats.get(k) || 0) + 1);
      }
    });
  };
  walk(node);
  return { files, folders, cats: [...cats.entries()].sort((a, b) => b[1] - a[1]) };
}

function collectFolderIds(node, out = new Set()) {
  if (node.type === "folder") {
    out.add(node.id);
    (node.children || []).forEach((c) => collectFolderIds(c, out));
  }
  return out;
}

function highlightName(name, searchTerm) {
  if (!searchTerm) return name;
  const q = searchTerm.toLowerCase();
  const idx = name.toLowerCase().indexOf(q);
  if (idx === -1) return name;
  return (
    <>
      {name.slice(0, idx)}
      <span className="rounded-xs bg-amber-400/20 px-0.5 font-bold text-amber-500 dark:text-amber-300">
        {name.slice(idx, idx + searchTerm.length)}
      </span>
      {name.slice(idx + searchTerm.length)}
    </>
  );
}

/* Smooth open/close without measuring heights (grid-rows trick).
   Children mount on open and unmount shortly after closing, so big trees stay cheap. */
function Collapse({ open, children }) {
  const [render, setRender] = useState(open);
  const [show, setShow] = useState(open);

  useEffect(() => {
    if (open) {
      setRender(true);
      const r = requestAnimationFrame(() => requestAnimationFrame(() => setShow(true)));
      return () => cancelAnimationFrame(r);
    }
    setShow(false);
    const t = setTimeout(() => setRender(false), 240);
    return () => clearTimeout(t);
  }, [open]);

  if (!render) return null;
  return (
    <div
      className="grid transition-[grid-template-rows,opacity] duration-200 ease-out"
      style={{ gridTemplateRows: show ? "1fr" : "0fr", opacity: show ? 1 : 0 }}
    >
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}

/* ───────────── tree ───────────── */

function TreeNode({ item, searchTerm, expandIds, expanded, onToggle, selectedId, onSelect, forceVisible = false }) {
  const isFolder = item.type === "folder";
  const q = searchTerm.trim().toLowerCase();
  const selfMatch = !q || item.name.toLowerCase().includes(q);

  if (q && !forceVisible && !selfMatch && !expandIds.has(item.id)) return null;

  const isOpen = isFolder && expanded.has(item.id);
  const isSelected = selectedId === item.id;
  const cat = CATS[categoryOf(item.name)];
  const Icon = isFolder ? (isOpen ? FolderOpen : Folder) : cat.icon;
  const childCount = item.children?.length || 0;

  return (
    <div className="select-none text-xs">
      <div
        data-node-id={item.id}
        onClick={() => {
          onSelect(item);
          if (isFolder) onToggle(item.id);
        }}
        title={item.path || item.name}
        className={cx(
          "group relative flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 transition-colors duration-150",
          isSelected ? "bg-primary/10" : "hover:bg-muted/40"
        )}
      >
        <span
          aria-hidden
          className={cx(
            "absolute bottom-1 left-0 top-1 w-0.5 origin-center rounded-full bg-primary transition-transform duration-200",
            isSelected ? "scale-y-100" : "scale-y-0"
          )}
        />
        <span className="flex w-3.5 justify-center text-muted-foreground/60">
          {isFolder && (
            <ChevronRight className={cx("h-3 w-3 transition-transform duration-200", isOpen && "rotate-90")} />
          )}
        </span>
        <Icon className={cx("h-3.5 w-3.5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110", isFolder ? "text-amber-400" : cat.text)} />
        <span
          className={cx(
            "truncate",
            isFolder ? "font-medium text-foreground" : cx("font-mono", isSelected ? "text-foreground" : "text-muted-foreground group-hover:text-foreground")
          )}
        >
          {highlightName(item.name, searchTerm)}
        </span>
        {isFolder && <span className="ml-auto pl-2 font-mono text-[10px] text-muted-foreground/60">{childCount}</span>}
      </div>

      {isFolder && item.children && (
        <Collapse open={isOpen}>
          <div className="ml-[15px] border-l border-border/40 pl-px">
            {item.children.map((child, idx) => (
              <TreeNode
                key={child.path || child.id || idx}
                item={child}
                searchTerm={searchTerm}
                expandIds={expandIds}
                expanded={expanded}
                onToggle={onToggle}
                selectedId={selectedId}
                onSelect={onSelect}
                forceVisible={forceVisible || selfMatch}
              />
            ))}
          </div>
        </Collapse>
      )}
    </div>
  );
}

/* ───────────── main ───────────── */

export default function FileTreeExplorer({ fileTree, githubUrl }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [hideNoise, setHideNoise] = useState(true);
  const [selected, setSelected] = useState(null);
  const [expanded, setExpanded] = useState(() => new Set());
  const [copied, setCopied] = useState(false);

  const treeRef = useRef(null);
  const searchRef = useRef(null);

  const visibleTree = useMemo(() => filterNoise(fileTree, hideNoise), [fileTree, hideNoise]);
  const stats = useMemo(() => countStats(visibleTree), [visibleTree]);
  const { expandIds } = useMemo(() => collectMatchingIds(visibleTree, searchTerm), [visibleTree, searchTerm]);

  useEffect(() => {
    if (!visibleTree) return;
    const defaults = collectIdsToDepth(visibleTree, 1);
    for (const child of visibleTree.children || []) {
      if (child.type === "folder" && isNoiseDir(child.name)) defaults.delete(child.id);
    }
    setExpanded(defaults);
    setSelected(visibleTree);
  }, [visibleTree]);

  useEffect(() => {
    if (!searchTerm.trim() || expandIds.size === 0) return;
    setExpanded((prev) => {
      const next = new Set(prev);
      expandIds.forEach((id) => next.add(id));
      return next;
    });
  }, [searchTerm, expandIds]);

  // "/" focuses the search box
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey) return;
      const tag = e.target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || e.target?.isContentEditable) return;
      e.preventDefault();
      searchRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const toggleNode = useCallback((id) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // keep the selected row visible (after folders have had time to open)
  useEffect(() => {
    if (!selected) return;
    const t = setTimeout(() => {
      const el = treeRef.current?.querySelector(`[data-node-id="${CSS.escape(String(selected.id))}"]`);
      el?.scrollIntoView({ block: "nearest" });
    }, 60);
    return () => clearTimeout(t);
  }, [selected?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const pathNodes = useMemo(
    () => (selected && visibleTree ? getPathToNode(visibleTree, selected.id) || [selected] : []),
    [visibleTree, selected]
  );

  // select a node from anywhere (inspector, breadcrumb) and reveal it in the tree
  const navigateTo = useCallback(
    (node) => {
      setSelected(node);
      const ancestors = (visibleTree && getPathToNode(visibleTree, node.id)) || [];
      setExpanded((prev) => {
        const next = new Set(prev);
        ancestors.forEach((n) => n.type === "folder" && next.add(n.id));
        return next;
      });
    },
    [visibleTree]
  );

  const expandShallow = () => setExpanded(collectIdsToDepth(visibleTree, 3));
  const collapseAll = () => setExpanded(visibleTree ? new Set([visibleTree.id]) : new Set());
  const expandInside = (node) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      collectFolderIds(node).forEach((id) => next.add(id));
      return next;
    });

  /* flat list of what's currently visible → arrow-key navigation */
  const flatVisible = useMemo(() => {
    const out = [];
    const q = searchTerm.trim().toLowerCase();
    const walk = (item, forceVisible) => {
      const selfMatch = !q || item.name.toLowerCase().includes(q);
      if (q && !forceVisible && !selfMatch && !expandIds.has(item.id)) return;
      out.push(item);
      if (item.type === "folder" && expanded.has(item.id)) {
        (item.children || []).forEach((c) => walk(c, forceVisible || selfMatch));
      }
    };
    if (visibleTree) walk(visibleTree, false);
    return out;
  }, [visibleTree, expanded, expandIds, searchTerm]);

  const onTreeKeyDown = (e) => {
    if (!selected || !flatVisible.length) return;
    const idx = flatVisible.findIndex((n) => n.id === selected.id);
    const isFolder = selected.type === "folder";
    const open = expanded.has(selected.id);

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelected(flatVisible[Math.min(idx + 1, flatVisible.length - 1)]);
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelected(flatVisible[Math.max(idx - 1, 0)]);
        break;
      case "Home":
        e.preventDefault();
        setSelected(flatVisible[0]);
        break;
      case "End":
        e.preventDefault();
        setSelected(flatVisible[flatVisible.length - 1]);
        break;
      case "ArrowRight":
        if (isFolder) {
          e.preventDefault();
          if (!open) toggleNode(selected.id);
          else if (selected.children?.[0]) setSelected(selected.children[0]);
        }
        break;
      case "ArrowLeft":
        e.preventDefault();
        if (isFolder && open) toggleNode(selected.id);
        else if (pathNodes.length > 1) setSelected(pathNodes[pathNodes.length - 2]);
        break;
      case "Enter":
      case " ":
        if (isFolder) {
          e.preventDefault();
          toggleNode(selected.id);
        }
        break;
      default:
    }
  };

  const copyPath = () => {
    const value = selected?.path || selected?.name;
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success("Path copied to clipboard");
    setTimeout(() => setCopied(false), 1800);
  };

  const githubLink = useMemo(() => {
    if (!githubUrl || !selected?.path) return null;
    const cleanUrl = githubUrl.replace(/\.git$/i, "").replace(/\/+$/, "");
    const mode = selected.type === "folder" ? "tree" : "blob";
    return `${cleanUrl}/${mode}/main/${selected.path}`;
  }, [githubUrl, selected]);

  const info = useMemo(() => (selected?.type === "folder" ? analyze(selected) : null), [selected]);

  const siblings = useMemo(() => {
    if (!selected || selected.type !== "file" || pathNodes.length < 2) return [];
    const parent = pathNodes[pathNodes.length - 2];
    return (parent.children || []).filter((c) => c.id !== selected.id);
  }, [selected, pathNodes]);

  const selCat = selected ? CATS[selected.type === "folder" ? "other" : categoryOf(selected.name)] : CATS.other;
  const SelIcon = selected?.type === "folder" ? FolderOpen : selCat.icon;

  const contents = useMemo(() => {
    if (!selected || selected.type !== "folder") return [];
    return [...(selected.children || [])].sort((a, b) =>
      a.type === b.type ? a.name.localeCompare(b.name) : a.type === "folder" ? -1 : 1
    );
  }, [selected]);

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden">
      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(340px,440px)_minmax(0,1fr)]">
        {/* ═════════ Left: explorer ═════════ */}
        <section className="viz-in flex min-h-0 min-w-0 flex-col border-border lg:border-r">
          {/* toolbar */}
          <div className="flex-shrink-0 space-y-2 border-b border-border/50 bg-card/50 px-3 py-2.5">
            <div className="relative">
              <Search className="absolute left-2.5 top-[9px] h-3.5 w-3.5 text-muted-foreground/60" />
              <input
                ref={searchRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setSearchTerm("");
                    e.currentTarget.blur();
                  }
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    treeRef.current?.focus();
                  }
                }}
                placeholder="Filter files or folders…"
                className="w-full rounded-md border border-border/50 bg-muted/30 py-1.5 pl-8 pr-14 text-xs text-foreground transition-[background-color,border-color] placeholder:text-muted-foreground/50 hover:bg-muted/50 focus:border-ring/60 focus:bg-background focus:outline-none"
              />
              {searchTerm ? (
                <button
                  onClick={() => setSearchTerm("")}
                  className="viz-pop absolute right-2 top-[7px] flex h-5 w-5 items-center justify-center rounded text-muted-foreground transition-colors hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              ) : (
                <kbd className="absolute right-2 top-[6px] rounded border border-border bg-secondary px-1.5 font-mono text-[10px] text-muted-foreground">
                  /
                </kbd>
              )}
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-0.5">
                <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] text-muted-foreground transition-transform hover:text-foreground active:scale-95" onClick={expandShallow} title="Expand 3 levels deep">
                  <ChevronsUpDown className="mr-1 h-3 w-3" />
                  Expand
                </Button>
                <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] text-muted-foreground transition-transform hover:text-foreground active:scale-95" onClick={collapseAll} title="Collapse all folders">
                  <ChevronsDownUp className="mr-1 h-3 w-3" />
                  Collapse
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cx(
                    "h-6 px-2 text-[10px] transition-[background-color,color,transform] active:scale-95",
                    hideNoise ? "text-muted-foreground" : "bg-muted font-semibold text-foreground"
                  )}
                  onClick={() => setHideNoise((v) => !v)}
                  title="Toggle vendor/build directories like node_modules"
                >
                  {hideNoise ? <EyeOff className="mr-1 h-3 w-3 opacity-70" /> : <Eye className="mr-1 h-3 w-3 text-amber-400" />}
                  {hideNoise ? "Noise hidden" : "Showing noise"}
                </Button>
              </div>
              <span className="select-none whitespace-nowrap font-mono text-[10px] text-muted-foreground/70">
                {stats.files} files · {stats.folders} folders
              </span>
            </div>
          </div>

          {/* slim path bar for small screens (the inspector is hidden there) */}
          {selected && (
            <div className="flex flex-shrink-0 items-center gap-1.5 border-b border-border/30 bg-muted/15 px-3 py-1 font-mono text-[10px] lg:hidden">
              <span className="text-muted-foreground/60">Selected:</span>
              <span className="truncate font-semibold text-foreground">{selected.path || selected.name}</span>
              <button onClick={copyPath} className="p-0.5 text-muted-foreground transition-colors hover:text-foreground" title="Copy path">
                {copied ? <Check className="h-2.5 w-2.5 text-emerald-500" /> : <Copy className="h-2.5 w-2.5" />}
              </button>
            </div>
          )}

          {/* tree */}
          <div
            ref={treeRef}
            tabIndex={0}
            onKeyDown={onTreeKeyDown}
            className="min-h-0 flex-1 overflow-y-auto p-2 outline-none"
          >
            {visibleTree ? (
              <TreeNode
                item={visibleTree}
                searchTerm={searchTerm}
                expandIds={expandIds}
                expanded={expanded}
                onToggle={toggleNode}
                selectedId={selected?.id}
                onSelect={setSelected}
              />
            ) : (
              <div className="viz-fade flex h-full flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
                <ListTree className="h-5 w-5" />
                No file structure parsed for this repository.
              </div>
            )}
          </div>

          <div className="hidden flex-shrink-0 items-center justify-between border-t border-border/40 bg-card/40 px-3 py-1.5 font-mono text-[10px] text-muted-foreground/70 lg:flex">
            <span>↑↓ move · → open · ← close</span>
            <span>/ search</span>
          </div>
        </section>

        {/* ═════════ Right: inspector ═════════ */}
        <section className="viz-in hidden min-h-0 min-w-0 bg-card/20 lg:block" style={{ animationDelay: "70ms" }}>
          {selected ? (
            <div key={selected.id} className="viz-in h-full overflow-y-auto">
              <div className="mx-auto max-w-3xl space-y-6 p-7">
                {/* header */}
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-border bg-muted/50">
                    <SelIcon className={cx("h-6 w-6", selected.type === "folder" ? "text-amber-400" : selCat.text)} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-lg font-semibold tracking-tight text-foreground">{selected.name}</h2>
                      <Badge variant="outline" className="px-1.5 py-0 font-mono text-[9px] uppercase">
                        {selected.type === "folder" ? "Directory" : extOf(selected.name) || "File"}
                      </Badge>
                    </div>

                    {/* clickable breadcrumb */}
                    <div className="mt-1 flex flex-wrap items-center gap-0.5 font-mono text-[11px] text-muted-foreground">
                      {pathNodes.map((n, i) => (
                        <span key={n.id} className="flex items-center gap-0.5">
                          {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground/40" />}
                          {i === pathNodes.length - 1 ? (
                            <span className="text-foreground">{n.name}</span>
                          ) : (
                            <button
                              onClick={() => navigateTo(n)}
                              className="rounded px-0.5 transition-colors hover:text-foreground"
                            >
                              {n.name}
                            </button>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* actions */}
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs transition-transform active:scale-95" onClick={copyPath}>
                    {copied ? <Check key="c" className="viz-pop h-3.5 w-3.5 text-emerald-500" /> : <Copy key="i" className="h-3.5 w-3.5" />}
                    {copied ? "Copied" : "Copy path"}
                  </Button>
                  {githubLink && (
                    <a
                      href={githubLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-background px-3 text-xs font-medium text-foreground transition-[background-color,transform] hover:bg-secondary active:scale-95"
                    >
                      Open on GitHub
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {selected.type === "folder" && (
                    <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs text-muted-foreground transition-transform hover:text-foreground active:scale-95" onClick={() => expandInside(selected)}>
                      <ChevronsUpDown className="h-3.5 w-3.5" />
                      Expand everything inside
                    </Button>
                  )}
                </div>

                {/* ── folder view ── */}
                {selected.type === "folder" && info && (
                  <>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: "Files", value: info.files },
                        { label: "Subfolders", value: info.folders },
                        { label: "Direct items", value: selected.children?.length || 0 },
                      ].map((s, i) => (
                        <div key={s.label} className="viz-in rounded-xl border border-border bg-card px-4 py-3" style={{ animationDelay: `${80 + i * 50}ms` }}>
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{s.label}</div>
                          <div className="mt-1 font-mono text-2xl font-semibold tabular-nums text-foreground">{s.value}</div>
                        </div>
                      ))}
                    </div>

                    {info.files > 0 && (
                      <div className="viz-in rounded-xl border border-border bg-card p-4" style={{ animationDelay: "200ms" }}>
                        <div className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          What’s inside
                        </div>
                        <div className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full bg-muted/50">
                          {info.cats.map(([k, n]) => (
                            <div
                              key={k}
                              className={cx("viz-grow h-full rounded-full", CATS[k].bar)}
                              style={{ width: `${(n / info.files) * 100}%` }}
                              title={`${CATS[k].label}: ${n}`}
                            />
                          ))}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
                          {info.cats.map(([k, n]) => (
                            <span key={k} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                              <span className={cx("h-2 w-2 rounded-full", CATS[k].bar)} />
                              {CATS[k].label}
                              <span className="font-mono text-foreground">{n}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="viz-in" style={{ animationDelay: "260ms" }}>
                      <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Contents
                      </div>
                      {contents.length === 0 ? (
                        <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-xs text-muted-foreground">
                          This folder is empty.
                        </p>
                      ) : (
                        <div className="overflow-hidden rounded-xl border border-border bg-card">
                          {contents.slice(0, 80).map((c) => {
                            const isF = c.type === "folder";
                            const CIcon = isF ? Folder : CATS[categoryOf(c.name)].icon;
                            return (
                              <button
                                key={c.id}
                                onClick={() => navigateTo(c)}
                                className="group flex w-full items-center gap-2.5 border-b border-border/50 px-3 py-2 text-left text-xs transition-colors last:border-b-0 hover:bg-secondary/60"
                              >
                                <CIcon className={cx("h-3.5 w-3.5 flex-shrink-0", isF ? "text-amber-400" : CATS[categoryOf(c.name)].text)} />
                                <span className={cx("truncate", isF ? "font-medium text-foreground" : "font-mono text-muted-foreground group-hover:text-foreground")}>
                                  {c.name}
                                </span>
                                {isF && (
                                  <span className="ml-auto font-mono text-[10px] text-muted-foreground/70">
                                    {c.children?.length || 0} items
                                  </span>
                                )}
                                <ChevronRight className={cx("h-3 w-3 flex-shrink-0 text-muted-foreground/50 transition-transform duration-150 group-hover:translate-x-0.5", !isF && "ml-auto")} />
                              </button>
                            );
                          })}
                          {contents.length > 80 && (
                            <div className="px-3 py-2 text-center text-[11px] text-muted-foreground">
                              +{contents.length - 80} more
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* ── file view ── */}
                {selected.type === "file" && (
                  <>
                    <div className="viz-in grid grid-cols-2 gap-3" style={{ animationDelay: "80ms" }}>
                      <div className="rounded-xl border border-border bg-card px-4 py-3">
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Type</div>
                        <div className="mt-1 flex items-center gap-2 text-sm font-medium text-foreground">
                          <span className={cx("h-2 w-2 rounded-full", selCat.bar)} />
                          {selCat.label}
                          {extOf(selected.name) && <span className="font-mono text-xs text-muted-foreground">.{extOf(selected.name)}</span>}
                        </div>
                      </div>
                      <div className="rounded-xl border border-border bg-card px-4 py-3">
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Folder</div>
                        <div className="mt-1 truncate font-mono text-sm text-foreground">
                          {pathNodes.length > 1 ? pathNodes[pathNodes.length - 2].name : "—"}
                        </div>
                      </div>
                    </div>

                    <div className="viz-in rounded-xl border border-border bg-card px-4 py-3" style={{ animationDelay: "140ms" }}>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Full path</div>
                      <div className="mt-1 break-all font-mono text-xs text-foreground">{selected.path || selected.name}</div>
                    </div>

                    {siblings.length > 0 && (
                      <div className="viz-in" style={{ animationDelay: "200ms" }}>
                        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Also in this folder
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {siblings.slice(0, 40).map((s) => {
                            const SIcon = s.type === "folder" ? Folder : CATS[categoryOf(s.name)].icon;
                            return (
                              <button
                                key={s.id}
                                onClick={() => navigateTo(s)}
                                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1 font-mono text-[11px] text-muted-foreground transition-[color,background-color,transform] hover:bg-secondary hover:text-foreground active:scale-95"
                              >
                                <SIcon className={cx("h-3 w-3", s.type === "folder" ? "text-amber-400" : CATS[categoryOf(s.name)].text)} />
                                {s.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="viz-fade flex h-full flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
              <FolderTree className="h-6 w-6" />
              Select a file or folder to inspect it.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { ChevronRight, CornerLeftUp, FileCode, Folder, FolderOpen, Home } from "lucide-react";
import { cn } from "../../lib/utils";
import { buildFileTree, getNode, sortedFolders } from "./fileTree";

/**
 * Folder-by-folder file picker.
 *  - click a folder (or press → / Enter) to go inside, use the breadcrumb or ← to go back
 *  - with a search term it switches to a flat list of matches across all folders
 *  - exposes onKeyDown(e) so a textarea can drive it without losing focus
 */
const FileBrowser = forwardRef(function FileBrowser(
  { files = [], search = "", onPick, bordered = true, keepFocus = false, listClassName = "" },
  ref
) {
  const tree = useMemo(() => buildFileTree(files), [files]);
  const [path, setPath] = useState([]);
  const [dir, setDir] = useState("fwd");
  const [active, setActive] = useState(0);

  const rowRefs = useRef([]);
  const crumbRef = useRef(null);
  const viaKeyboard = useRef(false);

  const q = search.trim().toLowerCase();
  const searching = q.length > 0;
  const node = useMemo(() => getNode(tree, path) || tree, [tree, path]);

  const items = useMemo(() => {
    if (searching) {
      return files
        .filter((f) => f.toLowerCase().includes(q))
        .slice(0, 80)
        .map((f) => {
          const parts = f.split("/");
          return { type: "file", name: parts.pop(), path: f, dir: parts.join("/") };
        });
    }
    const folders = sortedFolders(node).map((f) => ({ type: "folder", name: f.name, path: f.path, count: f.count }));
    const fileItems = [...node.files]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((f) => ({ type: "file", name: f.name, path: f.path }));
    return [...folders, ...fileItems];
  }, [files, node, q, searching]);

  // reset selection when the list changes
  useEffect(() => {
    setActive(0);
  }, [path, q]);

  // path no longer exists (files reloaded) → back to root
  useEffect(() => {
    if (path.length && !getNode(tree, path)) setPath([]);
  }, [tree, path]);

  useEffect(() => {
    if (viaKeyboard.current) rowRefs.current[active]?.scrollIntoView({ block: "nearest" });
  }, [active]);

  useEffect(() => {
    const el = crumbRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [path]);

  const enter = (folderPath) => {
    setDir("fwd");
    setPath(folderPath.split("/"));
  };

  const goTo = (keep) => {
    setDir(keep < path.length ? "back" : "fwd");
    setPath(path.slice(0, keep));
  };

  const activate = (it) => {
    if (!it) return;
    if (it.type === "folder") enter(it.path);
    else onPick?.(it.path);
  };

  useImperativeHandle(
    ref,
    () => ({
      onKeyDown(e) {
        const it = items[active];
        switch (e.key) {
          case "ArrowDown":
            if (!items.length) return false;
            e.preventDefault();
            viaKeyboard.current = true;
            setActive((i) => (i + 1) % items.length);
            return true;
          case "ArrowUp":
            if (!items.length) return false;
            e.preventDefault();
            viaKeyboard.current = true;
            setActive((i) => (i - 1 + items.length) % items.length);
            return true;
          case "ArrowRight":
            if (it?.type === "folder") {
              e.preventDefault();
              enter(it.path);
              return true;
            }
            return false;
          case "ArrowLeft":
            if (!searching && path.length) {
              e.preventDefault();
              goTo(path.length - 1);
              return true;
            }
            return false;
          case "Enter":
          case "Tab":
            if (!it) return false;
            e.preventDefault();
            activate(it);
            return true;
          default:
            return false;
        }
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, active, path, searching]
  );

  const listKey = searching ? "search" : path.join("/") || "root";

  return (
    <div
      className={cn("overflow-hidden", bordered && "rounded-xl border border-border bg-secondary/20")}
      onMouseDown={keepFocus ? (e) => e.preventDefault() : undefined}
    >
      {/* breadcrumb */}
      <div className="flex items-center gap-1.5 border-b border-border/70 px-2 py-1.5">
        {!searching && path.length > 0 && (
          <button
            type="button"
            onClick={() => goTo(path.length - 1)}
            title="Up one level (←)"
            className="chat-pop flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-[color,background-color,transform] hover:bg-secondary hover:text-foreground active:scale-90"
          >
            <CornerLeftUp className="h-3.5 w-3.5" />
          </button>
        )}

        <div
          ref={crumbRef}
          className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto whitespace-nowrap text-[11px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {searching ? (
            <span className="px-1 text-muted-foreground">
              {items.length} match{items.length === 1 ? "" : "es"} across all folders
            </span>
          ) : (
            <>
              <button
                type="button"
                onClick={() => goTo(0)}
                className={cn(
                  "flex items-center gap-1 rounded px-1.5 py-0.5 transition-colors",
                  path.length === 0 ? "font-semibold text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Home className="h-3 w-3" />
                Repo
              </button>
              {path.map((seg, i) => (
                <React.Fragment key={seg + i}>
                  <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground/50" />
                  {i === path.length - 1 ? (
                    <span className="rounded px-1.5 py-0.5 font-semibold text-foreground">{seg}</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => goTo(i + 1)}
                      className="rounded px-1.5 py-0.5 text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {seg}
                    </button>
                  )}
                </React.Fragment>
              ))}
            </>
          )}
        </div>

        <span className="shrink-0 pl-1 font-mono text-[10px] text-muted-foreground">
          {searching ? items.length : node.count} files
        </span>
      </div>

      {/* list (slides in the direction you navigate) */}
      <div className={listClassName}>
        <div key={listKey} className={dir === "fwd" ? "chat-slide-fwd" : "chat-slide-back"}>
          {items.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs italic text-muted-foreground">
              {searching ? `No files match “${search.trim()}”` : "This folder is empty"}
            </p>
          ) : (
            <div className="space-y-0.5 p-1.5">
              {items.map((it, i) => {
                const isFolder = it.type === "folder";
                const isActive = i === active;
                return (
                  <button
                    key={it.path}
                    ref={(el) => (rowRefs.current[i] = el)}
                    type="button"
                    onClick={() => activate(it)}
                    onMouseEnter={() => {
                      viaKeyboard.current = false;
                      setActive(i);
                    }}
                    title={it.path}
                    className={cn(
                      "group flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[11.5px] transition-[background-color,color,transform] duration-150 active:scale-[0.99]",
                      isActive ? "bg-secondary text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {isFolder ? (
                      isActive ? (
                        <FolderOpen className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                      ) : (
                        <Folder className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                      )
                    ) : (
                      <FileCode className="h-3.5 w-3.5 shrink-0 text-accent-cyan" />
                    )}

                    <span className={cn("truncate", isFolder ? "font-medium text-foreground" : "font-mono")}>
                      {it.name}
                    </span>
                    {it.dir && (
                      <span className="truncate font-mono text-[10px] text-muted-foreground/60">{it.dir}</span>
                    )}

                    {isFolder && (
                      <span className="ml-auto flex shrink-0 items-center gap-1.5">
                        <span className="font-mono text-[10px] text-muted-foreground/70">{it.count}</span>
                        <ChevronRight
                          className={cn(
                            "h-3 w-3 transition-transform duration-150",
                            isActive && "translate-x-0.5 text-foreground"
                          )}
                        />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default FileBrowser;
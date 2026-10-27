import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Search,
  File,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  FileJson,
  FileCode,
  FileText,
  Image,
  Settings,
  EyeOff,
  Eye,
  ChevronsDownUp,
  ChevronsUpDown,
} from "lucide-react";
import {
  collectIdsToDepth,
  collectMatchingIds,
  countStats,
  filterNoise,
  isNoiseDir,
} from "@/lib/fileTree";

const EXT_ICON = {
  js: FileCode,
  jsx: FileCode,
  ts: FileCode,
  tsx: FileCode,
  mjs: FileCode,
  cjs: FileCode,
  py: FileCode,
  go: FileCode,
  rs: FileCode,
  java: FileCode,
  json: FileJson,
  jsonc: FileJson,
  md: FileText,
  mdx: FileText,
  txt: FileText,
  yml: FileText,
  yaml: FileText,
  svg: Image,
  png: Image,
  jpg: Image,
  jpeg: Image,
  gif: Image,
  ico: Image,
  webp: Image,
  env: Settings,
  toml: Settings,
  ini: Settings,
};

function fileIcon(name) {
  const ext = name.includes(".") ? name.split(".").pop().toLowerCase() : "";
  return EXT_ICON[ext] || File;
}

function highlightName(name, searchTerm) {
  if (!searchTerm) return name;
  const q = searchTerm.toLowerCase();
  const lower = name.toLowerCase();
  const idx = lower.indexOf(q);
  if (idx === -1) return name;
  return (
    <>
      {name.slice(0, idx)}
      <span className="bg-muted text-foreground rounded-sm px-0.5">
        {name.slice(idx, idx + searchTerm.length)}
      </span>
      {name.slice(idx + searchTerm.length)}
    </>
  );
}

function TreeNode({
  item,
  depth = 0,
  searchTerm,
  expandIds,
  expanded,
  onToggle,
  selectedId,
  onSelect,
  forceVisible = false,
}) {
  const isFolder = item.type === "folder";
  const q = searchTerm.trim().toLowerCase();
  const selfMatch = !q || item.name.toLowerCase().includes(q);

  if (q && !forceVisible && !selfMatch && !expandIds.has(item.id)) return null;

  const isOpen = isFolder && expanded.has(item.id);
  const isSelected = selectedId === item.id;
  const Icon = isFolder ? (isOpen ? FolderOpen : Folder) : fileIcon(item.name);
  const childCount = item.children?.length || 0;

  return (
    <div className="select-none text-xs">
      <div
        onClick={() => {
          onSelect(item);
          if (isFolder) onToggle(item.id);
        }}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        className={`flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer transition-colors ${
          isSelected
            ? "bg-muted text-foreground"
            : isFolder
              ? "hover:bg-muted/50 text-foreground font-medium"
              : "hover:bg-muted/30 text-muted-foreground hover:text-foreground"
        }`}
      >
        {isFolder ? (
          <span className="text-muted-foreground/70">
            {isOpen ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </span>
        ) : (
          <span className="w-3.5" />
        )}
        <Icon
          className={`h-3.5 w-3.5 flex-shrink-0 ${
            isFolder ? "text-foreground" : "text-muted-foreground"
          }`}
        />
        <span className={`truncate ${isFolder ? "text-foreground" : "font-mono text-muted-foreground"}`}>
          {highlightName(item.name, searchTerm)}
        </span>
        {isFolder && (
          <span className="text-[10px] text-muted-foreground ml-auto font-mono">
            {childCount}
          </span>
        )}
      </div>

      {isFolder && isOpen && item.children && (
        <div className="border-l border-border/40 ml-4">
          {item.children.map((child, idx) => (
            <TreeNode
              key={child.path || child.id || idx}
              item={child}
              depth={depth + 1}
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
      )}
    </div>
  );
}

export default function FileTreeExplorer({ fileTree, isFullscreen }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [hideNoise, setHideNoise] = useState(true);
  const [selected, setSelected] = useState(null);
  const [expanded, setExpanded] = useState(() => new Set());

  const visibleTree = useMemo(
    () => filterNoise(fileTree, hideNoise),
    [fileTree, hideNoise]
  );

  const stats = useMemo(() => countStats(visibleTree), [visibleTree]);
  const { expandIds } = useMemo(
    () => collectMatchingIds(visibleTree, searchTerm),
    [visibleTree, searchTerm]
  );

  useEffect(() => {
    if (!visibleTree) return;
    const defaults = collectIdsToDepth(visibleTree, 1);
    for (const child of visibleTree.children || []) {
      if (child.type === "folder" && isNoiseDir(child.name)) {
        defaults.delete(child.id);
      }
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

  const toggleNode = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandShallow = () => {
    setExpanded(collectIdsToDepth(visibleTree, 3));
  };

  const collapseAll = () => {
    setExpanded(visibleTree ? new Set([visibleTree.id]) : new Set());
  };

  return (
    <div
      className="p-6 space-y-4"
      style={{ minHeight: isFullscreen ? "calc(100vh - 160px)" : undefined }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter files or folders..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-muted/40 border border-border/60 rounded-lg focus:outline-none focus:border-ring text-foreground"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs border-border/60 text-muted-foreground hover:text-foreground"
            onClick={expandShallow}
          >
            <ChevronsUpDown className="h-3.5 w-3.5 mr-1.5" />
            Expand
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs border-border/60 text-muted-foreground hover:text-foreground"
            onClick={collapseAll}
          >
            <ChevronsDownUp className="h-3.5 w-3.5 mr-1.5" />
            Collapse
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs border-border/60 text-muted-foreground hover:text-foreground"
            onClick={() => setHideNoise((v) => !v)}
          >
            {hideNoise ? (
              <EyeOff className="h-3.5 w-3.5 mr-1.5" />
            ) : (
              <Eye className="h-3.5 w-3.5 mr-1.5" />
            )}
            {hideNoise ? "Hide vendor" : "Show vendor"}
          </Button>
          <span className="text-[11px] font-mono text-muted-foreground">
            {stats.files} files · {stats.folders} folders
          </span>
        </div>
      </div>

      {selected && (
        <div className="flex items-center gap-3 text-xs border border-border/40 rounded-lg px-3 py-2 bg-muted/20">
          <span className="font-mono text-muted-foreground truncate">
            {selected.path || selected.name}
          </span>
          <span className="ml-auto text-[10px] uppercase tracking-wide text-muted-foreground">
            {selected.type}
            {selected.type === "folder"
              ? ` · ${selected.children?.length || 0} items`
              : ""}
          </span>
        </div>
      )}

      <div className="border border-border/40 rounded-xl p-4 bg-card/40 max-h-[600px] overflow-y-auto font-mono">
        {visibleTree ? (
          <TreeNode
            item={visibleTree}
            depth={0}
            searchTerm={searchTerm}
            expandIds={expandIds}
            expanded={expanded}
            onToggle={toggleNode}
            selectedId={selected?.id}
            onSelect={setSelected}
          />
        ) : (
          <p className="text-xs text-muted-foreground">No file structure parsed.</p>
        )}
      </div>
    </div>
  );
}

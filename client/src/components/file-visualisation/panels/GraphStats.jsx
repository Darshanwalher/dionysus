import React from "react";
import {
  Layers,
  AlertTriangle,
  Radio,
  FileCode,
  Sparkles,
  Boxes,
  Network,
  Filter,
} from "lucide-react";

export default function GraphStats({
  mode = "architecture",
  stats = {},
  metadata = {},
  groups = [],
  activeGroup = "all",
  onGroupSelect,
  selectedFolder = "all",
  folders = [],
  onFolderChange,
  selectedExt = "all",
  extensions = [],
  onExtChange,
  showCircularOnly = false,
  onToggleCircularOnly,
}) {
  if (mode === "architecture") {
    return (
      <div className="flex items-center gap-2.5 px-3 py-1.5 border-b border-border bg-card/60 text-[10px] overflow-x-auto select-none flex-shrink-0">
        {/* Architectural Style */}
        <div className="flex items-center gap-1 font-mono text-muted-foreground flex-shrink-0">
          <Sparkles className="h-3 w-3 text-amber-500" />
          <span className="font-semibold text-foreground text-[11px]">
            {metadata.architecturalStyle || "Architecture"}
          </span>
        </div>

        <div className="h-3 w-px bg-border flex-shrink-0" />

        {/* Metrics */}
        <div className="flex items-center gap-2 text-muted-foreground font-mono flex-shrink-0">
          <span className="flex items-center gap-0.5">
            <Boxes className="h-2.5 w-2.5 text-sky-500" />
            <strong className="text-foreground">{stats.nodeCount || 0}</strong>
          </span>
          <span>·</span>
          <span className="flex items-center gap-0.5">
            <Layers className="h-2.5 w-2.5 text-indigo-500" />
            <strong className="text-foreground">{stats.groupCount || 0}</strong>
          </span>
          <span>·</span>
          <span className="flex items-center gap-0.5">
            <Network className="h-2.5 w-2.5 text-emerald-500" />
            <strong className="text-foreground">{stats.edgeCount || 0}</strong>
          </span>
        </div>

        {/* Group Filter Chips */}
        {groups && groups.length > 0 && (
          <>
            <div className="h-3 w-px bg-border flex-shrink-0 hidden md:block" />
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
              <button
                onClick={() => onGroupSelect && onGroupSelect("all")}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-all flex-shrink-0 cursor-pointer ${
                  activeGroup === "all"
                    ? "bg-foreground text-background font-semibold shadow-2xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                All
              </button>
              {groups.map((g) => (
                <button
                  key={g.id}
                  onClick={() => onGroupSelect && onGroupSelect(g.id)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-all flex-shrink-0 cursor-pointer ${
                    activeGroup === g.id
                      ? "bg-foreground text-background font-semibold shadow-2xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  {g.label || g.name || g.id}
                </button>
              ))}
            </div>
          </>
        )}

        {metadata.summary && (
          <span className="ml-auto text-[10px] text-muted-foreground truncate max-w-xs hidden xl:inline-block" title={metadata.summary}>
            {metadata.summary}
          </span>
        )}
      </div>
    );
  }

  // Dependency mode
  return (
    <div className="flex items-center gap-2.5 font-mono text-[10px] text-muted-foreground overflow-x-auto flex-wrap select-none">
      {/* Metrics */}
      <span className="flex items-center gap-0.5">
        <FileCode className="h-3 w-3 text-foreground" />
        <strong className="text-foreground">{stats.totalFiles || 0}</strong> files
      </span>
      <span>·</span>
      <span className="flex items-center gap-0.5">
        <Layers className="h-3 w-3 text-sky-500" />
        <strong className="text-foreground">{stats.totalDependencies || 0}</strong> deps
      </span>
      <span>·</span>
      <span className="flex items-center gap-0.5 text-rose-500 font-semibold">
        <AlertTriangle className="h-3 w-3" />
        {stats.circularDependencies || 0}
      </span>
      <span>·</span>
      <span className="flex items-center gap-0.5 text-muted-foreground">
        <Radio className="h-3 w-3" />
        {stats.isolatedFiles || 0}
      </span>

      {/* Directory Filter */}
      {folders && folders.length > 0 && (
        <>
          <div className="h-3 w-px bg-border hidden sm:block flex-shrink-0" />
          <div className="flex items-center gap-1 flex-shrink-0">
            <Filter className="h-2.5 w-2.5 text-muted-foreground" />
            <select
              value={selectedFolder}
              onChange={(e) => onFolderChange(e.target.value)}
              className="bg-card border border-border hover:border-foreground/30 rounded px-1.5 py-0.5 text-[10px] font-mono text-foreground focus:outline-none transition-colors"
            >
              <option value="all" className="bg-card text-foreground">All Folders</option>
              {folders.map((f) => (
                <option key={f} value={f} className="bg-card text-foreground">
                  {f}
                </option>
              ))}
            </select>
          </div>
        </>
      )}

      {/* Extension Filter */}
      {extensions && extensions.length > 0 && (
        <select
          value={selectedExt}
          onChange={(e) => onExtChange(e.target.value)}
          className="bg-card border border-border hover:border-foreground/30 rounded px-1.5 py-0.5 text-[10px] font-mono text-foreground focus:outline-none transition-colors flex-shrink-0"
        >
          <option value="all" className="bg-card text-foreground">All Ext</option>
          {extensions.map((ext) => (
            <option key={ext} value={ext} className="bg-card text-foreground">
              {ext}
            </option>
          ))}
        </select>
      )}

      {/* Circular dependency toggle */}
      {stats.circularDependencies > 0 && (
        <button
          onClick={onToggleCircularOnly}
          className={`ml-auto flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono border transition-all cursor-pointer ${
            showCircularOnly
              ? "bg-rose-500/15 text-rose-500 border-rose-500/30 font-semibold"
              : "border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
          }`}
        >
          <AlertTriangle className="h-2.5 w-2.5 text-rose-500" />
          {showCircularOnly ? "Cycles Only" : "Filter Cycles"}
        </button>
      )}
    </div>
  );
}

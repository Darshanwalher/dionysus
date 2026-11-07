import React from "react";
import { Button } from "@/components/ui/button";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Download,
  FileJson,
  RefreshCw,
  Search,
  ArrowDownUp,
  ArrowLeftRight,
  Map,
  X,
} from "lucide-react";

export default function GraphControls({
  zoom,
  onZoomIn,
  onZoomOut,
  onFitView,
  onResetView,
  direction = "TB",
  onToggleDirection,
  searchTerm = "",
  onSearchChange,
  showMinimap,
  onToggleMinimap,
  onExportSVG,
  onExportJSON,
  onRefresh,
  isLoading = false,
  placeholder = "Search nodes, symbols, paths...",
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border bg-card/90 backdrop-blur-md flex-shrink-0 select-none overflow-x-auto scrollbar-none">
      {/* Search Bar */}
      <div className="relative flex-1 min-w-[170px] max-w-xs">
        <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-8 pr-7 py-1 text-xs bg-secondary/80 focus:bg-background border border-border focus:border-foreground/30 rounded-md transition-colors text-foreground placeholder:text-muted-foreground focus:outline-none font-sans"
        />
        {searchTerm ? (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="h-3 w-3" />
          </button>
        ) : (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-mono text-muted-foreground border border-border rounded px-1 select-none pointer-events-none">
            /
          </span>
        )}
      </div>

      <div className="h-4 w-px bg-border flex-shrink-0" />

      {/* Zoom Controls */}
      <div className="flex items-center border border-border rounded-md p-0.5 bg-secondary/60">
        <Button variant="ghost" size="icon-sm" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={onZoomOut} title="Zoom Out">
          <ZoomOut className="h-3 w-3" />
        </Button>
        <span className="text-[10px] font-mono px-1.5 text-foreground min-w-[36px] text-center select-none font-semibold">
          {Math.round(zoom * 100)}%
        </span>
        <Button variant="ghost" size="icon-sm" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={onZoomIn} title="Zoom In">
          <ZoomIn className="h-3 w-3" />
        </Button>
        <div className="w-px h-3 bg-border mx-0.5" />
        <Button variant="ghost" size="icon-sm" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={onFitView} title="Fit Viewport">
          <Maximize2 className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="icon-sm" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={onResetView} title="Reset Position">
          <RotateCcw className="h-3 w-3" />
        </Button>
      </div>

      {/* Direction Toggle */}
      <div className="flex items-center p-0.5 rounded-md border border-border bg-secondary/60">
        <button
          onClick={() => onToggleDirection("TB")}
          className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
            direction === "TB"
              ? "bg-foreground text-background font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
          title="Top to Bottom (Vertical)"
        >
          <ArrowDownUp className="h-3 w-3" />
          <span className="hidden xl:inline">Vertical</span>
        </button>
        <button
          onClick={() => onToggleDirection("LR")}
          className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
            direction === "LR"
              ? "bg-foreground text-background font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
          title="Left to Right (Horizontal)"
        >
          <ArrowLeftRight className="h-3 w-3" />
          <span className="hidden xl:inline">Horizontal</span>
        </button>
      </div>

      {/* Minimap Toggle */}
      <Button
        variant="ghost"
        size="sm"
        className={`h-7 px-2.5 text-xs transition-colors ${
          showMinimap
            ? "bg-foreground text-background font-semibold hover:bg-foreground/90"
            : "text-muted-foreground hover:text-foreground border border-border"
        }`}
        onClick={onToggleMinimap}
        title="Toggle Minimap"
      >
        <Map className="h-3.5 w-3.5 mr-1.5" />
        <span className="hidden lg:inline">Minimap</span>
      </Button>

      {/* Refresh Graph */}
      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground border border-border"
        onClick={onRefresh}
        disabled={isLoading}
        title="Recompile graph from AST"
      >
        <RefreshCw className={`h-3 w-3 mr-1.5 ${isLoading ? "animate-spin text-foreground" : ""}`} />
        <span className="hidden lg:inline">Recompile</span>
      </Button>

      <div className="h-4 w-px bg-border flex-shrink-0" />

      {/* Export Controls */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2 text-xs font-mono"
          onClick={onExportSVG}
          title="Export vector SVG"
        >
          <Download className="h-3 w-3 mr-1" />
          SVG
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2 text-xs font-mono"
          onClick={onExportJSON}
          title="Export JSON graph schema"
        >
          <FileJson className="h-3 w-3 mr-1" />
          JSON
        </Button>
      </div>
    </div>
  );
}

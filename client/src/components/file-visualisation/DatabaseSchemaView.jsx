import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import TableEntityNode from "./nodes/TableEntityNode";
import PillFlowEdge from "./edges/PillFlowEdge";
import CanvasScrollbar from "./panels/CanvasScrollbar";
import { layoutSchemaDiagram, exportGraphAsJSON } from "@/lib/graphUtils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/components/theme/ThemeProvider";
import {
  Database,
  RefreshCw,
  AlertTriangle,
  Download,
  ArrowRightLeft,
  Search,
} from "lucide-react";

const nodeTypes = {
  tableEntityNode: TableEntityNode,
};

const edgeTypes = {
  pillFlowEdge: PillFlowEdge,
};

function DatabaseSchemaFlow({
  schemaData,
  _githubUrl,
  isLoading,
  _error,
  onRefresh,
}) {
  const reactFlowWrapper = useRef(null);
  const { fitView } = useReactFlow();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const [direction, setDirection] = useState("LR");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEntityId, setSelectedEntityId] = useState(null);
  const [showDiagnosticsPanel, setShowDiagnosticsPanel] = useState(true);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const entities = useMemo(() => schemaData?.entities || [], [schemaData?.entities]);
  const relations = useMemo(() => schemaData?.relations || [], [schemaData?.relations]);
  const summary = useMemo(
    () =>
      schemaData?.summary || {
        totalEntities: entities.length,
        totalRelations: relations.length,
        totalIndexes: 0,
        schemaHealthScore: 90,
        bottlenecksIdentified: 0,
      },
    [schemaData?.summary, entities.length, relations.length]
  );

  // Convert relations into styled PillFlowEdges
  const layoutResult = useMemo(() => {
    if (!entities || entities.length === 0) {
      return { nodes: [], edges: [] };
    }

    const { nodes: layoutedNodes } = layoutSchemaDiagram(entities, relations, direction);

    const layoutedEdges = relations.map((rel, index) => {
      return {
        id: rel.id || `rel_${rel.source}_${rel.target}_${index}`,
        source: rel.source,
        target: rel.target,
        type: "pillFlowEdge",
        animated: false,
        style: {
          stroke: isDark ? "#38bdf8" : "#0284c7",
          strokeWidth: 2,
        },
        data: {
          pillLabel: rel.type || "Ref",
          score: 1.0,
          edgeColor: isDark ? "#38bdf8" : "#0284c7",
          description: rel.description || `${rel.source}.${rel.sourceField} -> ${rel.target}.${rel.targetField}`,
        },
      };
    });

    return { nodes: layoutedNodes, edges: layoutedEdges };
  }, [entities, relations, direction, isDark]);

  // Synchronize layout results
  useEffect(() => {
    if (layoutResult.nodes.length > 0) {
      setNodes(layoutResult.nodes);
      setEdges(layoutResult.edges);
      setTimeout(() => fitView({ padding: 0.25, duration: 400 }), 50);
    }
  }, [layoutResult, fitView, setNodes, setEdges]);

  // Filter nodes on search
  const filteredNodes = useMemo(() => {
    if (!searchTerm.trim()) return nodes;
    const term = searchTerm.toLowerCase();
    return nodes.map((node) => {
      const matches =
        node.id.toLowerCase().includes(term) ||
        (node.data?.fields || []).some((f) => f.name.toLowerCase().includes(term));
      return {
        ...node,
        data: {
          ...node.data,
          isTargeted: matches,
        },
      };
    });
  }, [nodes, searchTerm]);

  // Collect all diagnostics across all entities
  const allDiagnostics = useMemo(() => {
    const list = [];
    entities.forEach((ent) => {
      (ent.diagnostics || []).forEach((diag) => {
        list.push({
          entityName: ent.name,
          ...diag,
        });
      });
    });
    return list;
  }, [entities]);

  const handleNodeClick = useCallback((_, node) => {
    setSelectedEntityId((prev) => (prev === node.id ? null : node.id));
  }, []);

  const handlePaneClick = useCallback(() => {
    setSelectedEntityId(null);
  }, []);

  const selectedEntity = useMemo(() => {
    return entities.find((e) => e.id === selectedEntityId) || null;
  }, [entities, selectedEntityId]);

  return (
    <div className="relative w-full h-full flex flex-col bg-background font-sans overflow-hidden">
      {/* ── Sub-header / Stats Bar ── */}
      <div className="h-10 px-4 border-b border-border bg-card/60 flex items-center justify-between text-xs shrink-0 select-none">
        {/* Left Stats */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-semibold text-foreground">
            <Database className="h-3.5 w-3.5 text-indigo-400" />
            <span>Schema Intelligence</span>
          </div>

          <div className="hidden sm:flex items-center gap-2 font-mono text-[11px] text-muted-foreground border-l border-border pl-3">
            <span>{summary.totalEntities} Collections</span>
            <span>•</span>
            <span>{summary.totalRelations} Relations</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              Health:
              <span
                className={`font-bold ${
                  summary.schemaHealthScore >= 80
                    ? "text-emerald-500"
                    : summary.schemaHealthScore >= 60
                    ? "text-amber-500"
                    : "text-red-500"
                }`}
              >
                {summary.schemaHealthScore}%
              </span>
            </span>
          </div>
        </div>

        {/* Right Search & Controls */}
        <div className="flex items-center gap-2">
          {/* Search table or field */}
          <div className="relative flex items-center">
            <Search className="absolute left-2 h-3 w-3 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Find entity or column..."
              className="h-6.5 pl-6 pr-2 text-[11px] rounded-md border border-border bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary w-40 sm:w-48"
            />
          </div>

          {/* Toggle Direction */}
          <button
            onClick={() => setDirection((prev) => (prev === "LR" ? "TB" : "LR"))}
            className="flex items-center gap-1 h-6.5 px-2 rounded-md border border-border bg-card hover:bg-secondary text-[11px] text-muted-foreground hover:text-foreground font-mono transition-colors cursor-pointer"
            title="Toggle Layout Direction"
          >
            <ArrowRightLeft className="h-3 w-3" />
            <span className="hidden sm:inline">{direction}</span>
          </button>

          {/* Diagnostics Panel Toggle */}
          <button
            onClick={() => setShowDiagnosticsPanel((prev) => !prev)}
            className={`flex items-center gap-1 h-6.5 px-2 rounded-md border text-[11px] font-mono transition-colors cursor-pointer ${
              allDiagnostics.length > 0
                ? "border-amber-500/30 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"
                : "border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <AlertTriangle className="h-3 w-3" />
            <span>Diagnostics ({allDiagnostics.length})</span>
          </button>

          {/* Export JSON */}
          <button
            onClick={() => exportGraphAsJSON(schemaData, "schema-intelligence.json")}
            className="flex items-center justify-center h-6.5 w-6.5 rounded-md border border-border bg-card hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Export Schema JSON"
          >
            <Download className="h-3 w-3" />
          </button>

          {/* Refresh Analysis */}
          <Button
            size="xs"
            variant="outline"
            className="h-6.5 text-[11px] gap-1 cursor-pointer font-semibold"
            onClick={onRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin text-primary" : ""}`} />
            <span className="hidden sm:inline">{isLoading ? "Analyzing..." : "Refresh"}</span>
          </Button>
        </div>
      </div>

      {/* ── Main Canvas Viewport ── */}
      <div className="flex-1 w-full h-full relative" ref={reactFlowWrapper}>
        {isLoading ? (
          <div className="absolute inset-0 z-40 bg-background/80 backdrop-blur-xs flex flex-col items-center justify-center gap-3">
            <div className="h-10 w-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
            <div className="text-center space-y-1">
              <p className="text-xs font-semibold text-foreground">
                Synthesizing Database Models & Relationships...
              </p>
              <p className="text-[11px] text-muted-foreground font-mono">
                Extracting foreign key constraints, indexes, and BSON performance diagnostics
              </p>
            </div>
          </div>
        ) : entities.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
            <div className="h-12 w-12 rounded-xl bg-secondary border border-border flex items-center justify-center mb-3">
              <Database className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-bold text-foreground">No Database Models Detected</h3>
            <p className="text-xs text-muted-foreground max-w-sm mt-1 leading-relaxed">
              We scanned the repository for Mongoose, Prisma, or TypeORM entities. Click refresh to perform a deep AST scan.
            </p>
            <Button size="sm" onClick={onRefresh} className="mt-4 gap-1.5 text-xs font-semibold">
              <RefreshCw className="h-3.5 w-3.5" /> Scan Database Schemas
            </Button>
          </div>
        ) : null}

        <ReactFlow
          nodes={filteredNodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          onPaneClick={handlePaneClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={{ padding: 0.25 }}
          zoomOnScroll={true}
          panOnScroll={false}
          minZoom={0.2}
          maxZoom={2.0}
          proOptions={{ hideAttribution: true }}
          className="bg-background"
        >
          <Background
            gap={24}
            size={1}
            color={isDark ? "rgba(255, 255, 255, 0.07)" : "rgba(0, 0, 0, 0.07)"}
          />
          <Controls
            className="!bg-card !border-border !shadow-sm !rounded-lg overflow-hidden"
            showInteractive={false}
          />
          <MiniMap
            zoomable
            pannable
            className="!bg-card !border-border !rounded-lg !shadow-md"
            nodeColor={() => (isDark ? "#6366f1" : "#4f46e5")}
            maskColor={isDark ? "rgba(0, 0, 0, 0.65)" : "rgba(255, 255, 255, 0.65)"}
          />
          <CanvasScrollbar reactFlowWrapperRef={reactFlowWrapper} />
        </ReactFlow>

        {/* ── Slide-over Diagnostics & Detail Panel ── */}
        {showDiagnosticsPanel && allDiagnostics.length > 0 && (
          <div className="absolute right-3 top-3 bottom-3 w-80 rounded-xl border border-border bg-card/95 backdrop-blur-md shadow-xl flex flex-col z-30 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-200">
            <div className="p-3 border-b border-border bg-secondary/50 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <span className="font-semibold text-xs text-foreground">
                  Performance Diagnostics
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-amber-500/10 text-amber-500 font-bold">
                  {allDiagnostics.length}
                </span>
              </div>
              <button
                onClick={() => setShowDiagnosticsPanel(false)}
                className="text-muted-foreground hover:text-foreground text-xs p-1 rounded"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 divide-y divide-border/50">
              {allDiagnostics.map((item, idx) => (
                <div key={idx} className="pt-2 first:pt-0 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-foreground">
                      {item.entityName}.{item.field}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-[9px] font-mono uppercase ${
                        item.type === "warning"
                          ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
                          : "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
                      }`}
                    >
                      {item.code || item.type}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {item.message}
                  </p>
                  {item.suggestion && (
                    <div className="text-[10px] font-mono bg-secondary/70 p-1.5 rounded border border-border/60 text-foreground/80">
                      💡 {item.suggestion}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Selected Entity Card Detail Drawer */}
        {selectedEntity && (
          <div className="absolute left-3 bottom-3 w-80 rounded-xl border border-border bg-card/95 backdrop-blur-md shadow-xl p-3 z-30 space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-indigo-400" />
                <span className="font-bold text-xs font-mono text-foreground">
                  {selectedEntity.name}
                </span>
              </div>
              <button
                onClick={() => setSelectedEntityId(null)}
                className="text-muted-foreground hover:text-foreground text-xs"
              >
                ✕
              </button>
            </div>

            {selectedEntity.description && (
              <p className="text-[11px] text-muted-foreground">{selectedEntity.description}</p>
            )}

            <div className="text-[10px] font-mono text-muted-foreground space-y-1 pt-1 border-t border-border">
              <div>Source: {selectedEntity.sourceFile}</div>
              <div>Columns: {selectedEntity.fields?.length || 0}</div>
              <div>
                Connected Relations:{" "}
                {relations.filter(
                  (r) => r.source === selectedEntity.id || r.target === selectedEntity.id
                ).length}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DatabaseSchemaView(props) {
  return (
    <ReactFlowProvider>
      <DatabaseSchemaFlow {...props} />
    </ReactFlowProvider>
  );
}

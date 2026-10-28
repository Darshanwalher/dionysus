import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchProject } from "@/store/slices/projectSlice";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FolderTree, Maximize2, Minimize2, Network, ListTree } from "lucide-react";
import { parseFileTree } from "@/lib/fileTree";
import FileTreeExplorer from "@/components/file-visualisation/FileTreeExplorer";
import ArchitectureMap from "@/components/file-visualisation/ArchitectureMap";
import PageHeader from "@/components/layout/PageHeader";

export default function FileVisualisation() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { currentProject, isLoading } = useSelector((state) => state.project);

  const [viewMode, setViewMode] = useState("tree");
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!currentProject) {
      dispatch(fetchProject(id));
    }
  }, [dispatch, id, currentProject]);

  const fileTree = useMemo(
    () => parseFileTree(currentProject?.mermaidGraph, currentProject?.name || "Repository"),
    [currentProject]
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64 bg-muted/40" />
        <Skeleton className="h-[600px] w-full rounded-xl bg-muted/30" />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${isFullscreen ? "fixed inset-0 z-50 bg-background p-6 overflow-auto" : ""}`}>
      <PageHeader
        icon={FolderTree}
        title="File Visualisation"
        description="Hierarchical directory explorer and folder-level architecture map"
        actions={
          <>
            {currentProject?.name && (
              <Badge variant="outline" className="border-gold/25 text-xs font-mono text-muted-foreground bg-background/50">
                {currentProject.name}
              </Badge>
            )}
          <div className="flex items-center p-1 rounded-lg border border-border/60 bg-card/60">
            <button
              onClick={() => setViewMode("tree")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === "tree"
                  ? "bg-muted text-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ListTree className="h-3.5 w-3.5" />
              Tree Explorer
            </button>
            <button
              onClick={() => setViewMode("diagram")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === "diagram"
                  ? "bg-muted text-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Network className="h-3.5 w-3.5" />
              Diagram View
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="h-9 w-9 p-0 border-border/60 text-muted-foreground hover:text-foreground"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
          </>
        }
      />

      {currentProject?.mermaidGraph ? (
        <Card className="glass-premium overflow-hidden">
          <CardContent className="p-0">
            {viewMode === "diagram" ? (
              <ArchitectureMap fileTree={fileTree} isFullscreen={isFullscreen} />
            ) : (
              <FileTreeExplorer fileTree={fileTree} isFullscreen={isFullscreen} />
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="glass border-border/50">
          <CardContent className="py-16 text-center">
            <FolderTree className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-60" />
            <h3 className="text-base font-semibold mb-1">No file tree available</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Connect a GitHub repository to generate the file tree and architecture diagram.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

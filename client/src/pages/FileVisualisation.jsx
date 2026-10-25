import { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchProject } from "@/store/slices/projectSlice";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FolderTree } from "lucide-react";
import mermaid from "mermaid";

mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
  themeVariables: {
    darkMode: true,
    background: "#0f172a",
    primaryColor: "#7c3aed",
    primaryTextColor: "#e2e8f0",
    primaryBorderColor: "#4c1d95",
    lineColor: "#475569",
    secondaryColor: "#1e293b",
    tertiaryColor: "#1e293b",
    fontSize: "14px",
  },
});

export default function FileVisualisation() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { currentProject, isLoading } = useSelector((state) => state.project);
  const mermaidRef = useRef(null);

  useEffect(() => {
    if (!currentProject) {
      dispatch(fetchProject(id));
    }
  }, [dispatch, id, currentProject]);

  useEffect(() => {
    const renderMermaid = async () => {
      if (mermaidRef.current && currentProject?.mermaidGraph) {
        mermaidRef.current.innerHTML = "";
        try {
          const { svg } = await mermaid.render(
            "file-tree-graph",
            currentProject.mermaidGraph
          );
          mermaidRef.current.innerHTML = svg;
        } catch (error) {
          console.error("Mermaid render error:", error);
          mermaidRef.current.innerHTML =
            '<p class="text-muted-foreground text-sm">Failed to render file tree diagram.</p>';
        }
      }
    };
    renderMermaid();
  }, [currentProject?.mermaidGraph]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FolderTree className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">File Visualisation</h1>
      </div>

      {currentProject?.mermaidGraph ? (
        <Card className="glass border-border/50 overflow-auto">
          <CardContent className="p-6 min-h-[400px]">
            <div
              ref={mermaidRef}
              className="flex justify-center items-center"
            />
          </CardContent>
        </Card>
      ) : (
        <Card className="glass border-border/50">
          <CardContent className="py-12 text-center">
            <FolderTree className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              No file tree available. Link a GitHub repository first to generate
              the file tree visualisation.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

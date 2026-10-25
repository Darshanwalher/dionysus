import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchProject, saveNote } from "@/store/slices/projectSlice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { BookText, Save } from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Button } from "@/components/ui/button";

// Debounce hook
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function Documentation() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { currentProject, isLoading } = useSelector((state) => state.project);
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState("");

  const editor = useEditor({
    extensions: [StarterKit],
    content: currentProject?.documentation || "<p>No documentation generated yet. Link a GitHub repository first.</p>",
    onUpdate: ({ editor }) => {
      setContent(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-invert max-w-none min-h-[400px] p-4 focus:outline-none",
      },
    },
  });

  useEffect(() => {
    if (!currentProject) {
      dispatch(fetchProject(id));
    }
  }, [dispatch, id, currentProject]);

  useEffect(() => {
    if (editor && currentProject?.documentation) {
      editor.commands.setContent(currentProject.documentation);
    }
  }, [currentProject?.documentation, editor]);

  const handleSave = async () => {
    setSaving(true);
    await dispatch(saveNote({ projectId: id, text: content }));
    setSaving(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookText className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Documentation</h1>
          {currentProject?.githubUrl && (
            <Badge variant="outline" className="text-green-400 border-green-400/30">
              AI Generated
            </Badge>
          )}
        </div>
        <Button onClick={handleSave} isLoading={saving} variant="outline">
          <Save className="h-4 w-4 mr-2" />
          Save
        </Button>
      </div>

      <Card className="glass border-border/50">
        <CardContent className="p-0">
          {/* TipTap Toolbar */}
          {editor && (
            <div className="flex items-center gap-1 p-2 border-b border-border flex-wrap">
              <button
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={`p-2 rounded text-sm hover:bg-accent transition-colors ${
                  editor.isActive("bold") ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                }`}
              >
                <strong>B</strong>
              </button>
              <button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={`p-2 rounded text-sm hover:bg-accent transition-colors ${
                  editor.isActive("italic") ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                }`}
              >
                <em>I</em>
              </button>
              <button
                onClick={() => editor.chain().focus().toggleStrike().run()}
                className={`p-2 rounded text-sm hover:bg-accent transition-colors ${
                  editor.isActive("strike") ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                }`}
              >
                <s>S</s>
              </button>
              <div className="w-px h-6 bg-border mx-1" />
              <button
                onClick={() =>
                  editor.chain().focus().toggleHeading({ level: 1 }).run()
                }
                className={`p-2 rounded text-sm hover:bg-accent transition-colors ${
                  editor.isActive("heading", { level: 1 }) ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                }`}
              >
                H1
              </button>
              <button
                onClick={() =>
                  editor.chain().focus().toggleHeading({ level: 2 }).run()
                }
                className={`p-2 rounded text-sm hover:bg-accent transition-colors ${
                  editor.isActive("heading", { level: 2 }) ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                }`}
              >
                H2
              </button>
              <button
                onClick={() =>
                  editor.chain().focus().toggleHeading({ level: 3 }).run()
                }
                className={`p-2 rounded text-sm hover:bg-accent transition-colors ${
                  editor.isActive("heading", { level: 3 }) ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                }`}
              >
                H3
              </button>
              <div className="w-px h-6 bg-border mx-1" />
              <button
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={`p-2 rounded text-sm hover:bg-accent transition-colors ${
                  editor.isActive("bulletList") ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                }`}
              >
                • List
              </button>
              <button
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                className={`p-2 rounded text-sm hover:bg-accent transition-colors ${
                  editor.isActive("codeBlock") ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                }`}
              >
                {"</>"}
              </button>
            </div>
          )}
          <EditorContent editor={editor} />
        </CardContent>
      </Card>
    </div>
  );
}

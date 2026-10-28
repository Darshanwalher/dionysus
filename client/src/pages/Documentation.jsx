import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchProject, saveNote } from "@/store/slices/projectSlice";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  BookText,
  Save,
  BookOpen,
  Rocket,
  FolderGit2,
  Code2,
  Package,
  Hammer,
  TestTube2,
  Users,
  AlertCircle,
  GitBranch,
  Workflow,
  FileText,
  Copy,
  Check,
  Clock,
  FileCode,
  ExternalLink,
} from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import PageHeader from "@/components/layout/PageHeader";

const SECTIONS = [
  { name: "Introduction", icon: BookOpen },
  { name: "Getting Started", icon: Rocket },
  { name: "Repository", icon: FolderGit2 },
  { name: "Coding Standards", icon: Code2 },
  { name: "Dependencies", icon: Package },
  { name: "Building and Compiling", icon: Hammer },
  { name: "Testing", icon: TestTube2 },
  { name: "Contributing", icon: Users },
  { name: "Issues", icon: AlertCircle },
  { name: "Version Control", icon: GitBranch },
  { name: "CI/CD", icon: Workflow },
  { name: "Documentation", icon: FileText },
];

export default function Documentation() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { currentProject, isLoading } = useSelector((state) => state.project);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeSection, setActiveSection] = useState("Introduction");
  const [content, setContent] = useState("");

  const editor = useEditor({
    extensions: [StarterKit],
    content:
      currentProject?.documentation ||
      "<p>No documentation generated yet. Link a GitHub repository first.</p>",
    onUpdate: ({ editor }) => {
      setContent(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose max-w-none min-h-[500px] p-6 focus:outline-none focus:ring-0 leading-relaxed",
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
      setContent(currentProject.documentation);
    }
  }, [currentProject?.documentation, editor]);

  // Calculate word count & estimated reading time
  const stats = useMemo(() => {
    const text = content.replace(/<[^>]*>/g, " ").trim();
    const words = text ? text.split(/\s+/).length : 0;
    const minutes = Math.max(1, Math.ceil(words / 200));
    return { words, minutes };
  }, [content]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await dispatch(saveNote({ projectId: id, text: content })).unwrap();
      toast.success("Documentation saved successfully!");
    } catch {
      toast.error("Failed to save documentation");
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = () => {
    const text = content.replace(/<[^>]*>/g, "");
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Documentation copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const scrollToSection = (sectionName) => {
    setActiveSection(sectionName);
    const normalized = sectionName.toLowerCase().replace(/ /g, "-");
    const editorEl = document.querySelector(".tiptap");
    if (!editorEl) return;

    // Search for matching h2 element by text or id
    const headings = editorEl.querySelectorAll("h2");
    for (const h of headings) {
      if (
        h.id === normalized ||
        h.textContent.toLowerCase().includes(sectionName.toLowerCase())
      ) {
        h.scrollIntoView({ behavior: "smooth", block: "start" });
        h.classList.add("bg-primary/10", "transition-colors");
        setTimeout(() => h.classList.remove("bg-primary/10"), 1500);
        break;
      }
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Skeleton className="h-96 md:col-span-1 rounded-xl" />
          <Skeleton className="h-96 md:col-span-3 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={BookText}
        title={currentProject?.name ? `${currentProject.name} Documentation` : "Documentation"}
        description="Technical onboarding, architecture and codebase manual"
        actions={
          <>
            {currentProject?.githubUrl && (
              <Badge variant="outline" className="text-primary border-gold/30 bg-primary/5">
                AI Generated
              </Badge>
            )}
          {/* Reading stats */}
          <div className="hidden lg:flex items-center gap-3 text-xs text-muted-foreground mr-2">
            <span className="flex items-center gap-1">
              <FileCode className="h-3.5 w-3.5" />
              {stats.words.toLocaleString()} words
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {stats.minutes} min read
            </span>
          </div>

          <Button onClick={handleCopy} variant="outline" size="sm" className="h-9">
            {copied ? (
              <Check className="h-4 w-4 mr-1.5 text-green-400" />
            ) : (
              <Copy className="h-4 w-4 mr-1.5" />
            )}
            Copy
          </Button>

          <Button onClick={handleSave} isLoading={saving} size="sm" className="h-9">
            <Save className="h-4 w-4 mr-1.5" />
            Save Changes
          </Button>
          </>
        }
      />

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Sticky Table of Contents */}
        <div className="lg:col-span-3 sticky top-4 space-y-3">
          <Card className="glass border-border/50">
            <div className="p-3.5 border-b border-border/50 flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Table of Contents
              </h2>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                {SECTIONS.length} sections
              </span>
            </div>
            <CardContent className="p-2 space-y-0.5 max-h-[calc(100vh-220px)] overflow-y-auto">
              {SECTIONS.map((sec) => {
                const Icon = sec.icon;
                const isActive = activeSection === sec.name;
                return (
                  <button
                    key={sec.name}
                    onClick={() => scrollToSection(sec.name)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all text-left group ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 flex-shrink-0 transition-transform group-hover:scale-110 ${
                        isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary"
                      }`}
                    />
                    <span className="truncate">{sec.name}</span>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          {currentProject?.githubUrl && (
            <a
              href={currentProject.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-xl border border-border/40 bg-card/40 hover:bg-card/70 transition-colors text-xs text-muted-foreground hover:text-foreground"
            >
              <span className="truncate font-mono">View GitHub Repo</span>
              <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
            </a>
          )}
        </div>

        {/* Right Editor Area */}
        <div className="lg:col-span-9">
          <Card className="glass-premium overflow-hidden">
            {/* Formatting Toolbar */}
            {editor && (
              <div className="flex items-center gap-1 p-2.5 border-b border-border/50 bg-card/60 backdrop-blur-md flex-wrap sticky top-0 z-10">
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleBold().run()}
                  className={`px-2.5 py-1.5 rounded text-xs font-bold transition-colors ${
                    editor.isActive("bold")
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                  title="Bold"
                >
                  B
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                  className={`px-2.5 py-1.5 rounded text-xs italic font-serif transition-colors ${
                    editor.isActive("italic")
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                  title="Italic"
                >
                  I
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleStrike().run()}
                  className={`px-2.5 py-1.5 rounded text-xs line-through transition-colors ${
                    editor.isActive("strike")
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                  title="Strikethrough"
                >
                  S
                </button>

                <div className="w-px h-5 bg-border/60 mx-1.5" />

                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                  className={`px-2.5 py-1.5 rounded text-xs font-semibold transition-colors ${
                    editor.isActive("heading", { level: 1 })
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  H1
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                  className={`px-2.5 py-1.5 rounded text-xs font-semibold transition-colors ${
                    editor.isActive("heading", { level: 2 })
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  H2
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                  className={`px-2.5 py-1.5 rounded text-xs font-semibold transition-colors ${
                    editor.isActive("heading", { level: 3 })
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  H3
                </button>

                <div className="w-px h-5 bg-border/60 mx-1.5" />

                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleBulletList().run()}
                  className={`px-2.5 py-1.5 rounded text-xs transition-colors ${
                    editor.isActive("bulletList")
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  • Bullet List
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleOrderedList().run()}
                  className={`px-2.5 py-1.5 rounded text-xs transition-colors ${
                    editor.isActive("orderedList")
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  1. Numbered List
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                  className={`px-2.5 py-1.5 rounded text-xs font-mono transition-colors ${
                    editor.isActive("codeBlock")
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  {"</>"} Code Block
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleBlockquote().run()}
                  className={`px-2.5 py-1.5 rounded text-xs transition-colors ${
                    editor.isActive("blockquote")
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  Quote
                </button>
              </div>
            )}

            {/* Document Body */}
            <CardContent className="p-0">
              <EditorContent editor={editor} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

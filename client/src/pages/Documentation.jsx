import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import gsap from "gsap";
import { fetchProject, saveNote } from "@/store/slices/projectSlice";
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
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Code,
  Quote,
  Undo2,
  Redo2,
  Sparkles,
} from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import PageHeader from "@/components/layout/PageHeader";
import { CountUp, FadeIn, Pop, prefersReduced } from "@/components/motion";
import { scrollToTarget } from "@/components/motion/SmoothScroll";
import { cn } from "@/lib/utils";

/* Shown only when the document has no headings yet */
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

/** Toolbar button */
function Tb({ active, onClick, title, disabled, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      aria-pressed={active}
      disabled={disabled}
      className={cn(
        "inline-flex h-8 min-w-8 cursor-pointer items-center justify-center gap-1 rounded-lg px-2 text-xs font-medium transition-all duration-150 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40",
        active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}
const Sep = () => <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />;

export default function Documentation() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { currentProject, isLoading } = useSelector((state) => state.project);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [content, setContent] = useState("");
  const [savedHtml, setSavedHtml] = useState("");
  const [toc, setToc] = useState([]);
  const [activeIdx, setActiveIdx] = useState(0);

  const docRef = useRef(null);
  const listRef = useRef(null);
  const scrollBoxRef = useRef(null);
  const indRef = useRef(null);
  const progRef = useRef(null);
  const pctRef = useRef(null);
  const placed = useRef(false);
  const itemsShown = useRef(false);
  const saveRef = useRef(null);

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
          "prose mx-auto max-w-3xl min-h-[560px] px-6 py-8 sm:px-10 focus:outline-none focus:ring-0 leading-relaxed",
      },
    },
  });

  useEffect(() => {
    if (!currentProject) {
      dispatch(fetchProject(id));
    }
  }, [dispatch, id, currentProject]);

  // Load the stored document into the editor, then remember its normalised HTML as "saved"
  useEffect(() => {
    if (editor && currentProject?.documentation) {
      editor.commands.setContent(currentProject.documentation);
      const html = editor.getHTML();
      setContent(html);
      setSavedHtml(html);
    }
  }, [currentProject?.documentation, editor]);

  const hasDoc = Boolean(currentProject?.documentation);
  const dirty = Boolean(content) && content !== savedHtml;

  // Reading stats
  const stats = useMemo(() => {
    const text = content.replace(/<[^>]*>/g, " ").trim();
    const words = text ? text.split(/\s+/).length : 0;
    const minutes = Math.max(1, Math.ceil(words / 200));
    return { words, minutes };
  }, [content]);

  // Table of contents built from the document's real headings
  useEffect(() => {
    if (!editor) return;
    const t = setTimeout(() => {
      const hs = editor.view.dom.querySelectorAll("h1,h2,h3");
      setToc([...hs].map((h, index) => ({ index, text: h.textContent.trim(), level: Number(h.tagName[1]) })).filter((x) => x.text));
    }, 150);
    return () => clearTimeout(t);
  }, [content, editor]);

  const items = useMemo(
    () => (toc.length ? toc : SECTIONS.map((s, index) => ({ index, text: s.name, icon: s.icon, level: 2, fallback: true }))),
    [toc]
  );

  // Scroll-spy: highlight the heading you are reading
  useEffect(() => {
    if (!editor || !toc.length) return;
    let raf;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const hs = editor.view.dom.querySelectorAll("h1,h2,h3");
        let cur = 0;
        hs.forEach((h, i) => {
          if (h.getBoundingClientRect().top <= 140) cur = i;
        });
        setActiveIdx(cur);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, [editor, toc]);

  // Reading progress through the document
  useEffect(() => {
    if (!progRef.current) return;
    const set = gsap.quickSetter(progRef.current, "scaleX");
    let raf;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const card = docRef.current;
        if (!card) return;
        const r = card.getBoundingClientRect();
        const total = r.height - window.innerHeight + 160;
        const p = total > 0 ? Math.min(1, Math.max(0, (160 - r.top) / total)) : 0;
        set(p);
        if (pctRef.current) pctRef.current.textContent = `${Math.round(p * 100)}% read`;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [isLoading]);

  // Active-item highlight glides along the contents list, and the list follows it
  useLayoutEffect(() => {
    const w = listRef.current;
    const i = indRef.current;
    if (!w || !i) return;
    const el = w.querySelector('[data-toc-active="true"]');
    if (!el) {
      gsap.set(i, { opacity: 0 });
      return;
    }
    const vars = { y: el.offsetTop, height: el.offsetHeight, opacity: 1 };
    gsap.killTweensOf(i);
    if (!placed.current || prefersReduced()) gsap.set(i, vars);
    else gsap.to(i, { ...vars, duration: 0.35, ease: "power3.out" });
    placed.current = true;

    const box = scrollBoxRef.current;
    if (box) {
      if (el.offsetTop < box.scrollTop + 8) box.scrollTop = Math.max(0, el.offsetTop - 8);
      else if (el.offsetTop + el.offsetHeight > box.scrollTop + box.clientHeight - 8)
        box.scrollTop = el.offsetTop + el.offsetHeight - box.clientHeight + 8;
    }
  }, [activeIdx, items.length]);

  // Contents items stagger in once, the first time they appear
  useLayoutEffect(() => {
    if (!items.length || itemsShown.current || !listRef.current || prefersReduced()) return;
    itemsShown.current = true;
    const ctx = gsap.context(() => {
      gsap.from("[data-toc-item]", { opacity: 0, x: -10, duration: 0.4, stagger: 0.03, ease: "power3.out", delay: 0.25 });
    }, listRef);
    return () => {
      ctx.revert();
      itemsShown.current = false;
    };
  }, [items.length > 0]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await dispatch(saveNote({ projectId: id, text: content })).unwrap();
      setSavedHtml(content);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2200);
      toast.success("Documentation saved successfully!");
    } catch {
      toast.error("Failed to save documentation");
    } finally {
      setSaving(false);
    }
  };
  saveRef.current = () => {
    if (dirty && !saving) handleSave();
  };

  // Ctrl/Cmd + S saves
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        saveRef.current?.();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleCopy = () => {
    const text = content.replace(/<[^>]*>/g, "");
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Documentation copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const jumpTo = (item, position) => {
    const dom = editor?.view?.dom;
    if (!dom) return;
    const all = [...dom.querySelectorAll("h1,h2,h3")];
    const target = item.fallback
      ? all.find((h) => h.textContent.toLowerCase().includes(item.text.toLowerCase()))
      : all[item.index];
    if (!target) {
      toast("That section isn't in this document yet");
      return;
    }
    setActiveIdx(position);
    scrollToTarget(target);
    if (!prefersReduced()) {
      gsap.fromTo(
        target,
        { backgroundColor: "rgba(255,104,69,0.28)" },
        { backgroundColor: "rgba(255,104,69,0)", duration: 1.5, ease: "power2.out", clearProps: "backgroundColor" }
      );
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <Skeleton className="h-12 w-72" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <Skeleton className="h-96 rounded-2xl lg:col-span-3" />
          <Skeleton className="h-[34rem] rounded-2xl lg:col-span-9" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <PageHeader
        icon={BookText}
        title={currentProject?.name ? `${currentProject.name} documentation` : "Documentation"}
        description="Technical onboarding, architecture and codebase manual."
        actions={
          <>
            <Button onClick={handleCopy} variant="outline" size="sm" className="h-8 gap-1.5 text-xs font-semibold">
              {copied ? <Pop><Check className="h-3.5 w-3.5 text-primary" /></Pop> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </Button>
            <Button onClick={handleSave} isLoading={saving} disabled={!dirty} size="sm" className="h-8 gap-1.5 text-xs font-semibold">
              <Save className="h-3.5 w-3.5" />
              Save changes
            </Button>
          </>
        }
      />

      {!hasDoc && (
        <FadeIn>
          <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-border bg-card/60 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Sparkles className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-foreground">No documentation generated yet</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Link a GitHub repository to generate it automatically, or start writing below.
                </p>
              </div>
            </div>
            <Link to={`/projects/${id}`} className="shrink-0 text-xs font-semibold text-primary hover:underline">
              Go to project home
            </Link>
          </div>
        </FadeIn>
      )}

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {/* ─── Contents ─────────────────────────────────────── */}
        <aside className="lg:sticky lg:top-16 lg:col-span-3">
          <FadeIn delay={0.05} className="space-y-3">
            <section className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="border-b border-border px-4 py-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-[13px] font-bold text-foreground">On this page</h2>
                  <span className="text-[11px] text-muted-foreground">
                    {items.length} section{items.length === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="mt-2.5 flex items-center gap-2">
                  <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-secondary">
                    <div ref={progRef} className="h-full origin-left rounded-full bg-highlight" style={{ transform: "scaleX(0)" }} />
                  </div>
                  <span ref={pctRef} className="w-14 text-right text-[11px] tabular-nums text-muted-foreground">
                    0% read
                  </span>
                </div>
              </div>

              <div ref={scrollBoxRef} data-lenis-prevent className="max-h-[calc(100vh-17rem)] overflow-y-auto p-2">
                <div ref={listRef} className="relative">
                  <span
                    ref={indRef}
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 top-0 rounded-lg bg-secondary"
                    style={{ opacity: 0 }}
                  >
                    <span className="absolute bottom-2 left-0 top-2 w-[3px] rounded-r-full bg-highlight" />
                  </span>

                  {items.map((item, pos) => {
                    const Icon = item.icon;
                    const active = pos === activeIdx;
                    return (
                      <button
                        key={`${item.text}-${pos}`}
                        type="button"
                        data-toc-item
                        data-toc-active={active}
                        onClick={() => jumpTo(item, pos)}
                        className={cn(
                          "relative z-10 flex w-full cursor-pointer items-center gap-2.5 rounded-lg py-2 pr-3 text-left text-[13px] transition-colors",
                          item.level === 3 ? "pl-8 text-xs" : item.level === 2 ? "pl-4" : "pl-3 font-semibold",
                          active ? "font-semibold text-foreground" : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {Icon && <Icon className={cn("h-3.5 w-3.5 shrink-0", active && "text-primary")} />}
                        <span className="truncate">{item.text}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            {currentProject?.githubUrl && (
              <a
                href={currentProject.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between rounded-xl border border-border bg-card px-3.5 py-3 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                <span className="truncate font-mono">View GitHub repo</span>
                <ExternalLink className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>
            )}
          </FadeIn>
        </aside>

        {/* ─── Document ─────────────────────────────────────── */}
        <div className="lg:col-span-9">
          <FadeIn delay={0.12}>
            <section ref={docRef} className="rounded-2xl border border-border bg-card">
              {/* Meta bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3">
                <div className="flex items-center gap-2">
                  {currentProject?.githubUrl && (
                    <Badge variant="outline" className="border-primary/20 bg-primary/5 text-[11px] text-primary">
                      AI generated
                    </Badge>
                  )}
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    {dirty ? (
                      <>
                        <span className="h-1.5 w-1.5 rounded-full bg-highlight animate-pulse-dot" />
                        Unsaved changes
                      </>
                    ) : justSaved ? (
                      <Pop className="gap-1.5">
                        <Check className="h-3.5 w-3.5 text-accent-emerald" />
                        <span className="text-accent-emerald">Saved</span>
                      </Pop>
                    ) : (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        All changes saved
                      </>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <FileCode className="h-3.5 w-3.5" />
                    <span className="tabular-nums">
                      <CountUp value={stats.words} />
                    </span>{" "}
                    words
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {stats.minutes} min read
                  </span>
                </div>
              </div>

              {/* Formatting toolbar */}
              {editor && (
                <div className="sticky top-12 z-10 flex flex-wrap items-center gap-0.5 border-b border-border bg-card/95 px-3 py-2">
                  <Tb title="Undo" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
                    <Undo2 className="h-4 w-4" />
                  </Tb>
                  <Tb title="Redo" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
                    <Redo2 className="h-4 w-4" />
                  </Tb>
                  <Sep />
                  <Tb title="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
                    <Bold className="h-4 w-4" />
                  </Tb>
                  <Tb title="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
                    <Italic className="h-4 w-4" />
                  </Tb>
                  <Tb title="Strikethrough" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
                    <Strikethrough className="h-4 w-4" />
                  </Tb>
                  <Sep />
                  <Tb title="Heading 1" active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
                    <Heading1 className="h-4 w-4" />
                  </Tb>
                  <Tb title="Heading 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
                    <Heading2 className="h-4 w-4" />
                  </Tb>
                  <Tb title="Heading 3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
                    <Heading3 className="h-4 w-4" />
                  </Tb>
                  <Sep />
                  <Tb title="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
                    <List className="h-4 w-4" />
                  </Tb>
                  <Tb title="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
                    <ListOrdered className="h-4 w-4" />
                  </Tb>
                  <Tb title="Code block" active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
                    <Code className="h-4 w-4" />
                  </Tb>
                  <Tb title="Quote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
                    <Quote className="h-4 w-4" />
                  </Tb>
                  <span className="ml-auto hidden items-center gap-1 text-[11px] text-muted-foreground md:inline-flex">
                    <kbd>Ctrl</kbd>
                    <kbd>S</kbd>
                    to save
                  </span>
                </div>
              )}

              {/* Document body */}
              <EditorContent editor={editor} />
            </section>
          </FadeIn>
        </div>
      </div>
    </div>
  );
}
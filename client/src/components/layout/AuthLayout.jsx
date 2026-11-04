import { Link } from "react-router-dom";
import { BookText, FileQuestion, Presentation, FolderTree, GitBranch, Zap, ArrowLeft } from "lucide-react";
import ThemeToggle from "@/components/theme/ThemeToggle";

const CAPABILITIES = [
  { icon: GitBranch, label: "Repository commits & structure tracking" },
  { icon: FolderTree, label: "Deterministic architecture & dependency graphs" },
  { icon: Presentation, label: "500 MB meeting audio transcription & chapters" },
  { icon: FileQuestion, label: "Pinecone vector Q&A with source citations" },
  { icon: BookText, label: "Distraction-free living technical documentation" },
];

export default function AuthLayout({
  title,
  description,
  children,
  footer,
}) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Left Editorial Panel */}
        <aside className="hidden lg:flex flex-col justify-between border-r border-border bg-card p-10 xl:p-12">
          {/* Brand & Nav */}
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="icon-tile h-7 w-7 rounded">
                <Zap className="h-4 w-4" />
              </div>
              <span className="font-semibold text-sm tracking-tight text-foreground">
                Dionysus
              </span>
            </Link>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              <ArrowLeft className="h-3 w-3" />
              Back to Home
            </Link>
          </div>

          {/* Central Message */}
          <div className="max-w-md space-y-6">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-primary font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Developer Intelligence Platform
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground leading-tight">
              Understand your codebase. Build with confidence.
            </h1>
            <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground">
              Dionysus connects code repositories, architecture graphs, technical documentation, and meeting audio in one unified engineering workspace.
            </p>

            <ul className="space-y-3 pt-2">
              {CAPABILITIES.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-3 text-xs text-muted-foreground">
                  <div className="h-6 w-6 rounded border border-border bg-secondary flex items-center justify-center text-primary shrink-0">
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <span>{label}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Footer Note */}
          <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
            <span>Obsidian Slate &amp; Alabaster UI</span>
            <span>v2.0</span>
          </div>
        </aside>

        {/* Right Form Panel */}
        <main className="flex flex-col justify-between p-6 sm:p-10 lg:p-12">
          {/* Mobile Header */}
          <div className="flex items-center justify-between lg:hidden mb-8">
            <Link to="/" className="flex items-center gap-2">
              <div className="icon-tile h-7 w-7 rounded">
                <Zap className="h-3.5 w-3.5" />
              </div>
              <span className="font-semibold text-sm text-foreground">Dionysus</span>
            </Link>
            <div className="flex items-center gap-2">
              <ThemeToggle className="h-8 w-8" />
              <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">
                Home
              </Link>
            </div>
          </div>

          <div className="hidden lg:flex justify-end">
            <ThemeToggle className="h-8 w-8" />
          </div>

          {/* Form Card */}
          <div className="flex flex-1 items-center justify-center py-8">
            <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6 sm:p-7 shadow-xs space-y-5 animate-fade-up">
              <div className="space-y-1">
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  {title}
                </h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {description}
                </p>
              </div>
              {children}
              {footer ? <div className="pt-2 text-center text-xs">{footer}</div> : null}
            </div>
          </div>

          <div className="text-center text-[11px] text-muted-foreground font-mono">
            Secure token auth with bcrypt &amp; JWT
          </div>
        </main>
      </div>
    </div>
  );
}

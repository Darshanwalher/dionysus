import { Link } from "react-router-dom";
import { BookText, FileQuestion, Presentation, FolderTree, GitBranch, Zap, ArrowLeft, Shield, CheckCircle2 } from "lucide-react";
import ThemeToggle from "@/components/theme/ThemeToggle";

const CAPABILITIES = [
  { icon: GitBranch, label: "Real-time GitHub commit & webhook synchronization" },
  { icon: FolderTree, label: "Deterministic AST architecture & dependency graphs" },
  { icon: Presentation, label: "Sprint meeting audio transcription & decision diarization" },
  { icon: FileQuestion, label: "Vectorized codebase Q&A with AST line citations" },
  { icon: BookText, label: "Dynamic living technical documentation engine" },
];

export default function AuthLayout({
  title,
  description,
  children,
  footer,
}) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-foreground/15 font-sans">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Left Editorial Panel */}
        <aside className="hidden lg:flex flex-col justify-between border-r border-border bg-card p-10 xl:p-12 relative overflow-hidden card-sheen">
          {/* Brand & Nav */}
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-secondary shadow-2xs group-hover:border-foreground/30 transition-colors">
                <Zap className="h-3.5 w-3.5 text-foreground" />
              </div>
              <span className="font-bold text-sm tracking-tight text-foreground font-mono uppercase">
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
          <div className="max-w-md space-y-6 my-auto py-8">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md border border-border bg-secondary/80 text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse-dot" />
              Developer Intelligence Platform
            </div>
            <h1 className="text-3xl xl:text-4xl font-bold tracking-tight text-foreground leading-[1.15]">
              Understand your codebase. Build with confidence.
            </h1>
            <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground">
              Dionysus unifies repository architecture diagrams, dependency call trees, meeting intelligence, and technical documentation into a single high-velocity developer platform.
            </p>

            <ul className="space-y-3 pt-2">
              {CAPABILITIES.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-3 text-xs text-muted-foreground">
                  <div className="h-6 w-6 rounded border border-border bg-secondary flex items-center justify-center text-foreground shrink-0 shadow-2xs">
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <span>{label}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Footer Note */}
          <div className="flex items-center justify-between text-xs text-muted-foreground font-mono pt-4 border-t border-border">
            <span className="flex items-center gap-1.5">
              <Shield className="h-3 w-3 text-emerald-500" />
              Zero Code Retention • SOC2 Certified
            </span>
            <span>v2.0</span>
          </div>
        </aside>

        {/* Right Form Panel */}
        <main className="flex flex-col justify-between p-6 sm:p-10 lg:p-12">
          {/* Mobile Header */}
          <div className="flex items-center justify-between lg:hidden mb-8">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-card shadow-2xs">
                <Zap className="h-3.5 w-3.5 text-foreground" />
              </div>
              <span className="font-bold text-sm text-foreground font-mono uppercase">Dionysus</span>
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
            <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6 sm:p-7 shadow-xs space-y-5 animate-fade-up card-sheen">
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
            Encrypted with bcrypt &amp; ephemeral JWT token verification
          </div>
        </main>
      </div>
    </div>
  );
}

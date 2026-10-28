import { BookText, FileQuestion, Presentation, Zap } from "lucide-react";
import Atmosphere from "@/components/theme/Atmosphere";
import ThemeToggle from "@/components/theme/ThemeToggle";

const CAPABILITIES = [
  { icon: BookText, label: "Living documentation" },
  { icon: FileQuestion, label: "Codebase Q&A" },
  { icon: Presentation, label: "Meeting intelligence" },
];

export default function AuthLayout({
  title,
  description,
  children,
  footer,
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <Atmosphere spotlight className="fixed inset-0" />

      <div className="relative z-10 grid min-h-screen lg:grid-cols-2">
        <aside className="relative hidden flex-col justify-between border-r border-sidebar-border/80 p-10 lg:flex">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="icon-tile">
                <Zap className="h-5 w-5" />
              </div>
              <span className="text-lg font-semibold tracking-tight gradient-text">
                Dionysus
              </span>
            </div>
            <ThemeToggle className="h-9 w-9 text-muted-foreground hover:text-foreground" />
          </div>

          <div className="max-w-md space-y-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
              Developer collaboration
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-foreground">
              Intelligence for the repositories you already ship.
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Dionysus turns commits, docs, and meeting audio into a quiet
              operating layer for your team — search, summarise, and stay
              oriented without leaving the repo.
            </p>
            <div className="gold-line" />
            <ul className="space-y-3">
              {CAPABILITIES.map(({ icon: Icon, label }) => (
                <li
                  key={label}
                  className="flex items-center gap-3 text-sm text-muted-foreground"
                >
                  <span className="icon-tile h-8 w-8 rounded-lg">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  {label}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-muted-foreground/80">
            Editorial dark workspace · gold &amp; violet accents
          </p>
        </aside>

        <main className="relative flex flex-col px-4 py-8 sm:px-8 lg:px-12">
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <div className="flex items-center gap-2">
              <div className="icon-tile h-9 w-9">
                <Zap className="h-4 w-4" />
              </div>
              <span className="font-semibold gradient-text">Dionysus</span>
            </div>
            <ThemeToggle className="h-9 w-9 text-muted-foreground hover:text-foreground" />
          </div>

          <div className="flex flex-1 items-center justify-center">
            <div className="glass-premium animate-fade-up w-full max-w-md rounded-2xl p-7 sm:p-8">
              <div className="mb-6 space-y-1.5">
                <h2 className="text-2xl font-semibold tracking-tight gradient-text">
                  {title}
                </h2>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
              {children}
              {footer ? <div className="mt-6 text-center">{footer}</div> : null}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

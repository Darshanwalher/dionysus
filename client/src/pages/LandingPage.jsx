import { useState } from "react";
import { Link } from "react-router-dom";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Zap,
  ArrowRight,
  GitBranch,
  FolderTree,
  Presentation,
  BookText,
  FileQuestion,
  CheckCircle2,
} from "lucide-react";

export default function LandingPage() {
  const [activePreviewTab, setActivePreviewTab] = useState("architecture");

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20">
      {/* ─── Sticky Navigation Bar ──────────────────────────────────── */}
      <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="icon-tile h-7.5 w-7.5 rounded-md">
              <Zap className="h-4 w-4" />
            </div>
            <span className="font-semibold text-sm sm:text-base tracking-tight text-foreground">
              Dionysus
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-muted-foreground">
            <button
              onClick={() => scrollToSection("product")}
              className="hover:text-foreground transition-colors cursor-pointer"
            >
              Product
            </button>
            <button
              onClick={() => scrollToSection("features")}
              className="hover:text-foreground transition-colors cursor-pointer"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection("architecture")}
              className="hover:text-foreground transition-colors cursor-pointer"
            >
              Architecture
            </button>
            <button
              onClick={() => scrollToSection("how-it-works")}
              className="hover:text-foreground transition-colors cursor-pointer"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection("about")}
              className="hover:text-foreground transition-colors cursor-pointer"
            >
              About
            </button>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2.5">
            <ThemeToggle className="h-8 w-8" />
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-xs">
                Sign In
              </Button>
            </Link>
            <Link to="/register">
              <Button size="sm" className="text-xs font-medium">
                Get Started
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ─── Hero Section ───────────────────────────────────────────── */}
      <section id="product" className="pt-16 pb-12 sm:pt-24 sm:pb-16 px-4 sm:px-6 max-w-5xl mx-auto text-center space-y-6">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md border border-border bg-secondary/60 text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-subtle" />
          ENGINEERING INTELLIGENCE PLATFORM
        </div>

        {/* Headline */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground max-w-3xl mx-auto leading-[1.12]">
          Understand your codebase. <br className="hidden sm:inline" />
          <span className="text-muted-foreground">Build with confidence.</span>
        </h1>

        {/* Supporting text */}
        <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Your repositories, architecture, documentation, and engineering conversations — connected in one intelligent workspace.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link to="/register" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto text-xs sm:text-sm font-semibold h-10 px-6">
              Get Started Free
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
          <button
            onClick={() => scrollToSection("interactive-preview")}
            className="w-full sm:w-auto cursor-pointer"
          >
            <Button variant="outline" size="lg" className="w-full sm:w-auto text-xs sm:text-sm h-10 px-6">
              Explore the Platform
            </Button>
          </button>
        </div>

        {/* Tech Stack Pills */}
        <div className="pt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground font-mono">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> GitHub Native
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> AssemblyAI Transcription (500 MB)
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Pinecone Vector RAG
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Deterministic Dependency Graph
          </span>
        </div>
      </section>

      {/* ─── Real Product Interface Preview ──────────────────────────── */}
      <section id="interactive-preview" className="px-4 sm:px-6 max-w-6xl mx-auto pb-20">
        <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
          {/* Top Mock Window Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border bg-secondary/40 px-4 py-2.5 gap-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-border" />
                <div className="h-2.5 w-2.5 rounded-full bg-border" />
                <div className="h-2.5 w-2.5 rounded-full bg-border" />
              </div>
              <div className="h-4 w-px bg-border/60" />
              <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
                <GitBranch className="h-3.5 w-3.5 text-primary" />
                <span>dionysus-core / main</span>
              </div>
            </div>

            {/* Interactive Preview Tabs */}
            <div className="flex items-center gap-1 self-start sm:self-auto bg-muted/60 p-0.5 rounded-md border border-border/80">
              <button
                onClick={() => setActivePreviewTab("architecture")}
                className={`px-2.5 py-1 text-xs rounded transition-colors cursor-pointer ${
                  activePreviewTab === "architecture"
                    ? "bg-card text-foreground font-medium shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Architecture Map
              </button>
              <button
                onClick={() => setActivePreviewTab("commits")}
                className={`px-2.5 py-1 text-xs rounded transition-colors cursor-pointer ${
                  activePreviewTab === "commits"
                    ? "bg-card text-foreground font-medium shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Commits &amp; Diff
              </button>
              <button
                onClick={() => setActivePreviewTab("meetings")}
                className={`px-2.5 py-1 text-xs rounded transition-colors cursor-pointer ${
                  activePreviewTab === "meetings"
                    ? "bg-card text-foreground font-medium shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Meeting Intelligence
              </button>
              <button
                onClick={() => setActivePreviewTab("qna")}
                className={`px-2.5 py-1 text-xs rounded transition-colors cursor-pointer ${
                  activePreviewTab === "qna"
                    ? "bg-card text-foreground font-medium shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Repo Q&amp;A
              </button>
            </div>
          </div>

          {/* Interactive Screen Display */}
          <div className="p-5 sm:p-7 min-h-[380px] bg-background/50 flex flex-col justify-between">
            {activePreviewTab === "architecture" && (
              <div className="space-y-5 animate-fade-up">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Service Architecture &amp; Boundary Visualizer</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Automated structural mapping derived from codebase commits and dependency parsing.</p>
                  </div>
                  <Badge variant="outline" className="font-mono text-[10px]">
                    4 Services • 2 Databases
                  </Badge>
                </div>

                {/* Simulated Graph Canvas */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 py-2">
                  <div className="p-3.5 rounded-md border border-border bg-card space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-primary font-semibold uppercase">Gateway</span>
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    </div>
                    <p className="text-xs font-semibold text-foreground">API Edge Layer</p>
                    <p className="text-[11px] text-muted-foreground font-mono">Express 5 • JWT Auth • Helmet</p>
                  </div>

                  <div className="p-3.5 rounded-md border border-border bg-card space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-primary font-semibold uppercase">Ingestion</span>
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    </div>
                    <p className="text-xs font-semibold text-foreground">Audio &amp; Git Pipeline</p>
                    <p className="text-[11px] text-muted-foreground font-mono">AssemblyAI • Multer • Octokit</p>
                  </div>

                  <div className="p-3.5 rounded-md border border-border bg-card space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-primary font-semibold uppercase">Reasoning</span>
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    </div>
                    <p className="text-xs font-semibold text-foreground">Vector Semantic Engine</p>
                    <p className="text-[11px] text-muted-foreground font-mono">Pinecone Vector • Gemini 2.0</p>
                  </div>

                  <div className="p-3.5 rounded-md border border-border bg-card space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-primary font-semibold uppercase">Storage</span>
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    </div>
                    <p className="text-xs font-semibold text-foreground">Operational Data</p>
                    <p className="text-[11px] text-muted-foreground font-mono">MongoDB Atlas • Cloudinary</p>
                  </div>
                </div>

                <div className="rounded border border-border/80 bg-secondary/30 p-3 flex items-center justify-between text-xs text-muted-foreground font-mono">
                  <span>Interactive node inspector: Click any component to reveal source dependencies and imports.</span>
                  <span className="text-primary font-sans font-medium text-[11px] hidden sm:inline">Explore in workspace →</span>
                </div>
              </div>
            )}

            {activePreviewTab === "commits" && (
              <div className="space-y-4 animate-fade-up">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Repository Timeline &amp; AI Commit Impact</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Chronological commit activity with automated technical impact analysis.</p>
                  </div>
                  <Badge variant="outline" className="font-mono text-[10px]">
                    24 Commits Synced
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="p-3 rounded-md border border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-foreground">feat(meetings): Add 500 MB chunked stream audio upload</span>
                        <Badge variant="secondary" className="text-[10px]">#9a2b8e</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">Upgrades Multer buffer handling and Cloudinary chunked streaming for large recordings.</p>
                    </div>
                    <span className="text-[11px] text-muted-foreground font-mono shrink-0">15 mins ago</span>
                  </div>

                  <div className="p-3 rounded-md border border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-foreground">refactor(theme): Implement Obsidian Slate &amp; Alabaster token system</span>
                        <Badge variant="secondary" className="text-[10px]">#4f6c10</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">Aligns design tokens with strict developer UI standards across all components.</p>
                    </div>
                    <span className="text-[11px] text-muted-foreground font-mono shrink-0">2 hours ago</span>
                  </div>
                </div>
              </div>
            )}

            {activePreviewTab === "meetings" && (
              <div className="space-y-4 animate-fade-up">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Engineering Discussion Transcript &amp; Chapter Intelligence</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Speech-to-text with automated topic extraction, timestamping, and Q&amp;A.</p>
                  </div>
                  <Badge variant="outline" className="font-mono text-[10px]">
                    AssemblyAI • 4 Topics
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-md border border-border bg-card space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground">00:00 - Architecture Review</span>
                      <span className="text-[10px] font-mono text-muted-foreground">03:45</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Evaluated migration from monolithic endpoints to event-driven dependency graphs.</p>
                  </div>

                  <div className="p-3.5 rounded-md border border-border bg-card space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground">03:45 - Database Indexing</span>
                      <span className="text-[10px] font-mono text-muted-foreground">08:12</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Decided on compound indices for meeting issues and commit reference queries.</p>
                  </div>
                </div>
              </div>
            )}

            {activePreviewTab === "qna" && (
              <div className="space-y-4 animate-fade-up">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Context-Aware Codebase Q&amp;A</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Natural language questions grounded in your repository AST and vector database.</p>
                  </div>
                  <Badge variant="outline" className="font-mono text-[10px]">
                    Pinecone Vector Index
                  </Badge>
                </div>

                <div className="space-y-2.5">
                  <div className="p-2.5 rounded-md bg-secondary/60 text-xs text-foreground font-mono">
                    Query: &quot;Where is the authentication middleware and how are tokens validated?&quot;
                  </div>
                  <div className="p-3 rounded-md border border-border bg-card text-xs text-muted-foreground leading-relaxed space-y-2">
                    <p>
                      Authentication is implemented in <code className="text-foreground bg-muted px-1 py-0.5 rounded">server/src/middleware/auth.middleware.js</code> using JSON Web Tokens (JWT). The <code className="text-foreground bg-muted px-1 py-0.5 rounded">protect</code> function extracts the Bearer token from headers, verifies it against <code className="text-foreground bg-muted px-1 py-0.5 rounded">JWT_SECRET</code>, and attaches the active user to <code className="text-foreground bg-muted px-1 py-0.5 rounded">req.user</code>.
                    </p>
                    <div className="flex items-center gap-2 pt-1 text-[11px] font-mono text-primary">
                      <span>Source: server/src/middleware/auth.middleware.js (L12-L34)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Demo Indicator */}
            <div className="pt-4 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground font-mono">
              <span>Interactive Platform Preview • Sample Engineering Environment</span>
              <Link to="/register" className="text-primary hover:underline font-sans font-medium">
                Create free workspace →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Bento Grid: 5 Core Product Pillars ───────────────────────── */}
      <section id="features" className="py-16 sm:py-20 px-4 sm:px-6 max-w-6xl mx-auto border-t border-border/60 space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <Badge variant="outline" className="font-mono text-[10px] uppercase">
            PRODUCT CAPABILITIES
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            A single operating system for your codebase knowledge.
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Eliminate silos between code commits, system design diagrams, technical documentation, and meeting notes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Bento 1: Repository Intelligence */}
          <div className="rounded-lg border border-border bg-card p-5 space-y-3 flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="icon-tile h-8 w-8 rounded-md">
                <GitBranch className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">1. Repository Intelligence</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Connect your GitHub repository to track commits, inspect directory file trees, and analyze code changes as they happen.
              </p>
            </div>
            <div className="p-2.5 rounded border border-border/70 bg-secondary/30 text-[11px] font-mono text-muted-foreground">
              commit poll • branch tracking • diff summary
            </div>
          </div>

          {/* Bento 2: Living Architecture */}
          <div id="architecture" className="rounded-lg border border-border bg-card p-5 space-y-3 flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="icon-tile h-8 w-8 rounded-md">
                <FolderTree className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">2. Living Architecture</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Automatically generate high-level architectural overview diagrams and explore deterministic import/export file dependencies.
              </p>
            </div>
            <div className="p-2.5 rounded border border-border/70 bg-secondary/30 text-[11px] font-mono text-muted-foreground">
              Mermaid graphs • React Flow canvas • node search
            </div>
          </div>

          {/* Bento 3: Meeting Audio Intelligence */}
          <div className="rounded-lg border border-border bg-card p-5 space-y-3 flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="icon-tile h-8 w-8 rounded-md">
                <Presentation className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">3. Engineering Meeting Intelligence</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Upload up to 500 MB recordings from your system or paste audio links. AI transcribes speech into timestamped architectural chapters.
              </p>
            </div>
            <div className="p-2.5 rounded border border-border/70 bg-secondary/30 text-[11px] font-mono text-muted-foreground">
              AssemblyAI • 500 MB upload • chapter queries
            </div>
          </div>

          {/* Bento 4: Context-Aware AI */}
          <div className="md:col-span-2 rounded-lg border border-border bg-card p-5 space-y-3 flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="icon-tile h-8 w-8 rounded-md">
                <FileQuestion className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">4. Context-Aware Codebase Q&amp;A</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Query repository architecture and workflows with natural language. Responses are grounded in vector embeddings and include source citations.
              </p>
            </div>
            <div className="p-2.5 rounded border border-border/70 bg-secondary/30 text-[11px] font-mono text-muted-foreground flex flex-wrap gap-3">
              <span>Pinecone vector DB</span>
              <span>•</span>
              <span>Gemini 2.0 reasoning</span>
              <span>•</span>
              <span>Exact file references</span>
            </div>
          </div>

          {/* Bento 5: Living Documentation */}
          <div className="rounded-lg border border-border bg-card p-5 space-y-3 flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="icon-tile h-8 w-8 rounded-md">
                <BookText className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">5. Living Documentation</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                A clean, distraction-free TipTap markdown writing environment organized around standard software engineering documentation sections.
              </p>
            </div>
            <div className="p-2.5 rounded border border-border/70 bg-secondary/30 text-[11px] font-mono text-muted-foreground">
              TipTap editor • markdown shortcuts • auto-save
            </div>
          </div>
        </div>
      </section>

      {/* ─── How It Works: 3 Steps ──────────────────────────────────── */}
      <section id="how-it-works" className="py-16 sm:py-20 px-4 sm:px-6 max-w-5xl mx-auto border-t border-border/60 space-y-10">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <Badge variant="outline" className="font-mono text-[10px] uppercase">
            WORKFLOW
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Three steps from repository to clarity.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-lg border border-border bg-card space-y-3">
            <span className="text-xs font-mono font-bold text-primary">01</span>
            <h3 className="text-sm font-semibold text-foreground">Connect your repository</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Link any public or private GitHub repository using your personal access token. Dionysus clones metadata and branch commit history.
            </p>
          </div>

          <div className="p-5 rounded-lg border border-border bg-card space-y-3">
            <span className="text-xs font-mono font-bold text-primary">02</span>
            <h3 className="text-sm font-semibold text-foreground">Analyze engineering knowledge</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Commits, dependencies, and uploaded meeting audio are automatically processed, vectorized into Pinecone, and summarized.
            </p>
          </div>

          <div className="p-5 rounded-lg border border-border bg-card space-y-3">
            <span className="text-xs font-mono font-bold text-primary">03</span>
            <h3 className="text-sm font-semibold text-foreground">Explore, understand, and build</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Query questions, visualize architecture diagrams, review discussion timestamps, and keep documentation aligned with code.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Final CTA Banner ───────────────────────────────────────── */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 max-w-4xl mx-auto text-center border-t border-border/60 space-y-6">
        <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground">
          &quot;Your codebase has a story. Understand every part of it.&quot;
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
          Start exploring your repositories with automated architecture, meeting intelligence, and vector Q&amp;A.
        </p>
        <div className="pt-2">
          <Link to="/register">
            <Button size="lg" className="h-10 px-7 text-xs sm:text-sm font-semibold">
              Start Building with Dionysus
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ─── Developer Footer ───────────────────────────────────────── */}
      <footer id="about" className="border-t border-border/80 bg-secondary/30 mt-auto py-10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <div className="icon-tile h-6 w-6 rounded">
              <Zap className="h-3 w-3" />
            </div>
            <span className="font-semibold text-foreground">Dionysus</span>
            <span>—</span>
            <span>Engineering Intelligence for Modern Development Teams</span>
          </div>

          <div className="flex flex-wrap items-center gap-6 font-mono text-[11px]">
            <button onClick={() => scrollToSection("features")} className="hover:text-foreground cursor-pointer">
              Features
            </button>
            <button onClick={() => scrollToSection("architecture")} className="hover:text-foreground cursor-pointer">
              Architecture
            </button>
            <Link to="/login" className="hover:text-foreground">
              Sign In
            </Link>
            <Link to="/register" className="hover:text-foreground">
              Register
            </Link>
            <span>© {new Date().getFullYear()} Dionysus</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

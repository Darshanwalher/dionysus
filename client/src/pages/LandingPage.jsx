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
  Boxes,
  Shield,
  Layers,
  Search,
  Activity,
  Terminal,
  ChevronRight,
  ExternalLink,
  Code2,
  Cpu,
  Sparkles,
  GitCommit,
  GitPullRequest,
  Check,
  Copy,
  ChevronDown,
  Lock,
  Globe,
  Database,
  Radio,
  FileCode,
  AlertTriangle,
  Flame,
} from "lucide-react";

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState("architecture");
  const [copiedCli, setCopiedCli] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  const [selectedDemoNode, setSelectedDemoNode] = useState("api-gateway");

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleCopyCli = () => {
    navigator.clipboard.writeText("npx dionysus-ai init --repo github.com/org/repo");
    setCopiedCli(true);
    setTimeout(() => setCopiedCli(false), 2000);
  };

  const demoNodes = {
    "api-gateway": {
      name: "api-gateway",
      type: "Service / Edge Router",
      lang: "TypeScript / Fastify",
      downstream: 5,
      upstream: 0,
      risk: "High",
      summary: "Primary ingress point. Terminates TLS, validates JWT tokens, and routes traffic to downstream microservices.",
      ports: "HTTP :8080, gRPC :9090",
    },
    "auth-service": {
      name: "auth-vault",
      type: "Core Security Module",
      lang: "Rust / Axum",
      downstream: 3,
      upstream: 1,
      risk: "Critical",
      summary: "Handles user sessions, OAuth2 providers, cryptographic key rotation, and RBAC policy enforcement.",
      ports: "Internal gRPC :50051",
    },
    "rag-orchestrator": {
      name: "rag-orchestrator",
      type: "AI Pipeline Engine",
      lang: "Python / PyTorch",
      downstream: 2,
      upstream: 2,
      risk: "Medium",
      summary: "AST chunking, vector embedding generation, hybrid search reranking, and semantic context dispatch.",
      ports: "REST :8000, Worker Queue",
    },
    "database-primary": {
      name: "pg-cluster-primary",
      type: "Persistence Layer",
      lang: "PostgreSQL 16",
      downstream: 0,
      upstream: 4,
      risk: "Critical",
      summary: "Primary relational storage for workspace schemas, repository AST nodes, commit audits, and user records.",
      ports: "TCP :5432 (SSL Pooled)",
    },
  };

  const activeNodeData = demoNodes[selectedDemoNode] || demoNodes["api-gateway"];

  const faqs = [
    {
      q: "How does Dionysus parse codebases without exposing private IP?",
      a: "Dionysus utilizes client-side AST tokenization and ephemeral ingestion workers. Your source code files are parsed into abstract syntax trees and structural dependency maps; we never store raw proprietary source code for AI model training. All analysis adheres to zero-data-retention agreements.",
    },
    {
      q: "Does Dionysus support multi-language monorepos?",
      a: "Yes. Dionysus natively recognizes polyglot monorepos using Turborepo, Nx, Cargo workspaces, Go modules, and pnpm. It automatically discovers inter-package dependency boundaries across TypeScript, Python, Go, Rust, Java, and C++.",
    },
    {
      q: "How does Change Impact Analysis work on Pull Requests?",
      a: "When a PR is opened, Dionysus checks the exact AST symbols modified in git diffs against the compiled dependency graph. It calculates downstream callers, flags breaking interface changes, computes a 0-100 blast radius score, and posts a succinct summary directly into your GitHub PR.",
    },
    {
      q: "What makes Dionysus different from standard AI coding assistants?",
      a: "Generic AI assistants answer questions in isolation using fuzzy text grep. Dionysus builds an authoritative, persistent compiler-grade knowledge graph of your entire repository architecture, symbol hierarchy, and call chains—enabling exact answers without hallucination.",
    },
    {
      q: "Can we integrate sprint meeting audio and architectural discussions?",
      a: "Yes. Dionysus includes Developer Meeting Intelligence. Upload sprint audio or sync Zoom/Google Meet recordings: our engine transcribes the audio, performs speaker diarization, extracts technical decisions, and cross-references decisions directly with repository commits.",
    },
    {
      q: "Is Dionysus ready for on-premise or VPC deployment?",
      a: "Yes. In addition to our SOC2 Type II certified cloud SaaS, Dionysus offers Docker and Helm chart distribution for air-gapped VPCs and enterprise environments with custom Ollama / vLLM inference backends.",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-foreground/15 font-sans">
      {/* ─── Top Announcement Banner ─────────────────────────────────── */}
      <div className="border-b border-border bg-secondary/40 px-4 py-1.5 text-center text-[11px] font-mono text-muted-foreground flex items-center justify-center gap-2">
        <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse-dot" />
        <span className="text-foreground font-medium">Dionysus 2.0 Engine Live:</span>
        <span className="hidden sm:inline">AST-driven Dependency DAGs & Real-time Blast Radius analysis.</span>
        <Link to="/register" className="text-foreground underline underline-offset-2 hover:opacity-80">
          Try free →
        </Link>
      </div>

      {/* ─── Sticky Navigation Bar ──────────────────────────────────── */}
      <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-7.5 w-7.5 items-center justify-center rounded-md border border-border bg-card shadow-2xs group-hover:border-foreground/30 transition-colors">
              <Zap className="h-4 w-4 text-foreground" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm sm:text-base tracking-tight text-foreground font-mono uppercase">
                Dionysus
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-medium text-muted-foreground">
            <button
              onClick={() => scrollToSection("capabilities")}
              className="hover:text-foreground transition-colors cursor-pointer"
            >
              Capabilities
            </button>
            <button
              onClick={() => scrollToSection("architecture")}
              className="hover:text-foreground transition-colors cursor-pointer"
            >
              Architecture Graph
            </button>
            <button
              onClick={() => scrollToSection("blast-radius")}
              className="hover:text-foreground transition-colors cursor-pointer"
            >
              Impact Analysis
            </button>
            <button
              onClick={() => scrollToSection("how-it-works")}
              className="hover:text-foreground transition-colors cursor-pointer"
            >
              Pipeline
            </button>
            <button
              onClick={() => scrollToSection("comparison")}
              className="hover:text-foreground transition-colors cursor-pointer"
            >
              Comparison
            </button>
            <button
              onClick={() => scrollToSection("faq")}
              className="hover:text-foreground transition-colors cursor-pointer"
            >
              FAQ
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
              <Button size="sm" className="text-xs font-semibold">
                Get Started
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ─── Hero Section ───────────────────────────────────────────── */}
      <section className="relative pt-16 pb-12 sm:pt-24 sm:pb-20 px-4 sm:px-6 max-w-6xl mx-auto text-center space-y-7">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-secondary/70 text-[11px] font-mono tracking-tight text-muted-foreground shadow-2xs">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse-dot" />
          <span className="text-foreground font-semibold">AI REPOSITORY INTELLIGENCE & AST VISUALIZATION</span>
        </div>

        {/* Headline */}
        <div className="space-y-4 max-w-4xl mx-auto">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.08]">
            Codebases decoded at machine speed.{" "}
            <span className="text-muted-foreground">Architecture made visible.</span>
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Connect any GitHub repository. Dionysus tokenizes abstract syntax trees, synthesizes interactive architecture diagrams, evaluates pull request blast radiuses, and powers semantic codebase understanding.
          </p>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link to="/register" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto text-sm font-semibold h-11 px-6 shadow-xs">
              Start Free with GitHub
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
          <button
            onClick={() => scrollToSection("interactive-demo")}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-11 px-5 rounded-md border border-border bg-card text-foreground hover:bg-secondary text-sm font-medium transition-colors cursor-pointer shadow-2xs"
          >
            <Boxes className="h-4 w-4 text-muted-foreground" />
            <span>Explore Interactive Preview</span>
            <kbd className="text-[10px] ml-1">⌘P</kbd>
          </button>
        </div>

        {/* Trust Badges */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-mono text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            No credit card required
          </span>
          <span className="flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5 text-emerald-500" />
            Zero Code Retention
          </span>
          <span className="flex items-center gap-1.5">
            <GitBranch className="h-3.5 w-3.5 text-emerald-500" />
            Instant GitHub OAuth
          </span>
          <span className="flex items-center gap-1.5">
            <Terminal className="h-3.5 w-3.5 text-emerald-500" />
            Polyglot AST Support
          </span>
        </div>

        {/* ─── Interactive Hero Product Preview ───────────────────────── */}
        <div id="interactive-demo" className="mt-8 rounded-xl border border-border bg-card shadow-2xl overflow-hidden card-sheen text-left">
          {/* Mock Window Top Bar */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-secondary/40 select-none">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-rose-500/80 inline-block" />
                <span className="h-3 w-3 rounded-full bg-amber-500/80 inline-block" />
                <span className="h-3 w-3 rounded-full bg-emerald-500/80 inline-block" />
              </div>
              <div className="hidden sm:flex items-center gap-2 pl-2 text-xs font-mono text-muted-foreground">
                <span className="text-foreground font-semibold">dionysus-org / core-engine</span>
                <span className="text-border">/</span>
                <span className="px-1.5 py-0.5 rounded bg-secondary text-[10px] text-muted-foreground border border-border">
                  main [3a91fc]
                </span>
              </div>
            </div>

            {/* Preview View Switcher Tabs */}
            <div className="flex items-center rounded-md border border-border bg-card p-0.5 text-xs font-medium">
              <button
                onClick={() => setActiveTab("architecture")}
                className={`px-3 py-1 rounded text-xs transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "architecture"
                    ? "bg-foreground text-background font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Boxes className="h-3 w-3" />
                <span className="hidden md:inline">Architecture</span>
              </button>
              <button
                onClick={() => setActiveTab("dependencies")}
                className={`px-3 py-1 rounded text-xs transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "dependencies"
                    ? "bg-foreground text-background font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <FolderTree className="h-3 w-3" />
                <span className="hidden md:inline">Dependency DAG</span>
              </button>
              <button
                onClick={() => setActiveTab("chat")}
                className={`px-3 py-1 rounded text-xs transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "chat"
                    ? "bg-foreground text-background font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <FileQuestion className="h-3 w-3" />
                <span className="hidden md:inline">Codebase Q&A</span>
              </button>
              <button
                onClick={() => setActiveTab("meetings")}
                className={`px-3 py-1 rounded text-xs transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "meetings"
                    ? "bg-foreground text-background font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Presentation className="h-3 w-3" />
                <span className="hidden md:inline">Meeting Intel</span>
              </button>
            </div>

            <div className="hidden md:flex items-center gap-2">
              <Badge variant="success" dot={true}>
                Graph Synced
              </Badge>
            </div>
          </div>

          {/* Tab 1: Interactive Architecture Overview Canvas */}
          {activeTab === "architecture" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[460px] bg-background">
              {/* Canvas Viewport */}
              <div className="lg:col-span-8 p-6 flex flex-col justify-between bg-grid-pattern relative border-b lg:border-b-0 lg:border-r border-border">
                {/* Canvas Controls Header */}
                <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Interactive Topology Map • Click nodes to inspect
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded bg-secondary border border-border text-[10px]">
                      5 Services
                    </span>
                    <span className="px-2 py-0.5 rounded bg-secondary border border-border text-[10px]">
                      12 Edges
                    </span>
                  </div>
                </div>

                {/* Graph Node Layout Simulation */}
                <div className="my-auto py-8 flex flex-col gap-8 items-center max-w-xl mx-auto w-full">
                  {/* Top Layer: API Gateway */}
                  <div
                    onClick={() => setSelectedDemoNode("api-gateway")}
                    className={`w-64 p-3.5 rounded-lg border transition-all cursor-pointer select-none shadow-xs ${
                      selectedDemoNode === "api-gateway"
                        ? "border-foreground bg-card ring-2 ring-foreground/20"
                        : "border-border bg-card/90 hover:border-foreground/30"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Globe className="h-3.5 w-3.5 text-sky-400" />
                        api-gateway
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-sky-500/10 text-sky-500 border border-sky-500/20">
                        Edge / REST
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1.5 truncate">
                      Fastify • TLS Termination • Rate Limiter
                    </p>
                  </div>

                  {/* Connecting Line */}
                  <div className="w-0.5 h-6 bg-border relative">
                    <span className="absolute -top-1 -left-1 h-2.5 w-2.5 rounded-full border border-border bg-background" />
                    <span className="absolute -bottom-1 -left-1 h-2.5 w-2.5 rounded-full border border-border bg-background" />
                  </div>

                  {/* Middle Layer: Core Services */}
                  <div className="grid grid-cols-2 gap-4 w-full">
                    <div
                      onClick={() => setSelectedDemoNode("auth-service")}
                      className={`p-3.5 rounded-lg border transition-all cursor-pointer select-none shadow-xs ${
                        selectedDemoNode === "auth-service"
                          ? "border-foreground bg-card ring-2 ring-foreground/20"
                          : "border-border bg-card/90 hover:border-foreground/30"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-foreground flex items-center gap-1.5">
                          <Lock className="h-3.5 w-3.5 text-rose-400" />
                          auth-vault
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-500 border border-rose-500/20">
                          Critical
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1.5 truncate">
                        Rust Axum • JWT Sessions
                      </p>
                    </div>

                    <div
                      onClick={() => setSelectedDemoNode("rag-orchestrator")}
                      className={`p-3.5 rounded-lg border transition-all cursor-pointer select-none shadow-xs ${
                        selectedDemoNode === "rag-orchestrator"
                          ? "border-foreground bg-card ring-2 ring-foreground/20"
                          : "border-border bg-card/90 hover:border-foreground/30"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-foreground flex items-center gap-1.5">
                          <Cpu className="h-3.5 w-3.5 text-indigo-400" />
                          rag-engine
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                          AI AST
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1.5 truncate">
                        Vector Embeddings • AST Graph
                      </p>
                    </div>
                  </div>

                  {/* Connecting Line */}
                  <div className="w-0.5 h-6 bg-border relative">
                    <span className="absolute -top-1 -left-1 h-2.5 w-2.5 rounded-full border border-border bg-background" />
                    <span className="absolute -bottom-1 -left-1 h-2.5 w-2.5 rounded-full border border-border bg-background" />
                  </div>

                  {/* Bottom Layer: Storage Cluster */}
                  <div
                    onClick={() => setSelectedDemoNode("database-primary")}
                    className={`w-64 p-3.5 rounded-lg border transition-all cursor-pointer select-none shadow-xs ${
                      selectedDemoNode === "database-primary"
                        ? "border-foreground bg-card ring-2 ring-foreground/20"
                        : "border-border bg-card/90 hover:border-foreground/30"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Database className="h-3.5 w-3.5 text-emerald-400" />
                        pg-cluster-primary
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        Postgres 16
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1.5 truncate">
                      Connection Pool 88% • Latency 1.2ms
                    </p>
                  </div>
                </div>

                {/* Canvas Footer Status */}
                <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground border-t border-border/60 pt-3">
                  <span>Layout: Dagre Hierarchical (TB)</span>
                  <span>Auto-synthesized from codebase AST</span>
                </div>
              </div>

              {/* Node Inspector Context Panel */}
              <div className="lg:col-span-4 p-5 bg-card flex flex-col justify-between space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                        Component Inspector
                      </span>
                      <h4 className="text-sm font-bold text-foreground font-mono">
                        {activeNodeData.name}
                      </h4>
                    </div>
                    <Badge variant={activeNodeData.risk === "Critical" ? "destructive" : "secondary"}>
                      {activeNodeData.risk} Impact
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[11px] font-mono text-muted-foreground">Functional Summary</span>
                    <p className="text-xs text-foreground/90 leading-relaxed bg-secondary/50 p-2.5 rounded border border-border">
                      {activeNodeData.summary}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2 rounded bg-secondary/30 border border-border">
                      <span className="text-[10px] text-muted-foreground block">Downstream Calls</span>
                      <span className="text-sm font-bold text-foreground">{activeNodeData.downstream} services</span>
                    </div>
                    <div className="p-2 rounded bg-secondary/30 border border-border">
                      <span className="text-[10px] text-muted-foreground block">Upstream Callers</span>
                      <span className="text-sm font-bold text-foreground">{activeNodeData.upstream} callers</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs font-mono">
                    <span className="text-[10px] text-muted-foreground block">Stack & Protocols</span>
                    <div className="p-2 rounded bg-secondary/40 border border-border text-[11px] text-foreground">
                      {activeNodeData.lang} • {activeNodeData.ports}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <Link to="/register" className="w-full block">
                    <Button size="sm" className="w-full text-xs font-semibold">
                      Explore Full Graph in Dionysus
                      <ArrowRight className="h-3 w-3 ml-1.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Dependency DAG & Blast Radius */}
          {activeTab === "dependencies" && (
            <div className="p-6 bg-background space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
                <div>
                  <h4 className="text-sm font-bold text-foreground font-mono flex items-center gap-2">
                    <GitPullRequest className="h-4 w-4 text-amber-500" />
                    PR #1429 Blast Radius: <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">src/auth/jwt.ts</code>
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Modifying interface <code className="text-foreground font-mono">TokenPayload</code> triggers 14 downstream call sites.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="warning" dot={true}>
                    Risk Score: 78/100 (High)
                  </Badge>
                </div>
              </div>

              {/* Blast Radius Affected Graph List */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-lg border border-border bg-card space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-semibold text-foreground">Direct Callers</span>
                    <Badge variant="mono">6 Files</Badge>
                  </div>
                  <ul className="text-xs font-mono space-y-1.5 text-muted-foreground">
                    <li className="flex items-center justify-between p-1.5 rounded bg-secondary/50">
                      <span>routes/auth.ts</span>
                      <span className="text-[10px] text-rose-400">verify()</span>
                    </li>
                    <li className="flex items-center justify-between p-1.5 rounded bg-secondary/50">
                      <span>middleware/guard.ts</span>
                      <span className="text-[10px] text-rose-400">claims()</span>
                    </li>
                    <li className="flex items-center justify-between p-1.5 rounded bg-secondary/50">
                      <span>services/billing.ts</span>
                      <span className="text-[10px] text-amber-400">tenantId</span>
                    </li>
                  </ul>
                </div>

                <div className="p-3.5 rounded-lg border border-border bg-card space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-semibold text-foreground">API Endpoints Affected</span>
                    <Badge variant="mono">8 Routes</Badge>
                  </div>
                  <ul className="text-xs font-mono space-y-1.5 text-muted-foreground">
                    <li className="flex items-center justify-between p-1.5 rounded bg-secondary/50">
                      <span className="text-emerald-400">POST</span>
                      <span>/api/v2/auth/refresh</span>
                    </li>
                    <li className="flex items-center justify-between p-1.5 rounded bg-secondary/50">
                      <span className="text-sky-400">GET</span>
                      <span>/api/v2/org/members</span>
                    </li>
                    <li className="flex items-center justify-between p-1.5 rounded bg-secondary/50">
                      <span className="text-amber-400">PUT</span>
                      <span>/api/v2/billing/tier</span>
                    </li>
                  </ul>
                </div>

                <div className="p-3.5 rounded-lg border border-border bg-card space-y-2 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                      <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                      AI Mitigation Recommendation
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      "Add backward-compatible optional getter <code className="font-mono text-foreground">payload.getTenant()</code> to prevent silent runtime null dereferences across billing services."
                    </p>
                  </div>
                  <Link to="/register">
                    <Button variant="outline" size="sm" className="w-full text-xs">
                      Run On Your PRs
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Codebase Q&A Chat */}
          {activeTab === "chat" && (
            <div className="p-6 bg-background space-y-4">
              <div className="space-y-3 max-w-3xl mx-auto">
                {/* User Prompt */}
                <div className="flex items-start gap-3 p-3.5 rounded-lg bg-card border border-border">
                  <div className="h-6 w-6 rounded bg-secondary border border-border flex items-center justify-center text-[10px] font-mono font-bold shrink-0">
                    DEV
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-foreground">
                      "Where is the Kafka retry queue configured, and what happens when dead-letter threshold is exceeded?"
                    </p>
                  </div>
                </div>

                {/* AI Assistant Answer */}
                <div className="flex items-start gap-3 p-4 rounded-lg bg-secondary/40 border border-border">
                  <div className="h-6 w-6 rounded bg-foreground text-background flex items-center justify-center text-[10px] font-mono font-bold shrink-0">
                    AI
                  </div>
                  <div className="space-y-2 text-xs text-foreground/90 leading-relaxed font-sans">
                    <p>
                      The dead-letter mechanism is implemented in{" "}
                      <code className="font-mono text-foreground bg-card px-1.5 py-0.5 rounded border border-border">
                        src/workers/eventConsumer.ts#L42-L89
                      </code>
                      .
                    </p>
                    <div className="p-3 rounded bg-card border border-border font-mono text-[11px] overflow-x-auto text-muted-foreground">
                      <p className="text-foreground">// Max retries set to 5 with exponential backoff</p>
                      <p>retryPolicy: &#123; maxAttempts: 5, backoffFactor: 2.0 &#125;,</p>
                      <p>onExceeded: async (msg) =&gt; await alertSentryAndPushDeadLetter(msg)</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] font-mono text-muted-foreground">
                      <span>Referenced AST Symbols:</span>
                      <span className="px-1.5 py-0.5 rounded bg-card border border-border text-foreground">
                        EventConsumer.handle()
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-card border border-border text-foreground">
                        DeadLetterQueue
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Meeting Audio Intelligence */}
          {activeTab === "meetings" && (
            <div className="p-6 bg-background space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border border-border bg-card space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Presentation className="h-4 w-4 text-emerald-400" />
                      <span className="text-xs font-bold font-mono text-foreground">
                        Sprint 42 Architecture Review
                      </span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-secondary text-muted-foreground">
                      42 min audio
                    </span>
                  </div>
                  {/* Waveform Visualization Simulation */}
                  <div className="h-10 rounded bg-secondary/50 border border-border flex items-center justify-center px-4 gap-1">
                    {[12, 24, 18, 32, 14, 28, 36, 20, 15, 30, 25, 18, 34, 22, 16, 29, 35, 19].map((h, i) => (
                      <span
                        key={i}
                        className="w-1 rounded-full bg-foreground/40"
                        style={{ height: `${h}px` }}
                      />
                    ))}
                  </div>
                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    <p className="font-semibold text-foreground text-xs">AI Speaker Diarization:</p>
                    <p>• <strong className="text-foreground">Marcus (Principal Arch):</strong> "We must isolate vector embeddings from Postgres to lower CPU usage."</p>
                    <p>• <strong className="text-foreground">Elena (Staff Eng):</strong> "Agreed. I will migrate the search index to Qdrant cluster by Friday."</p>
                  </div>
                </div>

                <div className="p-4 rounded-lg border border-border bg-card space-y-3">
                  <span className="text-xs font-bold font-mono text-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    Auto-Generated Action Items & Commit Links
                  </span>
                  <div className="space-y-2 text-xs font-mono">
                    <div className="p-2.5 rounded bg-secondary/40 border border-border flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                      <div>
                        <span className="text-foreground font-semibold">Decouple Vector Ingestion Pipeline</span>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Linked Commit: <code className="text-foreground">feat(embed): isolate qdrant worker #882b4</code>
                        </p>
                      </div>
                    </div>
                    <div className="p-2.5 rounded bg-secondary/40 border border-border flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                      <div>
                        <span className="text-foreground font-semibold">Update API Gateway Rate Limiting Rules</span>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Linked Commit: <code className="text-foreground">fix(gateway): token bucket limit #19cf4</code>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ─── Product Capabilities (The 6 Pillars) ───────────────────── */}
      <section id="capabilities" className="py-16 sm:py-24 border-t border-border bg-secondary/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <Badge variant="secondary">ENGINEERING INTELLIGENCE</Badge>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground">
              Built for engineering leaders, architects, and high-velocity teams.
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Dionysus transforms the friction of exploring and maintaining large codebases into an intuitive, visually responsive developer experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* 1. Architecture Overview */}
            <div className="p-6 rounded-lg border border-border bg-card card-sheen space-y-3 hover:border-foreground/20 transition-all">
              <div className="h-9 w-9 rounded-md border border-border bg-secondary flex items-center justify-center">
                <Boxes className="h-4.5 w-4.5 text-foreground" />
              </div>
              <h3 className="text-base font-bold text-foreground">AI-Powered Architecture Maps</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Generate living, compiler-accurate system architecture diagrams from repository source code. See how microservices, queues, databases, and third-party APIs connect.
              </p>
              <div className="pt-2 text-[11px] font-mono text-muted-foreground flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Dagre hierarchical & force layouts
              </div>
            </div>

            {/* 2. Interactive Dependency Graph */}
            <div className="p-6 rounded-lg border border-border bg-card card-sheen space-y-3 hover:border-foreground/20 transition-all">
              <div className="h-9 w-9 rounded-md border border-border bg-secondary flex items-center justify-center">
                <FolderTree className="h-4.5 w-4.5 text-foreground" />
              </div>
              <h3 className="text-base font-bold text-foreground">Interactive Dependency Graph</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Inspect file-level imports, cyclic dependencies, and call trees in real time. Filter by depth, layer, package, or subsystem with instant node focus.
              </p>
              <div className="pt-2 text-[11px] font-mono text-muted-foreground flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                Circular reference detection
              </div>
            </div>

            {/* 3. Intelligent Codebase Chat */}
            <div className="p-6 rounded-lg border border-border bg-card card-sheen space-y-3 hover:border-foreground/20 transition-all">
              <div className="h-9 w-9 rounded-md border border-border bg-secondary flex items-center justify-center">
                <FileQuestion className="h-4.5 w-4.5 text-foreground" />
              </div>
              <h3 className="text-base font-bold text-foreground">Intelligent Codebase Chat</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Ask deep technical questions about logic flows, configuration params, and implementation details. Answers cite exact AST file lines and symbol definitions.
              </p>
              <div className="pt-2 text-[11px] font-mono text-muted-foreground flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                Semantic AST indexing (no hallucination)
              </div>
            </div>

            {/* 4. Change Impact Analysis */}
            <div className="p-6 rounded-lg border border-border bg-card card-sheen space-y-3 hover:border-foreground/20 transition-all">
              <div className="h-9 w-9 rounded-md border border-border bg-secondary flex items-center justify-center">
                <GitPullRequest className="h-4.5 w-4.5 text-foreground" />
              </div>
              <h3 className="text-base font-bold text-foreground">Change Impact Blast Radius</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Know before merging PRs which downstream consumers, shared schemas, or API endpoints will break. Get an automated risk score and mitigation patch suggestions.
              </p>
              <div className="pt-2 text-[11px] font-mono text-muted-foreground flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                Pre-commit & CI/CD integration
              </div>
            </div>

            {/* 5. Deep GitHub Integration */}
            <div className="p-6 rounded-lg border border-border bg-card card-sheen space-y-3 hover:border-foreground/20 transition-all">
              <div className="h-9 w-9 rounded-md border border-border bg-secondary flex items-center justify-center">
                <GitBranch className="h-4.5 w-4.5 text-foreground" />
              </div>
              <h3 className="text-base font-bold text-foreground">Deep GitHub Integration</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Connect via GitHub App or personal token. Dionysus polls commits, parses git trees, triggers on webhooks, and writes intelligent commit summaries automatically.
              </p>
              <div className="pt-2 text-[11px] font-mono text-muted-foreground flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Continuous webhook synchronization
              </div>
            </div>

            {/* 6. AI-Assisted Developer Workflows */}
            <div className="p-6 rounded-lg border border-border bg-card card-sheen space-y-3 hover:border-foreground/20 transition-all">
              <div className="h-9 w-9 rounded-md border border-border bg-secondary flex items-center justify-center">
                <Presentation className="h-4.5 w-4.5 text-foreground" />
              </div>
              <h3 className="text-base font-bold text-foreground">Meeting & Documentation Intel</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Transcribe engineering reviews and design sprints. Extract action items, connect them to commits, and maintain dynamic markdown documentation that never drifts.
              </p>
              <div className="pt-2 text-[11px] font-mono text-muted-foreground flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                Audio diarization + TipTap docs
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── How Dionysus Works (5-Stage Pipeline) ──────────────────── */}
      <section id="how-it-works" className="py-16 sm:py-24 border-t border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <Badge variant="secondary">ARCHITECTURE PIPELINE</Badge>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground">
              From raw git commits to compiler-grade intelligence.
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              How Dionysus processes code without storing proprietary files or hallucinating facts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {[
              {
                step: "01",
                title: "Git Ingestion",
                desc: "Ephemeral worker clones repository via GitHub App credentials with zero disk persistence.",
              },
              {
                step: "02",
                title: "AST Tokenization",
                desc: "Language-specific parsers extract functions, classes, imports, exports, and call hierarchies.",
              },
              {
                step: "03",
                title: "DAG Graph Build",
                desc: "Dagre & Graphlib compile directed acyclic graphs resolving exact inter-file dependencies.",
              },
              {
                step: "04",
                title: "Semantic Synthesis",
                desc: "AI identifies subsystem boundaries, service clusters, and potential architectural bottlenecks.",
              },
              {
                step: "05",
                title: "Continuous Drift",
                desc: "Every git push re-evaluates the graph, notifying engineering when architectural boundaries drift.",
              },
            ].map((p, i) => (
              <div key={i} className="p-4 rounded-lg border border-border bg-card space-y-2 card-sheen">
                <span className="text-xs font-mono font-bold text-muted-foreground/60">{p.step}</span>
                <h4 className="text-sm font-bold text-foreground font-mono">{p.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Comparison Matrix ──────────────────────────────────────── */}
      <section id="comparison" className="py-16 sm:py-24 border-t border-border bg-secondary/20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-10">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <Badge variant="secondary">HEAD-TO-HEAD</Badge>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground">
              Why leading engineering teams choose Dionysus.
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Comparing modern repository intelligence against outdated manual practices.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-card overflow-x-auto shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-secondary/60 border-b border-border text-muted-foreground font-mono">
                <tr>
                  <th className="p-4 font-semibold text-foreground">Capability</th>
                  <th className="p-4 font-semibold text-foreground bg-primary/5 border-x border-border">
                    Dionysus 2.0
                  </th>
                  <th className="p-4 font-semibold">Static Mermaid / Lucid</th>
                  <th className="p-4 font-semibold">Generic LLM Chat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-mono">
                <tr>
                  <td className="p-4 text-foreground font-sans font-medium">Automatic Architecture Synthesis</td>
                  <td className="p-4 text-emerald-500 font-bold bg-primary/5 border-x border-border">✓ Full AST Analysis</td>
                  <td className="p-4 text-muted-foreground">✗ Manual Drawing</td>
                  <td className="p-4 text-muted-foreground">✗ Text Only</td>
                </tr>
                <tr>
                  <td className="p-4 text-foreground font-sans font-medium">Pre-Commit PR Blast Radius</td>
                  <td className="p-4 text-emerald-500 font-bold bg-primary/5 border-x border-border">✓ Automatic Risk Score</td>
                  <td className="p-4 text-muted-foreground">✗ None</td>
                  <td className="p-4 text-muted-foreground">✗ Speculative</td>
                </tr>
                <tr>
                  <td className="p-4 text-foreground font-sans font-medium">Code Drift & Sync Detection</td>
                  <td className="p-4 text-emerald-500 font-bold bg-primary/5 border-x border-border">✓ Real-time Webhooks</td>
                  <td className="p-4 text-muted-foreground">✗ Outdated immediately</td>
                  <td className="p-4 text-muted-foreground">✗ None</td>
                </tr>
                <tr>
                  <td className="p-4 text-foreground font-sans font-medium">Code Citation & Exact Line Refs</td>
                  <td className="p-4 text-emerald-500 font-bold bg-primary/5 border-x border-border">✓ Verified Compiler AST</td>
                  <td className="p-4 text-muted-foreground">✗ N/A</td>
                  <td className="p-4 text-muted-foreground">~ Frequent Hallucinations</td>
                </tr>
                <tr>
                  <td className="p-4 text-foreground font-sans font-medium">Audio Review & Decision Linking</td>
                  <td className="p-4 text-emerald-500 font-bold bg-primary/5 border-x border-border">✓ Ingests & Links Commits</td>
                  <td className="p-4 text-muted-foreground">✗ None</td>
                  <td className="p-4 text-muted-foreground">✗ Disconnected</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ─── CLI Quick Start Section ────────────────────────────────── */}
      <section className="py-16 border-t border-border bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <Badge variant="secondary">DEVELOPER TOOLING</Badge>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Initialize in 10 seconds from your terminal.
          </h2>
          <div className="flex items-center justify-between max-w-xl mx-auto p-3 rounded-lg border border-border bg-card font-mono text-xs shadow-xs">
            <span className="text-muted-foreground select-all">
              <span className="text-emerald-500 mr-2">$</span>
              npx dionysus-ai init --repo github.com/org/repo
            </span>
            <button
              onClick={handleCopyCli}
              className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Copy CLI command"
            >
              {copiedCli ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      </section>

      {/* ─── Frequently Asked Questions ─────────────────────────────── */}
      <section id="faq" className="py-16 sm:py-24 border-t border-border bg-secondary/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="text-center space-y-3">
            <Badge variant="secondary">FAQ</Badge>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Frequently asked questions.
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Everything you need to know about Dionysus, privacy, and architecture intelligence.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((f, i) => (
              <div
                key={i}
                className="rounded-lg border border-border bg-card transition-colors overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
                  className="w-full flex items-center justify-between p-4 text-left text-xs sm:text-sm font-semibold text-foreground cursor-pointer hover:bg-secondary/40 transition-colors"
                >
                  <span>{f.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-muted-foreground transition-transform duration-200 shrink-0 ml-2 ${
                      openFaq === i ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4 pt-1 text-xs text-muted-foreground leading-relaxed border-t border-border/50">
                    {f.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Final Call to Action ───────────────────────────────────── */}
      <section className="py-20 border-t border-border bg-card card-sheen text-center relative overflow-hidden">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-6">
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground">
            Stop navigating code blind.
            <br />
            <span className="text-muted-foreground">Make your architecture visible.</span>
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Join engineering teams across the world who deploy with confidence using compiler-grade architecture maps and blast radius analysis.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link to="/register" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto h-11 px-8 text-sm font-semibold">
                Get Started Free
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
            <Link to="/login" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto h-11 px-6 text-sm">
                Sign In to Workspace
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Premium SaaS Footer ────────────────────────────────────── */}
      <footer className="border-t border-border bg-background py-12 px-4 sm:px-6 text-xs text-muted-foreground font-mono">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand Col */}
          <div className="col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-foreground text-background flex items-center justify-center text-[10px] font-bold">
                <Zap className="h-3 w-3" />
              </div>
              <span className="font-bold text-foreground tracking-tight text-sm uppercase">
                Dionysus
              </span>
            </div>
            <p className="text-xs text-muted-foreground max-w-sm leading-relaxed font-sans">
              AI-powered developer collaboration and living repository intelligence. Architecture diagrams, dependency DAGs, and pull request blast radius.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse-dot" />
              <span className="text-[11px] text-foreground font-medium">All Systems Operational</span>
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-2.5">
            <h5 className="text-xs font-semibold text-foreground uppercase tracking-wider">Product</h5>
            <ul className="space-y-1.5">
              <li>
                <button onClick={() => scrollToSection("capabilities")} className="hover:text-foreground cursor-pointer">
                  Architecture Overview
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection("capabilities")} className="hover:text-foreground cursor-pointer">
                  Dependency Graph
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection("capabilities")} className="hover:text-foreground cursor-pointer">
                  Change Blast Radius
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection("capabilities")} className="hover:text-foreground cursor-pointer">
                  Codebase Q&A
                </button>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-2.5">
            <h5 className="text-xs font-semibold text-foreground uppercase tracking-wider">Resources</h5>
            <ul className="space-y-1.5">
              <li>
                <Link to="/login" className="hover:text-foreground">
                  Documentation
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-foreground">
                  API Reference
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-foreground">
                  Security Whitepaper
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-foreground">
                  GitHub App Integration
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-2.5">
            <h5 className="text-xs font-semibold text-foreground uppercase tracking-wider">Security</h5>
            <ul className="space-y-1.5">
              <li>
                <span className="hover:text-foreground cursor-pointer">SOC2 Type II</span>
              </li>
              <li>
                <span className="hover:text-foreground cursor-pointer">Zero Data Retention</span>
              </li>
              <li>
                <span className="hover:text-foreground cursor-pointer">Terms of Service</span>
              </li>
              <li>
                <span className="hover:text-foreground cursor-pointer">Privacy Policy</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
          <span>© {new Date().getFullYear()} Dionysus Technologies Inc. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <span>Built with precision for software engineers.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

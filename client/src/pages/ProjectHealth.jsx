import { useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchProject, fetchHealth, refreshHealth } from "@/store/slices/projectSlice";
import HealthGauge, { scoreTone } from "@/components/health/HealthGauge";
import HealthRadar from "@/components/health/HealthRadar";
import QuickFixCard from "@/components/health/QuickFixCard";
import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CountUp, FadeIn, GrowBar, ScrollReveal } from "@/components/motion";
import { cn } from "@/lib/utils";
import {
  Activity,
  RefreshCw,
  Cpu,
  Layers,
  BookOpen,
  Lock,
  ArrowRight,
  CheckCircle2,
  Flame,
  ShieldCheck,
} from "lucide-react";

const parsePts = (s) => {
  const m = String(s ?? "").match(/-?\d+(\.\d+)?/);
  return m ? parseFloat(m[0]) : 0;
};

export default function ProjectHealth() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { currentProject, healthScore, isHealthLoading } = useSelector((s) => s.project);

  useEffect(() => {
    if (!currentProject || (currentProject._id !== id && currentProject.id !== id)) dispatch(fetchProject(id));
  }, [dispatch, id, currentProject]);

  useEffect(() => {
    if (id && !healthScore && !isHealthLoading) dispatch(fetchHealth(id));
  }, [dispatch, id, healthScore, isHealthLoading]);

  const handleRefresh = () => dispatch(refreshHealth(id));

  const data = healthScore || currentProject?.healthScore;
  const b = data?.breakdown || {};
  const m = data?.metricsSummary || {};
  const quickFixes = data?.actionableQuickFixes || [];

  const pillars = useMemo(
    () =>
      [
        { title: "Architecture & coupling", short: "Architecture", w: 0.3, icon: Layers, info: b.architecture, desc: "Circular dependency cycles, layered abstraction and blast radius." },
        { title: "Code complexity & size", short: "Complexity", w: 0.25, icon: Cpu, info: b.complexity, desc: "God files (over 500 lines), fan-out degree and cognitive complexity." },
        { title: "Dead code & hygiene", short: "Dead code", w: 0.15, icon: Flame, info: b.deadCode, desc: "Source files with no callers and unreferenced modules." },
        { title: "Documentation & onboarding", short: "Docs", w: 0.15, icon: BookOpen, info: b.onboarding, desc: "README, environment templates (.env.example) and license." },
        { title: "Security & dependencies", short: "Security", w: 0.15, icon: Lock, info: b.security, desc: "Hardcoded secrets, package lockfiles and package hygiene." },
      ].map((p) => {
        const score = p.info?.score ?? 0;
        return { ...p, score, pts: (100 - score) * p.w };
      }),
    [b]
  );

  // Most costly pillar first
  const byImpact = useMemo(() => [...pillars].sort((a, c) => c.pts - a.pts), [pillars]);
  const potential = useMemo(() => quickFixes.reduce((sum, f) => sum + parsePts(f.scoreImpact), 0), [quickFixes]);

  const vitals = [
    { label: "Files scanned", sub: "Total in repository", v: m.totalFiles || 0, neutral: true },
    { label: "Cycles", sub: "Circular imports", v: m.circularDependencies || 0, bad: "text-destructive" },
    { label: "God files", sub: "Over 500 lines", v: m.godFiles || 0, bad: "text-accent-amber" },
    { label: "Dead files", sub: "No callers or usages", v: m.deadFiles || 0, bad: "text-accent-amber" },
    { label: "Secrets", sub: "Hardcoded patterns", v: m.exposedSecrets || 0, bad: "text-destructive" },
  ];

  const tone = scoreTone(data?.score ?? 0);
  const scanned = data?.lastScanned
    ? new Date(data.lastScanned).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <PageHeader
        icon={Activity}
        title="Repository health"
        description="A 0–100 grade for architecture, complexity, hygiene, documentation and security."
        actions={
          <>
            {scanned && <span className="text-xs text-muted-foreground">Scanned {scanned}</span>}
            <Button size="sm" variant="outline" onClick={handleRefresh} disabled={isHealthLoading} className="h-8 gap-1.5 text-xs font-semibold">
              <RefreshCw className={cn("h-3.5 w-3.5", isHealthLoading && "animate-spin text-primary")} />
              {isHealthLoading ? "Evaluating…" : "Recompute score"}
            </Button>
          </>
        }
      />

      {isHealthLoading && !data ? (
        <div className="space-y-6">
          <Skeleton className="h-80 rounded-2xl" />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <Skeleton className="h-96 rounded-2xl lg:col-span-7" />
            <Skeleton className="h-96 rounded-2xl lg:col-span-5" />
          </div>
        </div>
      ) : !data ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
            <Activity className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-bold text-foreground">No health report yet</h3>
          <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
            Run a scan to grade your architecture and find dependency debt.
          </p>
          <Button size="sm" onClick={handleRefresh} className="mt-4 gap-1.5 text-xs font-semibold">
            <RefreshCw className="h-3.5 w-3.5" />
            Analyze repository
          </Button>
        </div>
      ) : (
        <FadeIn className="space-y-6">
          {/* ─── Scorecard ─────────────────────────────────────── */}
          <section className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="grid grid-cols-1 lg:grid-cols-12">
              <div className="flex flex-col items-center justify-center gap-3 p-6 lg:col-span-4">
                <p className="self-start text-xs font-medium text-muted-foreground">Overall health</p>
                <HealthGauge score={data.score} grade={data.grade} size={220} />
              </div>

              <div className="border-t border-border p-6 lg:col-span-4 lg:border-l lg:border-t-0">
                <p className="mb-2 text-xs font-medium text-muted-foreground">Balance across pillars</p>
                <HealthRadar items={pillars} />
              </div>

              <div className="flex flex-col gap-4 border-t border-border p-6 lg:col-span-4 lg:border-l lg:border-t-0">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Verdict</p>
                  <h2 className={cn("mt-1 text-2xl font-extrabold tracking-tight", tone.text)}>{tone.label}</h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {data.score >= 85
                      ? "Healthy architecture with low tech debt."
                      : quickFixes.length > 0
                        ? `${quickFixes.length} quick fix${quickFixes.length === 1 ? "" : "es"} found. Working through them is the fastest way to raise your grade.`
                        : "Review the pillars on the left to see where points are being lost."}
                  </p>
                </div>

                <dl className="space-y-2.5 rounded-xl border border-border bg-secondary/40 p-3.5 text-xs">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted-foreground">Biggest drag</dt>
                    <dd className="truncate font-semibold text-foreground">
                      {byImpact[0]?.short} (−{byImpact[0]?.pts.toFixed(1)} pts)
                    </dd>
                  </div>
                  {potential > 0 && (
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-muted-foreground">Recoverable with quick fixes</dt>
                      <dd className="font-semibold text-accent-emerald">up to +{Math.round(potential)} pts</dd>
                    </div>
                  )}
                </dl>

                <Link
                  to={`/projects/${id}/visualise`}
                  className="group mt-auto flex items-center justify-between rounded-xl border border-border px-3.5 py-2.5 text-xs font-semibold text-foreground transition-colors hover:border-primary/40 hover:bg-secondary/60"
                >
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    Open dependency graph
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>

            {/* Vitals strip */}
            <dl className="grid grid-cols-2 divide-x divide-y divide-border border-t border-border sm:grid-cols-5 sm:divide-y-0">
              {vitals.map((v) => (
                <div key={v.label} className="p-4">
                  <dt className="text-xs text-muted-foreground">{v.label}</dt>
                  <dd className={cn("mt-1 text-2xl font-extrabold tabular-nums tracking-tight", v.neutral ? "text-foreground" : v.v > 0 ? v.bad : "text-accent-emerald")}>
                    <CountUp value={v.v} />
                  </dd>
                  <p className="mt-0.5 text-[11px] text-text-muted">{v.sub}</p>
                </div>
              ))}
            </dl>
          </section>

          {/* ─── Pillars + quick fixes ─────────────────────────── */}
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
            {/* Pillars */}
            <section className="rounded-2xl border border-border bg-card lg:col-span-7">
              <div className="flex flex-wrap items-end justify-between gap-2 border-b border-border px-5 py-4">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Where your points are going</h3>
                  <p className="text-xs text-muted-foreground">Sorted by impact. Points lost = (100 − score) × weight.</p>
                </div>
              </div>

              <ScrollReveal className="divide-y divide-border">
                {byImpact.map((p, i) => {
                  const t = scoreTone(p.score);
                  return (
                    <div key={p.title} data-row className="space-y-3 px-5 py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 items-start gap-3">
                          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                            <p.icon className="h-4 w-4" />
                          </span>
                          <div className="min-w-0">
                            <h4 className="text-[13px] font-semibold text-foreground">{p.title}</h4>
                            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{p.desc}</p>
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className={cn("text-lg font-extrabold tabular-nums leading-none", t.text)}>
                            <CountUp value={p.score} />%
                          </div>
                          <span className="mt-1 block text-[11px] text-muted-foreground">−{p.pts.toFixed(1)} pts</span>
                        </div>
                      </div>

                      <GrowBar value={p.score} className={t.bar} delay={i * 0.05} />

                      <div className="flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
                        <span className="truncate font-mono">{p.info?.details || "No diagnostic flags"}</span>
                        <span className="shrink-0">
                          {p.info?.status || "Normal"} · weight {Math.round(p.w * 100)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </ScrollReveal>
            </section>

            {/* Quick fixes */}
            <aside className="lg:sticky lg:top-16 lg:col-span-5">
              <section className="rounded-2xl border border-border bg-card">
                <div className="flex items-center justify-between gap-2 border-b border-border px-5 py-4">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Quick fixes</h3>
                    <p className="text-xs text-muted-foreground">Start at the top for the biggest gains.</p>
                  </div>
                  <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                    {quickFixes.length} found
                  </span>
                </div>

                {quickFixes.length === 0 ? (
                  <div className="px-5 py-10 text-center">
                    <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-accent-emerald" />
                    <h4 className="text-xs font-bold text-foreground">No critical code smells</h4>
                    <p className="mt-0.5 text-xs text-muted-foreground">No circular dependencies or god files found.</p>
                  </div>
                ) : (
                  <div data-lenis-prevent className="max-h-[calc(100vh-11rem)] space-y-3 overflow-y-auto p-4">
                    {quickFixes.map((fix) => (
                      <QuickFixCard key={fix.id} fix={fix} projectId={id} />
                    ))}
                  </div>
                )}
              </section>
            </aside>
          </div>
        </FadeIn>
      )}
    </div>
  );
}
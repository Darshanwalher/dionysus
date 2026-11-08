import React, { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchProject, fetchHealth, refreshHealth } from "@/store/slices/projectSlice";
import HealthGauge from "@/components/health/HealthGauge";
import QuickFixCard from "@/components/health/QuickFixCard";
import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Activity,
  RefreshCw,
  ShieldCheck,
  Cpu,
  Layers,
  BookOpen,
  Lock,
  ArrowRight,
  CheckCircle2,
  Flame,
} from "lucide-react";

export default function ProjectHealth() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { currentProject, healthScore, isHealthLoading } = useSelector(
    (state) => state.project
  );

  useEffect(() => {
    if (!currentProject || (currentProject._id !== id && currentProject.id !== id)) {
      dispatch(fetchProject(id));
    }
  }, [dispatch, id, currentProject]);

  useEffect(() => {
    if (id && !healthScore && !isHealthLoading) {
      dispatch(fetchHealth(id));
    }
  }, [dispatch, id, healthScore, isHealthLoading]);

  const handleRefresh = () => {
    dispatch(refreshHealth(id));
  };

  const data = healthScore || currentProject?.healthScore;
  const breakdown = data?.breakdown || {};
  const metrics = data?.metricsSummary || {};
  const quickFixes = data?.actionableQuickFixes || [];

  const categoryCards = [
    {
      title: "Architecture & Coupling",
      weight: "30%",
      icon: Layers,
      info: breakdown.architecture,
      color: "text-indigo-400",
      description: "Evaluation of circular dependency cycles, layered abstraction, and blast radius.",
    },
    {
      title: "Code Complexity & Size",
      weight: "25%",
      icon: Cpu,
      info: breakdown.complexity,
      color: "text-cyan-400",
      description: "Detection of God files (>500 LOC), fan-out degree, and cognitive complexity.",
    },
    {
      title: "Dead Code & Hygiene",
      weight: "15%",
      icon: Flame,
      info: breakdown.deadCode,
      color: "text-amber-400",
      description: "Isolated source files with 0 callers, unreferenced modules, and dead waste.",
    },
    {
      title: "Documentation & Onboarding",
      weight: "15%",
      icon: BookOpen,
      info: breakdown.onboarding,
      color: "text-emerald-400",
      description: "Availability of README, environment templates (.env.example), and license.",
    },
    {
      title: "Security & Dependencies",
      weight: "15%",
      icon: Lock,
      info: breakdown.security,
      color: "text-red-400",
      description: "Detection of hardcoded secrets, package lockfiles, and package hygiene.",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Page Header */}
      <PageHeader
        title="Repository Health Score"
        description="Comprehensive 0–100 architectural grade, code smell diagnostics, and automated tech debt remediation."
        badge="Engine v2.0"
        action={
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            disabled={isHealthLoading}
            className="gap-1.5 text-xs font-semibold"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isHealthLoading ? "animate-spin text-primary" : ""}`} />
            <span>{isHealthLoading ? "Evaluating Repo..." : "Recompute Score"}</span>
          </Button>
        }
      />

      {isHealthLoading && !data ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 md:col-span-2 rounded-xl" />
        </div>
      ) : !data ? (
        <Card className="text-center p-8">
          <div className="mx-auto h-12 w-12 rounded-xl bg-secondary border border-border flex items-center justify-center mb-3">
            <Activity className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-bold text-foreground">No Health Report Generated</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
            Connect your repository and run a scan to analyze architecture health and dependency debt.
          </p>
          <Button size="sm" onClick={handleRefresh} className="mt-4 gap-1.5 text-xs font-semibold">
            <RefreshCw className="h-3.5 w-3.5" /> Analyze Repository Now
          </Button>
        </Card>
      ) : (
        <>
          {/* Top Row: Overall Scorecard & Metric Counter */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Overall Score Radial Card */}
            <Card className="md:col-span-4 flex flex-col justify-between p-6 bg-card border-border shadow-xs">
              <div>
                <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                  Overall Health Index
                </span>
                <h3 className="text-base font-bold text-foreground mt-0.5">
                  Codebase Quality Rating
                </h3>
              </div>

              <div className="my-4 flex justify-center">
                <HealthGauge score={data.score} grade={data.grade} size={170} />
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-between text-xs font-mono text-muted-foreground">
                <span>Last Scanned</span>
                <span>{new Date(data.lastScanned).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </Card>

            {/* Metrics Breakdown Stats Grid */}
            <Card className="md:col-span-8 p-6 bg-card border-border flex flex-col justify-between shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                    Codebase Telemetry
                  </span>
                  <h3 className="text-base font-bold text-foreground mt-0.5">
                    Architectural & Structural Vitals
                  </h3>
                </div>
                <Badge variant="outline" className="font-mono text-xs">
                  {metrics.totalFiles || 0} Files Evaluated
                </Badge>
              </div>

              {/* 4 Stat Boxes */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-auto">
                <div className="p-3 rounded-lg border border-border bg-secondary/30">
                  <span className="text-[10px] font-mono text-muted-foreground uppercase">Cycles</span>
                  <div className={`text-xl font-bold font-mono mt-1 ${metrics.circularDependencies > 0 ? "text-red-500" : "text-emerald-500"}`}>
                    {metrics.circularDependencies || 0}
                  </div>
                  <span className="text-[10px] text-muted-foreground">Circular imports</span>
                </div>

                <div className="p-3 rounded-lg border border-border bg-secondary/30">
                  <span className="text-[10px] font-mono text-muted-foreground uppercase">God Files</span>
                  <div className={`text-xl font-bold font-mono mt-1 ${metrics.godFiles > 0 ? "text-amber-500" : "text-emerald-500"}`}>
                    {metrics.godFiles || 0}
                  </div>
                  <span className="text-[10px] text-muted-foreground">&gt;500 Lines of code</span>
                </div>

                <div className="p-3 rounded-lg border border-border bg-secondary/30">
                  <span className="text-[10px] font-mono text-muted-foreground uppercase">Dead Files</span>
                  <div className={`text-xl font-bold font-mono mt-1 ${metrics.deadFiles > 0 ? "text-amber-500" : "text-emerald-500"}`}>
                    {metrics.deadFiles || 0}
                  </div>
                  <span className="text-[10px] text-muted-foreground">0 Callers / usages</span>
                </div>

                <div className="p-3 rounded-lg border border-border bg-secondary/30">
                  <span className="text-[10px] font-mono text-muted-foreground uppercase">Secrets</span>
                  <div className={`text-xl font-bold font-mono mt-1 ${metrics.exposedSecrets > 0 ? "text-red-500" : "text-emerald-500"}`}>
                    {metrics.exposedSecrets || 0}
                  </div>
                  <span className="text-[10px] text-muted-foreground">Hardcoded patterns</span>
                </div>
              </div>

              {/* Status Note */}
              <div className="mt-4 p-3 rounded-lg border border-primary/20 bg-primary/5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-foreground">
                    {data.score >= 85
                      ? "Healthy codebase architecture with high testability and low tech debt."
                      : "Action items identified. Resolving top circular loops will boost your grade."}
                  </span>
                </div>
                <Link
                  to={`/projects/${id}/visualise`}
                  className="font-semibold text-primary hover:underline flex items-center gap-1 shrink-0 ml-2"
                >
                  <span>Open DAG</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </Card>
          </div>

          {/* Middle Row: Category Progress Breakdown */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-foreground">
              Evaluated Pillars & Weighted Scores
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryCards.map((cat) => {
                const CatIcon = cat.icon;
                const scoreVal = cat.info?.score ?? 0;
                return (
                  <Card key={cat.title} className="p-4 bg-card border-border flex flex-col justify-between shadow-2xs">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-md bg-secondary border border-border ${cat.color}`}>
                            <CatIcon className="h-4 w-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-foreground leading-tight">
                              {cat.title}
                            </h4>
                            <span className="text-[10px] font-mono text-muted-foreground">
                              Weight: {cat.weight}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-sm font-mono font-bold text-foreground">
                            {scoreVal}%
                          </span>
                          <span className="block text-[9px] font-mono text-muted-foreground uppercase">
                            {cat.info?.status || "Normal"}
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden my-2">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            scoreVal >= 85
                              ? "bg-emerald-500"
                              : scoreVal >= 70
                              ? "bg-cyan-500"
                              : scoreVal >= 55
                              ? "bg-amber-500"
                              : "bg-red-500"
                          }`}
                          style={{ width: `${scoreVal}%` }}
                        />
                      </div>

                      <p className="text-[11px] text-muted-foreground leading-relaxed mt-2">
                        {cat.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-border/50 text-[10px] font-mono text-muted-foreground truncate">
                      {cat.info?.details || "No diagnostic flags"}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Bottom Row: Actionable Quick Fixes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-foreground">
                  Actionable Quick Fixes
                </h3>
                <Badge variant="outline" className="text-[10px] font-mono">
                  {quickFixes.length} Remedies Found
                </Badge>
              </div>
            </div>

            {quickFixes.length === 0 ? (
              <Card className="p-6 text-center bg-card border-border">
                <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                <h4 className="text-xs font-bold text-foreground">Zero Critical Code Smells</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Your architecture is exceptionally clean without circular dependencies or god files.
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {quickFixes.map((fix) => (
                  <QuickFixCard key={fix.id} fix={fix} projectId={id} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

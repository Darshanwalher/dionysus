import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import { updateProject, deleteProject } from "@/store/slices/projectSlice";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { prefersReduced, Pop } from "@/components/motion";
import {
  Settings,
  X,
  Trash2,
  AlertTriangle,
  Save,
  Copy,
  Check,
  GitBranch,
  Users,
  ShieldAlert,
  Calendar,
  Layers,
  ArrowUpRight,
} from "lucide-react";

const HOLD_SECONDS = 1.1;

const DELETED_ITEMS = [
  "Commit summaries",
  "Generated documentation",
  "Meeting transcripts",
  "Search index (Pinecone vectors)",
];

/**
 * Mount-gate: the modal's state and animations live in ModalInner, which only
 * exists while the modal is open, so every open starts from a clean slate.
 */
export default function ProjectSettingsModal({ project, isOpen, onClose }) {
  if (!isOpen || !project) return null;
  return <ModalInner project={project} onClose={onClose} />;
}

function ModalInner({ project, onClose }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isActionLoading } = useSelector((state) => state.project);

  const [activeTab, setActiveTab] = useState("general"); // "general" | "danger"
  const [name, setName] = useState(project.name || "");
  const [confirmName, setConfirmName] = useState("");
  const [copiedId, setCopiedId] = useState(false);
  const [holding, setHolding] = useState(false);

  const rootRef = useRef(null);
  const backdropRef = useRef(null);
  const panelRef = useRef(null);
  const paneRef = useRef(null);
  const pillRef = useRef(null);
  const accentRef = useRef(null);
  const fillRef = useRef(null);
  const holdTween = useRef(null);
  const openTl = useRef(null);
  const closing = useRef(false);
  const firstPane = useRef(true);

  const isDanger = activeTab === "danger";
  const armed = confirmName.trim() === project.name;

  /* ── Close with an exit animation ───────────────────────────────── */
  const requestClose = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    if (prefersReduced() || !panelRef.current) {
      onClose();
      return;
    }
    // stop the opening sequence so the two never fight over the same properties
    openTl.current?.kill();
    gsap.killTweensOf([panelRef.current, backdropRef.current, "[data-item]", "[data-head] > *"]);

    gsap
      .timeline({ defaults: { ease: "power3.inOut" }, onComplete: onClose })
      // content lets go first
      .to("[data-item]", { y: -6, opacity: 0, duration: 0.25, stagger: { each: 0.03, from: "end" }, ease: "power2.in" }, 0)
      // then the panel drifts down and shrinks away
      .to(panelRef.current, { y: 28, scale: 0.95, opacity: 0, duration: 0.5 }, 0.08)
      // backdrop fades last, so the page returns gently
      .to(backdropRef.current, { opacity: 0, duration: 0.5, ease: "power2.inOut" }, 0.15);
  }, [onClose]);

  /* ── ESC to close + lock page scroll while open ─────────────────── */
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && requestClose();
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [requestClose]);

  /* ── Opening sequence: the one orchestrated moment ──────────────── */
  useLayoutEffect(() => {
    if (prefersReduced() || !rootRef.current) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
      openTl.current = tl;
      tl.fromTo(backdropRef.current, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: "power2.out" }, 0)
        .fromTo(
          panelRef.current,
          { y: 48, scale: 0.94, opacity: 0 },
          { y: 0, scale: 1, opacity: 1, duration: 0.9, clearProps: "transform,opacity" },
          0.08
        )
        .fromTo(
          "[data-gear]",
          { rotate: -140, scale: 0.5, opacity: 0 },
          { rotate: 0, scale: 1, opacity: 1, duration: 1.1, ease: "back.out(1.6)", clearProps: "transform,opacity" },
          0.25
        )
        .fromTo(
          "[data-head] > *",
          { y: 14, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.7, stagger: 0.09, clearProps: "transform,opacity" },
          0.35
        );

      // one soft light drifting behind the header
      gsap.to("[data-blob]", { x: -36, y: 14, duration: 6, repeat: -1, yoyo: true, ease: "sine.inOut" });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  /* ── Tab change: slide the pill, sweep the accent line ──────────── */
  useLayoutEffect(() => {
    if (prefersReduced()) {
      gsap.set(pillRef.current, { xPercent: isDanger ? 100 : 0 });
      return;
    }
    gsap.to(pillRef.current, { xPercent: isDanger ? 100 : 0, duration: 0.45, ease: "power3.inOut" });
    gsap.fromTo(
      accentRef.current,
      { scaleX: 0 },
      { scaleX: 1, duration: 0.7, ease: "power3.out", clearProps: "transform" }
    );
  }, [isDanger]);

  /* ── Pane content eases in item by item ─────────────────────────── */
  useLayoutEffect(() => {
    if (!paneRef.current || prefersReduced()) return;
    const delay = firstPane.current ? 0.55 : 0;
    firstPane.current = false;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-item]",
        { y: 10, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.07, delay, ease: "expo.out", clearProps: "transform,opacity" }
      );
      if (isDanger) {
        gsap.fromTo(
          "[data-warn]",
          { rotate: -14 },
          { rotate: 0, duration: 0.9, ease: "elastic.out(1, 0.35)", delay: 0.1 }
        );
      }
    }, paneRef);
    return () => ctx.revert();
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Handlers ───────────────────────────────────────────────────── */
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Project name cannot be empty");
      return;
    }
    const res = await dispatch(updateProject({ projectId: project._id, name: name.trim() }));
    if (res.meta.requestStatus === "fulfilled") {
      toast.success("Project updated successfully");
      requestClose();
    } else {
      toast.error(res.payload || "Failed to update project");
    }
  };

  const handleDelete = async () => {
    holdTween.current = null;
    if (confirmName.trim() !== project.name) {
      toast.error("Project name confirmation does not match");
      return;
    }
    const res = await dispatch(deleteProject(project._id));
    if (res.meta.requestStatus === "fulfilled") {
      toast.success(`Project "${project.name}" has been deleted`);
      onClose();
      navigate("/");
    } else {
      setHolding(false);
      gsap.to(fillRef.current, { scaleX: 0, duration: 0.3, ease: "power2.out" });
      toast.error(res.payload || "Failed to delete project");
    }
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(project._id);
    setCopiedId(true);
    toast.success("Project ID copied to clipboard");
    setTimeout(() => setCopiedId(false), 2000);
  };

  /* Hold-to-delete: the fill is the confirmation */
  const startHold = () => {
    if (!armed || isActionLoading || holdTween.current) return;
    setHolding(true);
    holdTween.current = gsap.fromTo(
      fillRef.current,
      { scaleX: 0 },
      { scaleX: 1, duration: HOLD_SECONDS, ease: "none", onComplete: handleDelete }
    );
  };

  const cancelHold = () => {
    if (!holdTween.current) return;
    holdTween.current.kill();
    holdTween.current = null;
    setHolding(false);
    gsap.to(fillRef.current, { scaleX: 0, duration: 0.3, ease: "power2.out" });
  };

  const formattedDate = project.createdAt
    ? new Date(project.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
    : null;

  const memberCount = project.members?.length || 1;
  const repo = project.githubUrl?.replace("https://github.com/", "");

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Project settings"
    >
      {/* Backdrop */}
      <div ref={backdropRef} onClick={requestClose} className="absolute inset-0 bg-foreground/35 backdrop-blur-sm" />

      {/* Panel */}
      <div
        ref={panelRef}
        className="relative flex w-full max-w-lg transform-gpu flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[0_32px_80px_-24px_rgba(16,33,31,0.45)] will-change-transform"
      >
        {/* Accent line: teal normally, red in the danger zone */}
        <div
          ref={accentRef}
          className={cn(
            "h-[3px] w-full origin-left transition-colors duration-500",
            isDanger ? "bg-destructive" : "bg-primary"
          )}
        />

        {/* Header */}
        <div className="relative overflow-hidden border-b border-border px-6 pb-4 pt-5">
          <div
            data-blob
            className={cn(
              "pointer-events-none absolute -right-10 -top-16 h-44 w-44 rounded-full blur-3xl transition-colors duration-700",
              isDanger ? "bg-destructive/20" : "bg-highlight/25"
            )}
          />
          <div className="relative flex items-center justify-between gap-3">
            <div data-head className="flex min-w-0 items-center gap-3">
              <div
                data-gear
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-card transition-colors duration-500",
                  isDanger ? "border-destructive/30 text-destructive" : "border-border text-primary"
                )}
              >
                <Settings className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold tracking-tight text-foreground">Project settings</h2>
                  <Badge variant="secondary" className="h-4 px-1.5 py-0 text-[10px]">
                    Owner
                  </Badge>
                </div>
                <p className="max-w-[260px] truncate text-xs text-muted-foreground">{project.name}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={requestClose}
              title="Close (Esc)"
              aria-label="Close settings"
              className="relative flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-all hover:rotate-90 hover:bg-secondary hover:text-foreground active:scale-95"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tabs with a sliding pill */}
        <div className="px-6 pb-1 pt-4">
          <div role="tablist" className="relative grid grid-cols-2 rounded-xl border border-border bg-secondary/60 p-1 text-xs">
            <span
              ref={pillRef}
              aria-hidden="true"
              className={cn(
                "absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-lg border shadow-sm transition-colors duration-500",
                isDanger ? "border-destructive/30 bg-destructive/10" : "border-border bg-card"
              )}
            />
            <button
              type="button"
              role="tab"
              aria-selected={!isDanger}
              onClick={() => setActiveTab("general")}
              className={cn(
                "relative z-10 flex cursor-pointer items-center justify-center gap-2 rounded-lg px-3 py-2 font-medium transition-colors",
                !isDanger ? "font-semibold text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Settings className="h-3.5 w-3.5" />
              General
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={isDanger}
              onClick={() => setActiveTab("danger")}
              className={cn(
                "relative z-10 flex cursor-pointer items-center justify-center gap-2 rounded-lg px-3 py-2 font-medium transition-colors",
                isDanger ? "font-semibold text-destructive" : "text-muted-foreground hover:text-destructive"
              )}
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              Danger zone
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="max-h-[70vh] overflow-y-auto p-6 pt-4">
          <div ref={paneRef} key={activeTab}>
            {/* ───────────── General ───────────── */}
            {!isDanger && (
              <form onSubmit={handleUpdate} className="space-y-6">
                <div data-item className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="project-name" className="text-xs font-medium text-foreground">
                      Project name
                    </Label>
                    <span
                      className={cn(
                        "font-mono text-[11px] tabular-nums transition-colors",
                        name.length >= 54 ? "text-highlight" : "text-muted-foreground"
                      )}
                    >
                      {name.length}/60
                    </span>
                  </div>
                  <Input
                    id="project-name"
                    value={name}
                    maxLength={60}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Dionysus AI Suite"
                    className="h-10 text-sm"
                    autoFocus
                  />
                </div>

                <div data-item>
                  <p className="mb-1 text-xs font-semibold text-foreground">Workspace details</p>
                  <dl className="divide-y divide-border text-xs">
                    <div className="flex items-center justify-between gap-2 py-2.5">
                      <dt className="flex items-center gap-2 text-muted-foreground">
                        <Layers className="h-3.5 w-3.5" />
                        Project ID
                      </dt>
                      <dd>
                        <button
                          type="button"
                          onClick={handleCopyId}
                          title="Copy project ID"
                          className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border bg-secondary px-2 py-1 font-mono text-[11px] text-muted-foreground transition-all hover:text-foreground active:scale-95"
                        >
                          {copiedId ? (
                            <>
                              <Pop>
                                <Check className="h-3 w-3 text-accent-emerald" />
                              </Pop>
                              <span className="font-semibold text-accent-emerald">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              {project._id.slice(0, 12)}…
                            </>
                          )}
                        </button>
                      </dd>
                    </div>

                    <div className="flex items-center justify-between gap-2 py-2.5">
                      <dt className="flex items-center gap-2 text-muted-foreground">
                        <GitBranch className="h-3.5 w-3.5" />
                        GitHub repository
                      </dt>
                      <dd>
                        {repo ? (
                          <a
                            href={project.githubUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="group inline-flex items-center gap-1 font-mono text-[11px] text-primary hover:underline"
                          >
                            <span className="max-w-[200px] truncate">{repo}</span>
                            <ArrowUpRight className="h-3 w-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                          </a>
                        ) : (
                          <Badge variant="secondary" className="text-[10px] font-normal text-muted-foreground">
                            None linked
                          </Badge>
                        )}
                      </dd>
                    </div>

                    <div className="flex items-center justify-between gap-2 py-2.5">
                      <dt className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        Collaborators
                      </dt>
                      <dd className="font-medium text-foreground">
                        {memberCount} member{memberCount === 1 ? "" : "s"}
                      </dd>
                    </div>

                    {formattedDate && (
                      <div className="flex items-center justify-between gap-2 py-2.5">
                        <dt className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          Created
                        </dt>
                        <dd className="font-mono text-muted-foreground">{formattedDate}</dd>
                      </div>
                    )}
                  </dl>
                </div>

                <div data-item className="flex items-center justify-end gap-2.5">
                  <Button type="button" variant="outline" size="sm" onClick={requestClose} className="h-9 cursor-pointer px-4 text-xs">
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isActionLoading || !name.trim() || name.trim() === project.name}
                    className="h-9 cursor-pointer px-4 text-xs font-semibold disabled:cursor-not-allowed"
                  >
                    <Save className="mr-1.5 h-3.5 w-3.5" />
                    Save changes
                  </Button>
                </div>
              </form>
            )}

            {/* ───────────── Danger zone ───────────── */}
            {isDanger && (
              <div className="space-y-5">
                <div data-item className="space-y-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-destructive">
                    <AlertTriangle data-warn className="h-4 w-4 shrink-0" />
                    This can't be undone
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Deleting this project permanently removes everything generated from it, in both MongoDB and Pinecone.
                  </p>
                  <ul className="grid grid-cols-1 gap-1.5 text-xs text-foreground sm:grid-cols-2">
                    {DELETED_ITEMS.map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div data-item className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <Label htmlFor="confirm-delete" className="font-medium text-foreground">
                      Type the project name to confirm
                    </Label>
                    <button
                      type="button"
                      onClick={() => setConfirmName(project.name)}
                      className="cursor-pointer text-[11px] text-primary hover:underline"
                    >
                      Fill in name
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      id="confirm-delete"
                      value={confirmName}
                      onChange={(e) => setConfirmName(e.target.value)}
                      placeholder={project.name}
                      className={cn(
                        "h-10 pr-9 font-mono text-sm transition-colors",
                        armed ? "border-destructive focus-visible:ring-destructive/30" : "border-destructive/30"
                      )}
                      autoFocus
                    />
                    {armed && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Pop>
                          <Check className="h-4 w-4 text-destructive" />
                        </Pop>
                      </span>
                    )}
                  </div>
                </div>

                <div data-item className="flex items-center justify-between gap-3 border-t border-border pt-4">
                  <Button type="button" variant="outline" size="sm" onClick={requestClose} className="h-9 cursor-pointer px-4 text-xs">
                    Keep project
                  </Button>

                  {/* Hold to delete */}
                  <button
                    type="button"
                    disabled={!armed || isActionLoading}
                    onPointerDown={startHold}
                    onPointerUp={cancelHold}
                    onPointerLeave={cancelHold}
                    onPointerCancel={cancelHold}
                    onKeyDown={(e) => {
                      if ((e.key === " " || e.key === "Enter") && !e.repeat) {
                        e.preventDefault();
                        startHold();
                      }
                    }}
                    onKeyUp={(e) => (e.key === " " || e.key === "Enter") && cancelHold()}
                    onBlur={cancelHold}
                    className={cn(
                      "relative h-9 touch-none select-none overflow-hidden rounded-lg border px-4 text-xs font-semibold transition-colors",
                      armed
                        ? "cursor-pointer border-destructive text-destructive hover:bg-destructive/5"
                        : "cursor-not-allowed border-border text-muted-foreground opacity-50"
                    )}
                  >
                    <span ref={fillRef} aria-hidden="true" className="absolute inset-0 origin-left scale-x-0 bg-destructive/25" />
                    <span className="relative flex items-center gap-1.5">
                      <Trash2 className="h-3.5 w-3.5" />
                      {isActionLoading ? "Deleting…" : holding ? "Keep holding…" : "Hold to delete project"}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
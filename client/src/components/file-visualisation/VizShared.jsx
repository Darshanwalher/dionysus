import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

/* One place for all motion on the visualiser page.
   Rule: transform + opacity only (no filter / box-shadow animation), so
   panning, zooming and typing stay smooth even on large graphs. */
export const VIZ_CSS = `
@keyframes viz-in      { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
@keyframes viz-fade    { from { opacity: 0; } to { opacity: 1; } }
@keyframes viz-scale   { from { opacity: 0; transform: scale(.985); } to { opacity: 1; transform: none; } }
@keyframes viz-pop     { 0% { opacity: 0; transform: scale(.55); } 60% { opacity: 1; transform: scale(1.2); } 100% { opacity: 1; transform: scale(1); } }
@keyframes viz-grow    { from { transform: scaleX(0); } to { transform: scaleX(1); } }
@keyframes viz-ring    { 0% { opacity: .55; transform: scale(.92); } 100% { opacity: 0; transform: scale(1.7); } }
@keyframes viz-bar     { 0% { transform: translateX(-100%); } 100% { transform: translateX(260%); } }

.viz-in        { animation: viz-in .32s cubic-bezier(.22,1,.36,1) both; }
.viz-fade      { animation: viz-fade .3s ease both; }
.viz-view-in   { animation: viz-in .3s cubic-bezier(.22,1,.36,1) both; }
.viz-fs-in     { animation: viz-scale .26s cubic-bezier(.22,1,.36,1) both; }
.viz-pop       { animation: viz-pop .36s cubic-bezier(.22,1,.36,1) both; }
.viz-grow      { transform-origin: left center; animation: viz-grow .55s cubic-bezier(.22,1,.36,1) both; }
.viz-ring      { animation: viz-ring 1.8s ease-out infinite; }
.viz-bar       { width: 40%; animation: viz-bar 1.15s ease-in-out infinite; }
.viz-tree-open { animation: viz-in .18s ease-out both; }
.viz-svg-in    { animation: viz-fade .35s ease both; }

.viz-pill { transition: transform .32s cubic-bezier(.22,1,.36,1), width .32s cubic-bezier(.22,1,.36,1); will-change: transform, width; }
.viz-pill-still { transition: none; }

/* Mermaid highlight: stroke colour instead of drop-shadow filters (much cheaper) */
.mermaid-wrapper .node { transition: opacity .2s ease; }
.viz-node-sel :is(rect, polygon, path, circle, ellipse) { stroke: #f59e0b !important; stroke-width: 3px !important; }
.viz-node-hit :is(rect, polygon, path, circle, ellipse) { stroke: #38bdf8 !important; stroke-width: 2.5px !important; }

@media (prefers-reduced-motion: reduce) {
  .viz-in, .viz-fade, .viz-view-in, .viz-fs-in, .viz-pop, .viz-tree-open, .viz-svg-in, .viz-grow { animation: none !important; }
  .viz-ring, .viz-bar { animation: none !important; }
  .viz-pill, .mermaid-wrapper .node { transition: none !important; }
}
`;

export function VizStyles() {
  return <style>{VIZ_CSS}</style>;
}

const TONES = {
  amber: { border: "border-amber-500/40", box: "border-amber-500/40 bg-amber-500/10", icon: "text-amber-500", bar: "bg-amber-500" },
  emerald: { border: "border-emerald-500/40", box: "border-emerald-500/40 bg-emerald-500/10", icon: "text-emerald-500", bar: "bg-emerald-500" },
  indigo: { border: "border-indigo-500/40", box: "border-indigo-500/40 bg-indigo-500/10", icon: "text-indigo-400", bar: "bg-indigo-500" },
};

export function LoadingState({ icon: Icon, tone = "amber", title, text }) {
  const t = TONES[tone] || TONES.amber;
  return (
    <div className="viz-fade flex flex-col items-center justify-center h-full gap-5">
      <div className="relative h-14 w-14">
        <span className={`viz-ring absolute inset-0 rounded-2xl border-2 ${t.border}`} />
        <div className={`relative h-14 w-14 rounded-2xl border-2 ${t.box} flex items-center justify-center`}>
          <Icon className={`h-7 w-7 ${t.icon}`} />
        </div>
      </div>
      <div className="text-center max-w-xs space-y-1">
        <h4 className="text-sm font-semibold text-foreground tracking-tight">{title}</h4>
        <p className="text-[11px] text-muted-foreground leading-relaxed">{text}</p>
      </div>
      <div className="h-0.5 w-40 overflow-hidden rounded-full bg-border">
        <div className={`viz-bar h-full rounded-full ${t.bar}`} />
      </div>
    </div>
  );
}

export function ErrorState({ title, message, onRetry, retryLabel = "Retry" }) {
  return (
    <div className="viz-in flex flex-col items-center justify-center h-full gap-4">
      <div className="h-11 w-11 rounded-xl bg-destructive/10 border-2 border-destructive/30 flex items-center justify-center">
        <AlertCircle className="h-5 w-5 text-destructive" />
      </div>
      <div className="text-center max-w-sm space-y-1">
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        {message && <p className="text-xs text-muted-foreground">{message}</p>}
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="text-xs transition-transform active:scale-95">
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          {retryLabel}
        </Button>
      )}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, text, actionLabel, actionIcon: ActionIcon, onAction }) {
  return (
    <div className="viz-in flex flex-col items-center justify-center h-full gap-4 p-6 text-center">
      <div className="h-11 w-11 rounded-xl bg-muted/40 border-2 border-border flex items-center justify-center">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="max-w-xs space-y-1">
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        <p className="text-xs text-muted-foreground leading-relaxed">{text}</p>
      </div>
      {onAction && (
        <Button size="sm" onClick={onAction} className="text-xs font-semibold transition-transform active:scale-95">
          {ActionIcon && <ActionIcon className="h-3.5 w-3.5 mr-1.5" />}
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
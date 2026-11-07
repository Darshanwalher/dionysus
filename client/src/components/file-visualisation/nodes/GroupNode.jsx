import React, { memo } from "react";
import {
  Layout,
  Server,
  Database,
  Cpu,
  Globe,
  Boxes,
  Workflow,
  Sparkles,
  Shield,
} from "lucide-react";

const GROUP_ICONS = {
  frontend: Layout,
  client: Layout,
  ui: Layout,
  backend: Server,
  server: Server,
  api: Server,
  database: Database,
  db: Database,
  models: Database,
  services: Cpu,
  service: Cpu,
  ai: Sparkles,
  external: Globe,
  auth: Shield,
  workers: Workflow,
};

const GROUP_PALETTES = {
  frontend: {
    border: "border-sky-500/35 dark:border-sky-500/30",
    bg: "bg-sky-500/[0.015] dark:bg-sky-500/[0.02]",
    headerBg: "bg-sky-500/10 dark:bg-sky-500/15",
    text: "text-sky-600 dark:text-sky-400",
    badge: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/25",
    accent: "#0284c7",
  },
  backend: {
    border: "border-purple-500/35 dark:border-purple-500/30",
    bg: "bg-purple-500/[0.015] dark:bg-purple-500/[0.02]",
    headerBg: "bg-purple-500/10 dark:bg-purple-500/15",
    text: "text-purple-600 dark:text-purple-400",
    badge: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/25",
    accent: "#9333ea",
  },
  database: {
    border: "border-amber-500/35 dark:border-amber-500/30",
    bg: "bg-amber-500/[0.015] dark:bg-amber-500/[0.02]",
    headerBg: "bg-amber-500/10 dark:bg-amber-500/15",
    text: "text-amber-600 dark:text-amber-400",
    badge: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25",
    accent: "#d97706",
  },
  ai: {
    border: "border-fuchsia-500/35 dark:border-fuchsia-500/30",
    bg: "bg-fuchsia-500/[0.015] dark:bg-fuchsia-500/[0.02]",
    headerBg: "bg-fuchsia-500/10 dark:bg-fuchsia-500/15",
    text: "text-fuchsia-600 dark:text-fuchsia-400",
    badge: "bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-500/25",
    accent: "#c026d3",
  },
  services: {
    border: "border-emerald-500/35 dark:border-emerald-500/30",
    bg: "bg-emerald-500/[0.015] dark:bg-emerald-500/[0.02]",
    headerBg: "bg-emerald-500/10 dark:bg-emerald-500/15",
    text: "text-emerald-600 dark:text-emerald-400",
    badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25",
    accent: "#059669",
  },
  external: {
    border: "border-rose-500/35 dark:border-rose-500/30",
    bg: "bg-rose-500/[0.015] dark:bg-rose-500/[0.02]",
    headerBg: "bg-rose-500/10 dark:bg-rose-500/15",
    text: "text-rose-600 dark:text-rose-400",
    badge: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/25",
    accent: "#e11d48",
  },
};

function getGroupPalette(groupId = "") {
  const clean = groupId.toLowerCase();
  for (const [key, palette] of Object.entries(GROUP_PALETTES)) {
    if (clean.includes(key)) return palette;
  }
  return {
    border: "border-border/80 dark:border-zinc-800",
    bg: "bg-card/10 dark:bg-zinc-900/10",
    headerBg: "bg-secondary/60 dark:bg-zinc-800/50",
    text: "text-foreground",
    badge: "bg-secondary text-muted-foreground border-border",
    accent: "#64748b",
  };
}

function getGroupIcon(groupId = "") {
  const clean = groupId.toLowerCase();
  for (const [key, Icon] of Object.entries(GROUP_ICONS)) {
    if (clean.includes(key)) return Icon;
  }
  return Boxes;
}

function GroupNode({ data }) {
  const palette = getGroupPalette(data.id || data.label);
  const Icon = getGroupIcon(data.id || data.label);

  return (
    <div
      className={`rounded-2xl border-2 border-dashed transition-all select-none pointer-events-none relative ${palette.border} ${palette.bg}`}
      style={{
        width: data.width || 640,
        height: data.height || 440,
      }}
    >
      {/* Group Header Banner with Category Tag */}
      <div
        className={`flex items-center justify-between px-4 py-2.5 rounded-t-[14px] border-b border-border/40 ${palette.headerBg}`}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-6 w-6 items-center justify-center rounded-md border shadow-2xs"
            style={{
              backgroundColor: "var(--card)",
              borderColor: palette.accent,
            }}
          >
            <Icon className={`h-3.5 w-3.5 ${palette.text}`} />
          </div>
          <div>
            <h3 className="text-xs font-bold tracking-tight text-foreground uppercase font-sans">
              {data.label}
            </h3>
            {data.description && (
              <p className="text-[10px] text-muted-foreground truncate max-w-sm">
                {data.description}
              </p>
            )}
          </div>
        </div>

        <span
          className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-semibold ${palette.badge}`}
        >
          {data.count || 0} component{data.count !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}

export default memo(GroupNode);

import React from "react";
import {
  BookOpen,
  Layers,
  Network,
  Database,
  Settings,
  Shield,
  ChevronRight,
} from "lucide-react";

const CHAPTER_META = {
  Architecture: { icon: Layers, color: "text-blue-500", bg: "bg-blue-500/10" },
  "API & Interfaces": { icon: Network, color: "text-violet-500", bg: "bg-violet-500/10" },
  Persistence: { icon: Database, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  Operations: { icon: Settings, color: "text-amber-500", bg: "bg-amber-500/10" },
  Security: { icon: Shield, color: "text-rose-500", bg: "bg-rose-500/10" },
};

export default function WikiChapterTree({ chapters = [], activeSlug, onSelectChapter }) {
  return (
    <div className="flex flex-col space-y-0.5">
      <div className="px-2 py-2 mb-0.5">
        <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-muted-foreground">
          DeepWiki Chapters
        </span>
      </div>

      {chapters.map((chap, idx) => {
        const meta = CHAPTER_META[chap.category] || {
          icon: BookOpen,
          color: "text-muted-foreground",
          bg: "bg-muted/50",
        };
        const Icon = meta.icon;
        const isActive = chap.slug === activeSlug;

        return (
          <button
            key={chap.slug}
            type="button"
            onClick={() => onSelectChapter(chap)}
            className={`group w-full flex items-center gap-3 text-left px-2.5 py-2.5 rounded-lg text-xs transition-all cursor-pointer ${
              isActive
                ? "bg-primary/10 border border-primary/20 shadow-sm"
                : "border border-transparent hover:bg-muted/60 hover:border-border/40"
            }`}
          >
            {/* Icon badge */}
            <div
              className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${
                isActive ? "bg-primary/15" : meta.bg
              }`}
            >
              <Icon
                className={`h-3.5 w-3.5 ${
                  isActive ? "text-primary" : meta.color
                }`}
              />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <span
                className={`block text-xs font-medium leading-tight truncate ${
                  isActive
                    ? "text-primary"
                    : "text-foreground group-hover:text-foreground"
                }`}
              >
                {chap.title}
              </span>
              <span
                className={`text-[9px] font-mono uppercase tracking-wider mt-0.5 block ${
                  isActive ? "text-primary/60" : "text-muted-foreground"
                }`}
              >
                {chap.category}
              </span>
            </div>

            {/* Number pill */}
            <span
              className={`text-[9px] font-mono shrink-0 h-4 w-4 rounded-full flex items-center justify-center ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground group-hover:bg-border"
              }`}
            >
              {idx + 1}
            </span>
          </button>
        );
      })}
    </div>
  );
}

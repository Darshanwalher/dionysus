import React from "react";
import { BookOpen, Layers, Network, Database, Settings, Shield, ChevronRight } from "lucide-react";

const CHAPTER_ICONS = {
  Architecture: Layers,
  "API & Interfaces": Network,
  Persistence: Database,
  Operations: Settings,
  Security: Shield,
};

export default function WikiChapterTree({ chapters = [], activeSlug, onSelectChapter }) {
  return (
    <div className="flex flex-col space-y-1">
      <div className="px-2 py-1.5 mb-1">
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
          DeepWiki Chapters
        </span>
      </div>

      {chapters.map((chap) => {
        const Icon = CHAPTER_ICONS[chap.category] || BookOpen;
        const isActive = chap.slug === activeSlug;

        return (
          <button
            key={chap.slug}
            type="button"
            onClick={() => onSelectChapter(chap)}
            className={`group w-full flex items-center justify-between text-left px-2.5 py-2 rounded-lg text-xs transition-all cursor-pointer ${
              isActive
                ? "bg-primary/10 text-primary font-semibold border border-primary/20 shadow-2xs"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground border border-transparent"
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Icon className={`h-3.5 w-3.5 shrink-0 ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} />
              <div className="truncate">
                <span className="block truncate text-xs">{chap.title}</span>
                <span className="text-[9px] font-mono text-muted-foreground uppercase">
                  {chap.category}
                </span>
              </div>
            </div>

            <ChevronRight className={`h-3 w-3 shrink-0 transition-transform ${isActive ? "text-primary translate-x-0.5" : "text-muted-foreground/40 group-hover:text-foreground"}`} />
          </button>
        );
      })}
    </div>
  );
}

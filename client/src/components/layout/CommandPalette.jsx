import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTheme } from "@/components/theme/ThemeProvider";
import {
  Search,
  Home,
  FolderTree,
  Presentation,
  BookText,
  FileQuestion,
  Settings,
  Sun,
  Moon,
  FolderGit2,
  Plus,
} from "lucide-react";

export default function CommandPalette({ isOpen, onClose, onOpenCreateProject, onOpenSettings }) {
  const navigate = useNavigate();
  const { toggleTheme, resolvedTheme } = useTheme();
  const { projects, currentProject } = useSelector((state) => state.project);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Global keydown listener for ESC
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const projectId = currentProject?._id;

  const items = useMemo(() => {
    const list = [];

    // Navigation items
    if (projectId) {
      list.push(
        {
          id: "nav-overview",
          group: "Navigation",
          title: "Overview",
          icon: Home,
          action: () => {
            navigate(`/projects/${projectId}`);
            onClose();
          },
        },
        {
          id: "nav-arch",
          group: "Navigation",
          title: "Architecture & Dependencies",
          icon: FolderTree,
          action: () => {
            navigate(`/projects/${projectId}/visualise`);
            onClose();
          },
        },
        {
          id: "nav-meetings",
          group: "Navigation",
          title: "Meetings & Audio",
          icon: Presentation,
          action: () => {
            navigate(`/projects/${projectId}/meetings`);
            onClose();
          },
        },
        {
          id: "nav-docs",
          group: "Navigation",
          title: "Documentation",
          icon: BookText,
          action: () => {
            navigate(`/projects/${projectId}/documentation`);
            onClose();
          },
        },
        {
          id: "nav-qna",
          group: "Navigation",
          title: "Codebase Q & A",
          icon: FileQuestion,
          action: () => {
            navigate(`/projects/${projectId}/qna`);
            onClose();
          },
        }
      );
    }

    // Projects switch
    if (projects && projects.length > 0) {
      projects.forEach((p) => {
        list.push({
          id: `project-${p._id}`,
          group: "Switch Project",
          title: p.name,
          icon: FolderGit2,
          current: p._id === projectId,
          action: () => {
            navigate(`/projects/${p._id}`);
            onClose();
          },
        });
      });
    }

    // Quick Actions
    list.push(
      {
        id: "action-theme",
        group: "Preferences",
        title: `Switch to ${resolvedTheme === "dark" ? "Light" : "Dark"} Mode`,
        icon: resolvedTheme === "dark" ? Sun : Moon,
        action: () => {
          toggleTheme();
          onClose();
        },
      },
      {
        id: "action-create",
        group: "Actions",
        title: "Create New Project",
        icon: Plus,
        action: () => {
          onClose();
          onOpenCreateProject?.();
        },
      }
    );

    if (currentProject) {
      list.push({
        id: "action-settings",
        group: "Actions",
        title: "Project Settings",
        icon: Settings,
        action: () => {
          onClose();
          onOpenSettings?.();
        },
      });
    }

    if (!query.trim()) return list;

    const q = query.toLowerCase();
    return list.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.group.toLowerCase().includes(q)
    );
  }, [projectId, currentProject, projects, query, resolvedTheme, navigate, onClose, toggleTheme, onOpenCreateProject, onOpenSettings]);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (items.length || 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + items.length) % (items.length || 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (items[selectedIndex]) {
        items[selectedIndex].action();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-background/80 backdrop-blur-xs">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-xl rounded-lg border border-border bg-card shadow-lg overflow-hidden animate-fade-up z-10">
        {/* Search Input Bar */}
        <div className="flex items-center gap-2.5 px-3.5 py-3 border-b border-border bg-secondary/30">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search commands, navigate sections, or switch projects…"
            className="flex-1 bg-transparent text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <kbd className="hidden sm:inline-flex">ESC</kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {items.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No matching commands or projects found.
            </div>
          ) : (
            items.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs transition-colors duration-100 cursor-pointer ${
                    isSelected
                      ? "bg-foreground text-background font-medium"
                      : "text-foreground hover:bg-secondary"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`h-4 w-4 shrink-0 ${isSelected ? "text-background" : "text-muted-foreground"}`} />
                    <span className="truncate">{item.title}</span>
                    {item.current && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${isSelected ? "bg-background/20 text-background" : "bg-muted text-muted-foreground"}`}>
                        Active
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] shrink-0 font-mono ${isSelected ? "text-background/80" : "text-muted-foreground"}`}>
                    {item.group}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Footer info bar */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-border/60 bg-secondary/20 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <kbd>↑</kbd> <kbd>↓</kbd> navigate
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd>↵</kbd> select
            </span>
          </div>
          <span>Dionysus Command Menu</span>
        </div>
      </div>
    </div>
  );
}

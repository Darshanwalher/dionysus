import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme/ThemeProvider";

export default function ThemeToggle({ className }) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className={className}
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? (
        <Sun className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-transform duration-200 rotate-0 hover:rotate-45" />
      ) : (
        <Moon className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-transform duration-200 -rotate-12 hover:rotate-0" />
      )}
    </Button>
  );
}

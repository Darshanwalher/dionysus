import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { flushSync } from "react-dom";

const STORAGE_KEY = "dionysus-theme";
const ThemeContext = createContext(null);

function getSystemDark() {
  try {
    const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const light = window.matchMedia("(prefers-color-scheme: light)").matches;
    if (dark) return true;
    if (light) return false;
    return true;
  } catch {
    return true;
  }
}

function readStoredTheme() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
  } catch {
    /* ignore */
  }
  return "system";
}

function applyClass(resolved) {
  document.documentElement.classList.toggle("dark", resolved === "dark");
}

/*
  Runs `apply` (which flips the theme) inside a smooth transition:
  1. Browsers with the View Transitions API: the new theme is revealed as a circle that
     grows from the toggle button (GPU-composited, so it stays smooth on big pages).
  2. Other browsers: all colours cross-fade for ~0.6s through the .theme-switching class.
  3. prefers-reduced-motion: switches instantly.
*/
let running = false;
function withThemeTransition(apply, origin) {
  const root = document.documentElement;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduced || running) {
    apply();
    return;
  }

  if (typeof document.startViewTransition === "function") {
    const x = origin?.x ?? window.innerWidth / 2;
    const y = origin?.y ?? 0;
    const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

    running = true;
    const transition = document.startViewTransition(() => {
      apply();
    });

    transition.ready
      .then(() => {
        root.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
          {
            duration: 1400,
            delay: 150, // short pause before the circle starts to grow
            fill: "both", // keep the new theme hidden during the delay
            easing: "cubic-bezier(0.45, 0, 0.15, 1)", // gentle start, smooth finish
            pseudoElement: "::view-transition-new(root)",
          }
        );
      })
      .catch(() => {});
    transition.finished.finally(() => {
      running = false;
    });
    return;
  }

  running = true;
  root.classList.add("theme-switching");
  apply();
  window.setTimeout(() => {
    root.classList.remove("theme-switching");
    running = false;
  }, 1100);
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(readStoredTheme);
  const [systemDark, setSystemDark] = useState(getSystemDark);

  const resolvedTheme = theme === "system" ? (systemDark ? "dark" : "light") : theme;

  useEffect(() => {
    applyClass(resolvedTheme);
  }, [resolvedTheme]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setSystemDark(getSystemDark());
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const value = useMemo(() => {
    // `origin` is an optional { x, y } (viewport pixels) the circular reveal grows from
    const setTheme = (next, origin) => {
      const nextResolved = next === "system" ? (systemDark ? "dark" : "light") : next;
      withThemeTransition(() => {
        applyClass(nextResolved); // flip the class inside the transition...
        flushSync(() => setThemeState(next)); // ...and commit React state in the same frame
      }, origin);
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* ignore */
      }
    };

    const toggleTheme = (origin) => {
      setTheme(resolvedTheme === "dark" ? "light" : "dark", origin);
    };

    return { theme, resolvedTheme, setTheme, toggleTheme };
  }, [theme, resolvedTheme, systemDark]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
import { createContext, useContext, useEffect, useMemo, useState } from "react";

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
    const setTheme = (next) => {
      setThemeState(next);
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* ignore */
      }
    };

    const toggleTheme = () => {
      setTheme(resolvedTheme === "dark" ? "light" : "dark");
    };

    return { theme, resolvedTheme, setTheme, toggleTheme };
  }, [theme, resolvedTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

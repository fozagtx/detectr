"use client";

import React from "react";
import {
  isProTheme,
  PRO_THEME_DATA,
  PRO_THEME_STORAGE_KEY,
  type ProTheme,
} from "@/lib/pro-themes";

type ThemeContextValue = {
  theme: ProTheme;
  setTheme: (theme: ProTheme) => void;
};

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

function applyTheme(theme: ProTheme) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = PRO_THEME_DATA[theme];
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<ProTheme>("default");

  React.useEffect(() => {
    const stored = window.localStorage.getItem(PRO_THEME_STORAGE_KEY);
    const next = isProTheme(stored) ? stored : "default";
    setThemeState(next);
    applyTheme(next);
  }, []);

  const setTheme = React.useCallback((next: ProTheme) => {
    setThemeState(next);
    applyTheme(next);
    window.localStorage.setItem(PRO_THEME_STORAGE_KEY, next);
  }, []);

  const value = React.useMemo(
    () => ({ theme, setTheme }),
    [theme, setTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useProTheme() {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useProTheme must be used within ThemeProvider");
  }
  return ctx;
}

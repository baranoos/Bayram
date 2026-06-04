"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";
export type FontSize = "normaal" | "groot";

interface ThemeContextValue {
  theme: Theme;
  fontSize: FontSize;
  setTheme: (t: Theme) => void;
  setFontSize: (f: FontSize) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "system",
  fontSize: "normaal",
  setTheme: () => {},
  setFontSize: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

function applyTheme(t: Theme) {
  const dark =
    t === "dark" ||
    (t === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

function applyFontSize(f: FontSize) {
  if (f === "groot") {
    document.documentElement.setAttribute("data-fontsize", "groot");
  } else {
    document.documentElement.removeAttribute("data-fontsize");
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [fontSize, setFontSizeState] = useState<FontSize>("normaal");

  useEffect(() => {
    const t = (localStorage.getItem("eh-theme") as Theme) || "system";
    const f = (localStorage.getItem("eh-fontsize") as FontSize) || "normaal";
    setThemeState(t);
    setFontSizeState(f);
  }, []);

  function setTheme(t: Theme) {
    setThemeState(t);
    localStorage.setItem("eh-theme", t);
    applyTheme(t);
  }

  function setFontSize(f: FontSize) {
    setFontSizeState(f);
    localStorage.setItem("eh-fontsize", f);
    applyFontSize(f);
  }

  return (
    <ThemeContext.Provider value={{ theme, fontSize, setTheme, setFontSize }}>
      {children}
    </ThemeContext.Provider>
  );
}

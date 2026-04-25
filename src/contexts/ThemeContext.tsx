import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system" | "navy" | "purple";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
  const [isMounted, setIsMounted] = useState(false);

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const storedTheme = (localStorage.getItem("theme") as Theme) || "system";
    setThemeState(storedTheme);
    setIsMounted(true);
  }, []);

  // Apply theme to DOM and handle system preference changes
  useEffect(() => {
    if (!isMounted) return;

    const updateTheme = () => {
      const root = window.document.documentElement;
      
      // Clean up ALL theme-related classes first
      root.classList.remove("light", "dark", "theme-navy", "theme-purple");

      let effectiveTheme: "light" | "dark" = "light";

      if (theme === "system") {
        effectiveTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      } else if (theme === "dark") {
        effectiveTheme = "dark";
      } else {
        effectiveTheme = "light";
      }

      setResolvedTheme(effectiveTheme);
      
      // Apply the effective light/dark class
      root.classList.add(effectiveTheme);

      // Apply specific brand theme class
      if (theme === "navy") {
        root.classList.add("theme-navy");
      } else if (theme === "purple") {
        root.classList.add("theme-purple");
      }

      localStorage.setItem("theme", theme);
    };

    updateTheme();

    // Listen to system theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", updateTheme);

    return () => mediaQuery.removeEventListener("change", updateTheme);
  }, [theme, isMounted]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

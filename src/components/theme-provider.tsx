import { createContext, useEffect } from "react";

type ThemeProviderProps = {
  children: React.ReactNode;
};

const ThemeProviderContext = createContext<null>(null);

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  useEffect(() => {
    const root = window.document.documentElement;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const updateSystemTheme = (e: MediaQueryListEvent | MediaQueryList) => {
      root.classList.remove("light", "dark");
      root.classList.add(e.matches ? "dark" : "light");
    };

    // Set initial theme
    updateSystemTheme(mediaQuery);

    // Listen for system theme changes
    mediaQuery.addEventListener("change", updateSystemTheme);

    return () => {
      mediaQuery.removeEventListener("change", updateSystemTheme);
    };
  }, []);

  return (
    <ThemeProviderContext.Provider {...props} value={null}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

// Keep this for compatibility with existing code
export const useTheme = () => {
  return { theme: "system" };
};

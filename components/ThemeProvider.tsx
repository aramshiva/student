"use client";
import * as React from "react";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";

export type ThemeColor =
  | "Violet"
  | "Zinc"
  | "Red"
  | "Sky"
  | "Green"
  | "Orange";

interface ThemeColors {
  primary: string;
  primaryForeground: string;
  ring: string;
}

export const THEMES: Record<
  ThemeColor,
  { light: ThemeColors; dark: ThemeColors; label: string; color: string }
> = {
  Violet: {
    label: "Indigo",
    color: "oklch(0.51 0.23 277)",
    light: {
      primary: "oklch(0.51 0.23 277)",
      primaryForeground: "oklch(0.96 0.02 272)",
      ring: "oklch(0.705 0.015 286.067)",
    },
    dark: {
      primary: "oklch(0.59 0.2 277)",
      primaryForeground: "oklch(0.96 0.02 272)",
      ring: "oklch(0.552 0.016 285.938)",
    },
  },
  Zinc: {
    label: "Zinc",
    color: "oklch(0.21 0.006 285.885)",
    light: {
      primary: "oklch(0.21 0.006 285.885)",
      primaryForeground: "oklch(0.985 0 0)",
      ring: "oklch(0.705 0.015 286.067)",
    },
    dark: {
      primary: "oklch(0.985 0 0)",
      primaryForeground: "oklch(0.141 0.005 285.823)",
      ring: "oklch(0.552 0.016 285.938)",
    },
  },
  Red: {
    label: "Red",
    color: "oklch(0.577 0.245 27.325)",
    light: {
      primary: "oklch(0.577 0.245 27.325)",
      primaryForeground: "oklch(0.985 0 0)",
      ring: "oklch(0.705 0.015 286.067)",
    },
    dark: {
      primary: "oklch(0.704 0.191 22.216)",
      primaryForeground: "oklch(0.985 0 0)",
      ring: "oklch(0.552 0.016 285.938)",
    },
  },
  Sky: {
    label: "Sky",
    color: "oklch(39.1% 0.09 240.876)",
    light: {
      primary: "oklch(39.1% 0.09 240.876)",
      primaryForeground: "oklch(98.5% 0 0)",
      ring: "oklch(70.5% 0.015 286.067)",
    },
    dark: {
      primary: "oklch(59% 0.2 240.876)",
      primaryForeground: "oklch(98.5% 0 0)",
      ring: "oklch(55.2% 0.016 285.938)",
    }
  },
  Blue: {
    label: "Blue",
    color: "oklch(0.51 0.23 250)",
    light: {
      primary: "oklch(0.51 0.23 250)",
      primaryForeground: "oklch(0.985 0 0)",
      ring: "oklch(0.705 0.015 286.067)",
    },
    dark: {
      primary: "oklch(0.59 0.2 250)",
      primaryForeground: "oklch(0.985 0 0)",
      ring: "oklch(0.552 0.016 285.938)",
    },
  },
  Green: {
    label: "Green",
    color: "oklch(0.51 0.23 140)",
    light: {
      primary: "oklch(0.51 0.23 140)",
      primaryForeground: "oklch(0.985 0 0)",
      ring: "oklch(0.705 0.015 286.067)",
    },
    dark: {
      primary: "oklch(0.59 0.2 140)",
      primaryForeground: "oklch(0.985 0 0)",
      ring: "oklch(0.552 0.016 285.938)",
    },
  },
  Orange: {
    label: "Orange",
    color: "oklch(0.51 0.23 40)",
    light: {
      primary: "oklch(0.51 0.23 40)",
      primaryForeground: "oklch(0.985 0 0)",
      ring: "oklch(0.705 0.015 286.067)",
    },
    dark: {
      primary: "oklch(0.59 0.2 40)",
      primaryForeground: "oklch(0.985 0 0)",
      ring: "oklch(0.552 0.016 285.938)",
    },
  },
};

interface themecustomizercontext {
  color: ThemeColor;
  setColor: (color: ThemeColor) => void;
  radius: number;
  setRadius: (radius: number) => void;
}

const themecustomizercontext = React.createContext<
  themecustomizercontext | undefined
>(undefined);

export function useThemeCustomizer() {
  const context = React.useContext(themecustomizercontext);
  if (!context)
    throw new Error("useThemeCustomizer must be used within a ThemeProvider");
  return context;
}

function ThemeCustomizerProvider({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();
  const [color, setColor] = React.useState<ThemeColor>("Violet");
  const [radius, setRadius] = React.useState<number>(0.875);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    const savedColor = localStorage.getItem("theme-color") as ThemeColor;
    const savedRadius = parseFloat(localStorage.getItem("theme-radius") || "");
    if (savedColor && THEMES[savedColor]) setColor(savedColor);
    if (!isNaN(savedRadius)) setRadius(savedRadius);
  }, []);

  React.useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("theme-color", color);
    localStorage.setItem("theme-radius", radius.toString());

    const root = document.documentElement;
    const theme = THEMES[color];
    const mode = resolvedTheme === "dark" ? "dark" : "light";
    const colors = theme[mode];

    root.style.setProperty("--primary", colors.primary);
    root.style.setProperty("--primary-foreground", colors.primaryForeground);
    root.style.setProperty("--ring", colors.ring);
    root.style.setProperty("--radius", `${radius}rem`);
  }, [color, radius, resolvedTheme, mounted]);

  return (
    <themecustomizercontext.Provider
      value={{ color, setColor, radius, setRadius }}
    >
      {children}
    </themecustomizercontext.Provider>
  );
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <ThemeCustomizerProvider>{children}</ThemeCustomizerProvider>
    </NextThemesProvider>
  );
}

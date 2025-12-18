"use client";
import * as React from "react";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";

export type ThemeColor =
  | "Rose"
  | "Pink"
  | "Fuchsia"
  | "Purple"
  | "Violet"
  | "Indigo"
  | "Blue"
  | "Sky"
  | "Cyan"
  | "Teal"
  | "Emerald"
  | "Green"
  | "Lime"
  | "Yellow"
  | "Amber"
  | "Orange"
  | "Red"
  | "Slate"
  | "Zinc"

interface ThemeColors {
  primary: string;
  primaryForeground: string;
  ring: string;
}

export const THEMES: Record<
  ThemeColor,
  { light: ThemeColors; dark: ThemeColors; label: string; color: string }
> = {
  Rose: {
    label: "Rose",
    color: "oklch(0.586 0.253 17.585)",
    light: {
      primary: "oklch(0.586 0.253 17.585)",
      primaryForeground: "oklch(0.985 0 0)",
      ring: "oklch(0.705 0.015 286.067)",
    },
    dark: {
      primary: "oklch(0.712 0.194 13.428)",
      primaryForeground: "oklch(0.985 0 0)",
      ring: "oklch(0.552 0.016 285.938)",
    },
  },
  Pink: {
    label: "Pink",
    color: "oklch(0.592 0.249 0.584)",
    light: {
      primary: "oklch(0.592 0.249 0.584)",
      primaryForeground: "oklch(0.985 0 0)",
      ring: "oklch(0.705 0.015 286.067)",
    },
    dark: {
      primary: "oklch(0.718 0.202 349.761)",
      primaryForeground: "oklch(0.985 0 0)",
      ring: "oklch(0.552 0.016 285.938)",
    },
  },
  Fuchsia: {
    label: "Fuchsia",
    color: "oklch(0.591 0.293 322.896)",
    light: {
      primary: "oklch(0.591 0.293 322.896)",
      primaryForeground: "oklch(0.985 0 0)",
      ring: "oklch(0.705 0.015 286.067)",
    },
    dark: {
      primary: "oklch(0.74 0.238 322.16)",
      primaryForeground: "oklch(0.985 0 0)",
      ring: "oklch(0.552 0.016 285.938)",
    },
  },
  Purple: {
    label: "Purple",
    color: "oklch(0.558 0.288 302.321)",
    light: {
      primary: "oklch(0.558 0.288 302.321)",
      primaryForeground: "oklch(0.985 0 0)",
      ring: "oklch(0.705 0.015 286.067)",
    },
    dark: {
      primary: "oklch(0.714 0.203 305.504)",
      primaryForeground: "oklch(0.985 0 0)",
      ring: "oklch(0.552 0.016 285.938)",
    },
  },
  Violet: {
    label: "Violet",
    color: "oklch(0.541 0.281 293.009)",
    light: {
      primary: "oklch(0.541 0.281 293.009)",
      primaryForeground: "oklch(0.985 0 0)",
      ring: "oklch(0.705 0.015 286.067)",
    },
    dark: {
      primary: "oklch(0.702 0.183 293.541)",
      primaryForeground: "oklch(0.985 0 0)",
      ring: "oklch(0.552 0.016 285.938)",
    },
  },
  Indigo: {
    label: "Indigo",
    color: "oklch(0.511 0.262 276.966)",
    light: {
      primary: "oklch(0.511 0.262 276.966)",
      primaryForeground: "oklch(0.985 0 0)",
      ring: "oklch(0.705 0.015 286.067)",
    },
    dark: {
      primary: "oklch(0.673 0.182 276.935)",
      primaryForeground: "oklch(0.985 0 0)",
      ring: "oklch(0.552 0.016 285.938)",
    },
  },
  Blue: {
    label: "Blue",
    color: "oklch(0.546 0.245 262.881)",
    light: {
      primary: "oklch(0.546 0.245 262.881)",
      primaryForeground: "oklch(0.985 0 0)",
      ring: "oklch(0.705 0.015 286.067)",
    },
    dark: {
      primary: "oklch(0.707 0.165 254.624)",
      primaryForeground: "oklch(0.985 0 0)",
      ring: "oklch(0.552 0.016 285.938)",
    },
  },
  Sky: {
    label: "Sky",
    color: "oklch(0.588 0.158 241.966)",
    light: {
      primary: "oklch(0.588 0.158 241.966)",
      primaryForeground: "oklch(0.985 0 0)",
      ring: "oklch(0.705 0.015 286.067)",
    },
    dark: {
      primary: "oklch(0.746 0.16 232.661)",
      primaryForeground: "oklch(0.141 0.005 285.823)",
      ring: "oklch(0.552 0.016 285.938)",
    },
  },
  Cyan: {
    label: "Cyan",
    color: "oklch(0.609 0.126 221.723)",
    light: {
      primary: "oklch(0.609 0.126 221.723)",
      primaryForeground: "oklch(0.985 0 0)",
      ring: "oklch(0.705 0.015 286.067)",
    },
    dark: {
      primary: "oklch(0.789 0.154 211.53)",
      primaryForeground: "oklch(0.141 0.005 285.823)",
      ring: "oklch(0.552 0.016 285.938)",
    },
  },
  Teal: {
    label: "Teal",
    color: "oklch(0.6 0.118 184.704)",
    light: {
      primary: "oklch(0.6 0.118 184.704)",
      primaryForeground: "oklch(0.985 0 0)",
      ring: "oklch(0.705 0.015 286.067)",
    },
    dark: {
      primary: "oklch(0.777 0.152 181.912)",
      primaryForeground: "oklch(0.141 0.005 285.823)",
      ring: "oklch(0.552 0.016 285.938)",
    },
  },
  Emerald: {
    label: "Emerald",
    color: "oklch(0.596 0.145 163.225)",
    light: {
      primary: "oklch(0.596 0.145 163.225)",
      primaryForeground: "oklch(0.985 0 0)",
      ring: "oklch(0.705 0.015 286.067)",
    },
    dark: {
      primary: "oklch(0.765 0.177 163.223)",
      primaryForeground: "oklch(0.141 0.005 285.823)",
      ring: "oklch(0.552 0.016 285.938)",
    },
  },
  Green: {
    label: "Green",
    color: "oklch(0.627 0.194 149.214)",
    light: {
      primary: "oklch(0.627 0.194 149.214)",
      primaryForeground: "oklch(0.985 0 0)",
      ring: "oklch(0.705 0.015 286.067)",
    },
    dark: {
      primary: "oklch(0.792 0.209 151.711)",
      primaryForeground: "oklch(0.141 0.005 285.823)",
      ring: "oklch(0.552 0.016 285.938)",
    },
  },
  Lime: {
    label: "Lime",
    color: "oklch(0.648 0.2 131.684)",
    light: {
      primary: "oklch(0.648 0.2 131.684)",
      primaryForeground: "oklch(0.141 0.005 285.823)",
      ring: "oklch(0.705 0.015 286.067)",
    },
    dark: {
      primary: "oklch(0.841 0.238 128.85)",
      primaryForeground: "oklch(0.141 0.005 285.823)",
      ring: "oklch(0.552 0.016 285.938)",
    },
  },
  Yellow: {
    label: "Yellow",
    color: "oklch(0.681 0.162 75.834)",
    light: {
      primary: "oklch(0.681 0.162 75.834)",
      primaryForeground: "oklch(0.141 0.005 285.823)",
      ring: "oklch(0.705 0.015 286.067)",
    },
    dark: {
      primary: "oklch(0.852 0.199 91.936)",
      primaryForeground: "oklch(0.141 0.005 285.823)",
      ring: "oklch(0.552 0.016 285.938)",
    },
  },
  Amber: {
    label: "Amber",
    color: "oklch(0.666 0.179 58.318)",
    light: {
      primary: "oklch(0.666 0.179 58.318)",
      primaryForeground: "oklch(0.141 0.005 285.823)",
      ring: "oklch(0.705 0.015 286.067)",
    },
    dark: {
      primary: "oklch(0.828 0.189 84.429)",
      primaryForeground: "oklch(0.141 0.005 285.823)",
      ring: "oklch(0.552 0.016 285.938)",
    },
  },
  Orange: {
    label: "Orange",
    color: "oklch(0.646 0.222 41.116)",
    light: {
      primary: "oklch(0.646 0.222 41.116)",
      primaryForeground: "oklch(0.985 0 0)",
      ring: "oklch(0.705 0.015 286.067)",
    },
    dark: {
      primary: "oklch(0.75 0.183 55.934)",
      primaryForeground: "oklch(0.985 0 0)",
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

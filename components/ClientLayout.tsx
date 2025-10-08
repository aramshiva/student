"use client";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import * as React from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { AppSidebar } from "./AppSidebar";
import { CommandMenu } from "./CommandMenu";
import { SidebarProvider, SidebarTrigger } from "./ui/sidebar";
import { Button } from "./ui/button";
import { Kbd, KbdGroup } from "./ui/kbd";
export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const showSidebar = pathname !== "/" && pathname !== "/privacy";
  const pageTitle = React.useMemo(() => {
    if (!pathname) return "";
    const p = pathname === "/" ? "/" : pathname.replace(/\/+$/, "");
    const map: Record<string, string> = {
      "/student": "Dashboard",
      "/attendance": "Attendance",
      "/documents": "Documents",
      "/gradebook": "Gradebook",
      "/mail": "Mail",
      "/schedule": "Schedule",
      "/settings": "Settings",
      "/student_info": "Student Info",
    };
    if (map[p]) return map[p];
    if (p.startsWith("/gradebook/")) return "Assignment";
    const seg = p.split("/").filter(Boolean).pop();
    if (!seg) return "";
    return seg.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }, [pathname]);
  return showSidebar ? (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="p-2 border-b flex items-center gap-2 bg-white/60 dark:bg-neutral-950/60 backdrop-blur dark:supports-[backdrop-filter]:bg-neutral-950/50 supports-[backdrop-filter]:bg-white/50 sticky top-0 z-10">
            <SidebarTrigger />
            {pageTitle && (
              <div className="font-semibold md:text-base tracking-tight text-neutral-700 dark:text-neutral-200">
                <p>{pageTitle}</p>
              </div>
            )}
            <div className="ml-auto flex items-center gap-2">
              <CommandButton />
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 w-full min-w-0">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  ) : (
    <main>{children}</main>
  );
}

function CommandButton() {
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, []);
  return (
    <>
      <Button
        variant="outline"
        className="py-4"
        size="sm"
        aria-label="Open command palette"
        onClick={() => setOpen(true)}
      >
        <KbdGroup>
          <Kbd>
            {typeof navigator !== "undefined" &&
            navigator.userAgent?.toLowerCase().includes("mac")
              ? "⌘"
              : "Ctrl"}
          </Kbd>
          <span>+</span>
          <Kbd>K</Kbd>
        </KbdGroup>
      </Button>
      <CommandMenu open={open} onOpenChange={setOpen} />
    </>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const current = theme === undefined ? "system" : theme;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          aria-label="Toggle theme"
          className="dark:bg-neutral-950"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          Light {mounted && current === "light" && "✓"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          Dark {mounted && current === "dark" && "✓"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          System {mounted && current === "system" && "✓"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

"use client";
import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import {
  Sun,
  Moon,
  LogOut,
  Settings,
  Home,
  BookOpen,
  CalendarDays,
  Mail,
  FileText,
  Table2,
  BookCheck,
  SunMoon,
} from "lucide-react";
import { useTheme } from "next-themes";

interface CommandMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandMenu({ open, onOpenChange }: CommandMenuProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { setTheme } = useTheme();

  const navigate = (to: string) => {
    onOpenChange(false);
    if (pathname !== to) router.push(to);
  };

  const items: {
    heading: string;
    entries: {
      label: string;
      shortcut?: string;
      action: () => void;
      icon?: React.ReactNode;
    }[];
  }[] = [
    {
      heading: "Navigation",
      entries: [
        {
          label: "Dashboard",
          action: () => navigate("/student"),
          icon: <Home className="size-4" />,
        },
        {
          label: "Gradebook",
          action: () => navigate("/gradebook"),
          icon: <BookOpen className="size-4" />,
        },
        {
          label: "Attendance",
          action: () => navigate("/attendance"),
          icon: <CalendarDays className="size-4" />,
        },
        {
          label: "Schedule",
          action: () => navigate("/schedule"),
          icon: <Table2 className="size-4" />,
        },
        {
          label: "Documents",
          action: () => navigate("/documents"),
          icon: <FileText className="size-4" />,
        },
        {
          label: "Mail",
          action: () => navigate("/mail"),
          icon: <Mail className="size-4" />,
        },
        {
          label: "Test History",
          action: () => navigate("/tests"),
          icon: <BookCheck className="size-4" />,
        },
        {
          label: "Settings",
          action: () => navigate("/settings"),
          icon: <Settings className="size-4" />,
        },
      ],
    },
    {
      heading: "Theme",
      entries: [
        {
          label: "Light Mode",
          action: () => setTheme("light"),
          icon: <Sun className="size-4" />,
        },
        {
          label: "Dark Mode",
          action: () => setTheme("dark"),
          icon: <Moon className="size-4" />,
        },
        {
          label: "System Theme",
          action: () => setTheme("system"),
          icon: <SunMoon className="size-4" />,
        },
      ],
    },
    {
      heading: "Session",
      entries: [
        {
          label: "Logout",
          action: () => {
            try {
              localStorage.removeItem("studentvue-creds");
            } catch {}
            router.push("/");
          },
          icon: <LogOut className="size-4" />,
        },
      ],
    },
  ];

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Command"
      description="Jump to a page or run an action"
    >
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {items.map((group) => (
          <CommandGroup key={group.heading} heading={group.heading}>
            {group.entries.map((entry) => (
              <CommandItem
                key={entry.label}
                onSelect={() => entry.action()}
                value={entry.label.toLowerCase()}
              >
                {entry.icon}
                <span>{entry.label}</span>
                {entry.shortcut && (
                  <CommandShortcut>{entry.shortcut}</CommandShortcut>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
        <CommandSeparator />
        {/* <CommandGroup heading="Help">
          <CommandItem onSelect={() => window.open("/privacy", "_blank")}>
            Privacy Policy
          </CommandItem>
        </CommandGroup> */}
      </CommandList>
    </CommandDialog>
  );
}

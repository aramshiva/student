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
  Table,
  School,
  MessageCircle,
  HistoryIcon,
  ClipboardX,
  GraduationCap,
  FileCheck,
  UserCircle,
} from "lucide-react";
import { useTheme } from "next-themes";
import { loadGradebookCache } from "@/utils/gradebook";
import type { Course, Mark, Assignment } from "@/types/gradebook";

interface SearchableCourse {
  id: string;
  name: string;
}

interface SearchableAssignment {
  id: string;
  name: string;
  courseName: string;
}

function currentMarkOf(m: Mark | Mark[] | undefined): Mark | null {
  if (!m) return null;
  if (Array.isArray(m)) return m[m.length - 1] || null;
  return m;
}

function loadSearchIndex(): {
  courses: SearchableCourse[];
  assignments: SearchableAssignment[];
} {
  try {
    const cached = loadGradebookCache(null);
    const root = (cached?.data ?? {}) as {
      Gradebook?: { Courses?: { Course?: Course[] } };
      Courses?: { Course?: Course[] };
    };
    const gbRoot = root.Gradebook ?? root;
    const courseList: Course[] = gbRoot?.Courses?.Course || [];
    const courses: SearchableCourse[] = [];
    const assignments: SearchableAssignment[] = [];
    for (const c of courseList) {
      if (!c?._CourseID) continue;
      courses.push({ id: c._CourseID, name: c._CourseName });
      const mark = currentMarkOf(c?.Marks?.Mark);
      const list: Assignment[] = mark?.Assignments?.Assignment || [];
      for (const a of list) {
        if (!a?._GradebookID) continue;
        assignments.push({
          id: a._GradebookID,
          name: a._Measure,
          courseName: c._CourseName,
        });
      }
    }
    return { courses, assignments };
  } catch {
    return { courses: [], assignments: [] };
  }
}

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

  const [searchIndex, setSearchIndex] = React.useState<{
    courses: SearchableCourse[];
    assignments: SearchableAssignment[];
  }>({ courses: [], assignments: [] });
  React.useEffect(() => {
    if (open) setSearchIndex(loadSearchIndex());
  }, [open]);

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
          label: "Home",
          action: () => navigate("/"),
          icon: <Home className="text-sm" />,
        },
        {
          label: "Gradebook",
          action: () => navigate("/gradebook"),
          icon: <BookOpen className="text-sm" />,
        },
        {
          label: "Schedule",
          action: () => navigate("/schedule"),
          icon: <Table className="text-sm" />,
        },
        {
          label: "Calendar",
          action: () => navigate("/calendar"),
          icon: <CalendarDays className="text-sm" />,
        },
        {
          label: "Attendance",
          action: () => navigate("/attendance"),
          icon: <Table2 className="text-sm" />,
        },
        {
          label: "Missing Work",
          action: () => navigate("/missing"),
          icon: <ClipboardX className="text-sm" />,
        },
        {
          label: "Documents",
          action: () => navigate("/documents"),
          icon: <FileText className="text-sm" />,
        },
        {
          label: "Course History",
          action: () => navigate("/history"),
          icon: <HistoryIcon className="text-sm" />,
        },
        {
          label: "Test History",
          action: () => navigate("/tests"),
          icon: <BookCheck className="text-sm" />,
        },
        {
          label: "School Information",
          action: () => navigate("/school"),
          icon: <School className="text-sm" />,
        },
        {
          label: "My Account",
          action: () => navigate("/account"),
          icon: <UserCircle className="text-sm" />,
        },
        {
          label: "Settings",
          action: () => navigate("/settings"),
          icon: <Settings className="text-sm" />,
        },
      ],
    },
    {
      heading: "Theme",
      entries: [
        {
          label: "Light Mode",
          action: () => setTheme("light"),
          icon: <Sun className="text-sm" />,
        },
        {
          label: "Dark Mode",
          action: () => setTheme("dark"),
          icon: <Moon className="text-sm" />,
        },
        {
          label: "System Theme",
          action: () => setTheme("system"),
          icon: <SunMoon className="text-sm" />,
        },
      ],
    },
    {
      heading: "Session",
      entries: [
        {
          label: "Give Feedback",
          action: () => navigate("/feedback"),
          icon: <MessageCircle className="text-sm" />,
        },
        {
          label: "Logout",
          action: () => navigate("/logout"),
          icon: <LogOut className="text-sm" />,
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
        {searchIndex.courses.length > 0 && (
          <CommandGroup heading="Courses">
            {searchIndex.courses.map((c) => (
              <CommandItem
                key={`course-${c.id}`}
                onSelect={() =>
                  navigate(`/gradebook?course=${encodeURIComponent(c.id)}`)
                }
                value={`course ${c.name}`}
              >
                <GraduationCap className="text-sm" />
                <span>{c.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {searchIndex.assignments.length > 0 && (
          <CommandGroup heading="Assignments">
            {searchIndex.assignments.map((a) => (
              <CommandItem
                key={`assignment-${a.id}`}
                onSelect={() => navigate(`/gradebook/${a.id}`)}
                value={`${a.name} ${a.courseName}`}
              >
                <FileCheck className="text-sm" />
                <span className="truncate">{a.name}</span>
                <span className="ml-auto text-xs text-muted-foreground truncate max-w-[40%]">
                  {a.courseName}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
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

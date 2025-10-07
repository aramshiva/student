"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Mail,
  Settings as SettingsIcon,
  ChevronUp,
  Home,
  MessageCircle,
  Smartphone,
  BookCheck,
  FileText,
  Table2,
  CalendarDays,
  BookOpen,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const primaryNav = [
  { name: "Home", href: "/student", icon: Home },
  { name: "Gradebook", href: "/gradebook", icon: BookOpen },
  { name: "Schedule", href: "/schedule", icon: CalendarDays },
  { name: "Attendance", href: "/attendance", icon: Table2 },
  { name: "Documents", href: "/documents", icon: FileText },
  { name: "Mail", href: "/mail", icon: Mail },
  { name: "Test History", href: "/tests", icon: BookCheck },
];

export function AppSidebar() {
  const pathname = usePathname();
  const [studentPhoto, setStudentPhoto] = React.useState<string>("");
  const [permId, setPermId] = React.useState<string>("");
  const [studentName, setStudentName] = React.useState<string>("");
  const [school, setSchool] = React.useState<string>("");
  const [quickStats, setQuickStats] = React.useState<{
    gpa: string;
    missing: number;
    gradedCourses: number;
    totalCourses: number;
    ts: number;
  } | null>(null);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const KEY = "studentvue-quick-stats";
    const read = () => {
      try {
        const raw = localStorage.getItem(KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        setQuickStats((prev) => {
          if (!prev || prev.ts !== parsed.ts) return parsed;
          return prev;
        });
      } catch {}
    };
    read();
    const id = setInterval(read, 5000);
    return () => clearInterval(id);
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      setStudentPhoto(localStorage.getItem("studentPhoto") || "");
      setPermId(localStorage.getItem("studentPermId") || "");
      setSchool(localStorage.getItem("studentSchool") || "");
      const existingName = localStorage.getItem("studentName") || "";
      if (existingName) setStudentName(existingName);
    } catch {}
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (studentName) return;
    const credsRaw = localStorage.getItem("studentvue-creds");
    if (!credsRaw) return;
    let aborted = false;
    (async () => {
      try {
        const creds = JSON.parse(credsRaw);
        const res = await fetch("/api/synergy/name", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: creds.username || creds.user || creds.userId,
            password: creds.password || creds.pass,
            district_url: creds.district_url || creds.district || creds.host,
          }),
        });
        if (!aborted && res.ok) {
          const data = await res.json();
          if (data && typeof data.name === "string" && data.name.trim()) {
            const nm = data.name.trim();
            setStudentName(nm);
            localStorage.setItem("studentName", nm);
          }
        }
      } catch {}
    })();
    return () => {
      aborted = true;
    };
  }, [studentName]);

  return (
    <Sidebar collapsible="icon" variant="sidebar" side="left">
      <SidebarHeader className="gap-1">
        <div className="flex items-center justify-between h-8 px-2">
          <Link
            href="/student"
            className="pt-5 font-bold font-[Gosha] text-xl tracking-tight select-none"
          >
            <span className="inline group-data-[collapsible=icon]:hidden">
              student
            </span>
            <span className="hidden group-data-[collapsible=icon]:inline">
              S
            </span>
          </Link>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {primaryNav.map((item) => {
                const active = pathname?.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={!!active}
                      tooltip={item.name}
                    >
                      <Link href={item.href} className="flex items-center">
                        <Icon className="shrink-0" />
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {quickStats && quickStats.gradedCourses > 0 && (
          <>
            <SidebarSeparator />
            <SidebarGroup className="group-data-[collapsible=icon]:hidden">
              <SidebarGroupLabel>Quick Stats</SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="grid grid-cols-1 gap-2 text-xs px-1">
                  <div className="rounded-md border bg-sidebar-accent/50 p-2 flex flex-col gap-1">
                    <div className="flex items-baseline justify-between">
                      <p className="font-medium tracking-tight">GPA</p>
                      <p className="text-sm font-semibold">{quickStats.gpa}</p>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <p className="font-medium tracking-tight">Missing</p>
                      <p
                        className={`text-sm font-semibold ${
                          (quickStats.missing || 0) > 0 ? "text-red-600" : ""
                        }`}
                      >
                        {quickStats.missing}
                      </p>
                    </div>
                    <div className="flex items-baseline justify-between text-[10px] pt-1 opacity-70 border-t mt-1">
                      <span>Courses</span>
                      <span>
                        {quickStats.gradedCourses}/{quickStats.totalCourses}
                      </span>
                    </div>
                  </div>
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>
      <SidebarFooter>
        {(studentPhoto || permId || school) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md mt-1 flex items-center gap-2 p-2 transition-colors group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-1">
                {studentPhoto ? (
                  <Avatar>
                    <AvatarImage
                      className="rounded-full object-cover aspect-square group-data-[collapsible=icon]:size-8"
                      src={`data:image/png;base64,${studentPhoto}`}
                    />
                    <AvatarFallback>
                      {(studentName || permId || school || "U").slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="size-9 shrink-0 rounded-full bg-sidebar-accent flex items-center justify-center text-[11px] font-medium uppercase group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:text-sm">
                    {(studentName || permId || school || "U").slice(0, 2)}
                  </div>
                )}
                <div className="min-w-0 text-left hidden group-data-[collapsible=icon]:hidden md:block">
                  {(studentName || permId) && (
                    <p className="truncate text-xs font-medium leading-tight">
                      {studentName || permId}
                    </p>
                  )}
                  {school && (
                    <p className="truncate text-[10px] text-muted-foreground leading-tight">
                      {school}
                    </p>
                  )}
                </div>
                <ChevronUp className="ml-auto size-4 opacity-60 group-data-[collapsible=icon]:hidden" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="start" side="top" className="w-52">
              <DropdownMenuLabel className="text-xs">Account</DropdownMenuLabel>
              <div className="px-2 pb-1 pt-0.5">
                {permId && (
                  <p className="text-xs font-medium truncate">ID: {permId}</p>
                )}
                {school && (
                  <p className="text-xs text-muted-foreground truncate">
                    {school}
                  </p>
                )}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link
                  href="/install"
                  className="cursor-pointer flex items-center gap-2"
                >
                  <Smartphone className="size-4" />
                  <span>Install Mobile App</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href="/feedback"
                  className="cursor-pointer flex items-center gap-2"
                >
                  <MessageCircle className="size-4" />
                  <span>Feedback</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href="/settings"
                  className="cursor-pointer flex items-center gap-2"
                >
                  <SettingsIcon className="size-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

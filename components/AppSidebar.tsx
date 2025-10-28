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
  Table,
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
  { name: "Schedule", href: "/schedule", icon: Table },
  { name: "Calendar", href: "/calendar", icon: CalendarDays },
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
  const [nextPeriod, setNextPeriod] = React.useState<{
    period: number;
    courseTitle: string;
    room?: string;
    teacher?: string;
    timeUntil?: string;
    isNext: boolean;
  } | null>(null);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const KEY = "Student.quickStats";
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
      setStudentPhoto(localStorage.getItem("Student.studentPhoto") || "");
      setPermId(localStorage.getItem("Student.studentPermId") || "");
      setSchool(localStorage.getItem("Student.studentSchool") || "");
      const existingName = localStorage.getItem("Student.studentName") || "";
      if (existingName) setStudentName(existingName);
    } catch {}
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (studentName) return;
    const credsRaw = localStorage.getItem("Student.creds");
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
            localStorage.setItem("Student.studentName", nm);
          }
        }
      } catch {}
    })();
    return () => {
      aborted = true;
    };
  }, [studentName]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    
    const calculateNextPeriod = async () => {
      try {
        const credsRaw = localStorage.getItem("Student.creds");
        if (!credsRaw) {
          setNextPeriod(null);
          return;
        }
        
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        const dayOfWeek = now.getDay(); 
        
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          setNextPeriod(null);
          return;
        }
        
        const creds = JSON.parse(credsRaw);
        const res = await fetch("/api/synergy/schedule", {
          method: "POST", 
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...creds,
          }),
        });
        
        if (!res.ok) {
          return;
        }
        
        const data = await res.json();
        const todayClasses = data?.StudentClassSchedule?.TodayScheduleInfoData?.SchoolInfos?.SchoolInfo?.Classes?.ClassInfo;
        
        if (!todayClasses) {
          return;
        }
        
        const parseTime = (timeStr?: string) => {
          if (!timeStr) return null;
          const match = timeStr.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
          if (!match) return null;
          
          const [, hours, minutes, period] = match;
          let h = parseInt(hours);
          const m = parseInt(minutes);
          
          if (period) {
            if (period.toUpperCase() === 'PM' && h !== 12) h += 12;
            if (period.toUpperCase() === 'AM' && h === 12) h = 0;
          }
          
          return h * 60 + m;
        };

        const classes = (Array.isArray(todayClasses) ? todayClasses : [todayClasses])
          .map((c: { 
            _Period?: string; 
            _ClassName?: string; 
            _RoomName?: string; 
            _TeacherName?: string;
            _StartTime?: string;
            _EndTime?: string;
          }) => ({
            period: Number(c._Period || 0),
            courseTitle: c._ClassName || "",
            room: c._RoomName || "",
            teacher: c._TeacherName || "",
            startTime: parseTime(c._StartTime),
            endTime: parseTime(c._EndTime),
          }))
          .filter((c) => c.courseTitle && c.startTime !== null && c.endTime !== null)
          .sort((a, b) => (a.startTime! - b.startTime!) || (a.period - b.period));
        
        if (classes.length === 0) {
          return;
        }
        
        const firstClass = classes[0];
        const lastClass = classes[classes.length - 1];
        const schoolStartTime = firstClass.startTime!;
        const schoolEndTime = lastClass.endTime!;
        
        if (currentTime < schoolStartTime || currentTime > schoolEndTime) {
          setNextPeriod(null);
          return;
        }
        
        for (let i = 0; i < classes.length; i++) {
          const classInfo = classes[i];
          const startTime = classInfo.startTime!;
          const endTime = classInfo.endTime!;
          
          if (currentTime < endTime) {
            const minutesUntil = Math.max(0, startTime - currentTime);
            const timeUntilText = minutesUntil === 0 
              ? "Now" 
              : minutesUntil < 60 
                ? `${minutesUntil}m` 
                : `${Math.floor(minutesUntil / 60)}h ${minutesUntil % 60}m`;
                
            setNextPeriod({
              period: classInfo.period,
              courseTitle: classInfo.courseTitle,
              room: classInfo.room,
              teacher: classInfo.teacher,
              timeUntil: timeUntilText,
              isNext: minutesUntil > 0,
            });
            return;
          }
        }
        
        setNextPeriod(null);
        
        } catch {
        setNextPeriod(null);
      }
    };
    
    calculateNextPeriod();
    const interval = setInterval(calculateNextPeriod, 3000);
    
    return () => clearInterval(interval);
  }, []);

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
      <SidebarContent className="overflow-hidden">
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
        <div>
        {quickStats && quickStats.gradedCourses > 0 && (
          <>
            <SidebarSeparator />
            <SidebarGroup className="group-data-[collapsible=icon]:hidden">
              <SidebarGroupLabel>Quick Stats</SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="grid grid-cols-1 gap-2 text-xs pl-1">
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
        {nextPeriod && (
          <>
            <SidebarGroup className="group-data-[collapsible=icon]:hidden">
              <SidebarGroupLabel>Next Period</SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="grid grid-cols-1 gap-2 text-xs pl-1">
                  <div className="rounded-md border bg-sidebar-accent/50 p-2 flex flex-col gap-1">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium tracking-tight truncate">
                          Period {nextPeriod.period}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {nextPeriod.courseTitle}
                        </p>
                        {nextPeriod.room && (
                          <p className="text-[10px] text-muted-foreground/80 truncate">
                            Room {nextPeriod.room}
                          </p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <p className={`text-sm font-semibold ${
                          nextPeriod.isNext ? "text-blue-600" : "text-green-600"
                        }`}>
                          {nextPeriod.timeUntil}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {nextPeriod.isNext ? "starts" : "current"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
        </div>
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
                <div className="min-w-0 text-left group-data-[collapsible=icon]:hidden md:block">
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

"use client";
import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  BookUser,
  Calendar,
  CalendarClock,
  File,
  Mail,
  Settings as SettingsIcon,
  ChevronUp,
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

const primaryNav = [
  { name: "Gradebook", href: "/gradebook", icon: BookUser },
  { name: "Schedule", href: "/schedule", icon: Calendar },
  { name: "Attendance", href: "/attendance", icon: CalendarClock },
  { name: "Documents", href: "/documents", icon: File },
  { name: "Mail", href: "/mail", icon: Mail },
];

export function AppSidebar() {
  const pathname = usePathname();
  const [studentPhoto, setStudentPhoto] = React.useState<string>("");
  const [permId, setPermId] = React.useState<string>("");
  const [school, setSchool] = React.useState<string>("");

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      setStudentPhoto(localStorage.getItem("studentPhoto") || "");
      setPermId(localStorage.getItem("studentPermId") || "");
      setSchool(localStorage.getItem("studentSchool") || "");
    } catch {}
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
        <SidebarSeparator />
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel>Quick Stats</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="grid grid-cols-1 gap-2 text-xs px-1">
              <div className="rounded-md border bg-sidebar-accent/50 p-2">
                <p className="font-medium">Coming Soon</p>
                <p className="text-[10px] opacity-70">Customizable widgets</p>
              </div>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        {(studentPhoto || permId || school) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md mt-1 flex items-center gap-2 p-2 transition-colors group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-1">
                {studentPhoto ? (
                  <Image
                    src={`data:image/png;base64,${studentPhoto}`}
                    alt="Student Photo"
                    width={36}
                    height={36}
                    className="rounded-full object-cover aspect-square group-data-[collapsible=icon]:size-8"
                  />
                ) : (
                  <div className="size-9 shrink-0 rounded-full bg-sidebar-accent flex items-center justify-center text-[11px] font-medium uppercase group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:text-sm">
                    {(permId || school || "").slice(0, 2) || "U"}
                  </div>
                )}
                <div className="min-w-0 text-left hidden group-data-[collapsible=icon]:hidden md:block">
                  {permId && (
                    <p className="truncate text-xs font-medium leading-tight">
                      {permId}
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
                  <p className="text-[11px] font-medium truncate">
                    ID: {permId}
                  </p>
                )}
                {school && (
                  <p className="text-[10px] text-muted-foreground truncate">
                    {school}
                  </p>
                )}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex items-center gap-2">
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

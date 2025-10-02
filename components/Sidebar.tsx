import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";
import {
  BookUser,
  Calendar,
  CalendarClock,
  File,
  Home,
  Mail
} from "lucide-react";

const items = [
  { title: "Home", url: "/student", icon: Home },
  { title: "Gradebook", url: "/gradebook", icon: BookUser },
  { title: "Schedule", url: "/schedule", icon: Calendar },
  { title: "Attendance", url: "/attendance", icon: CalendarClock },
  { title: "Documents", url: "/documents", icon: File },
  { title: "Mail", url: "/mail", icon: Mail }
];

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
      <div className="font-bold font-[Gosha] flex flex-col pt-8 pb-4 px-4 top-0 left-0 z-20 text-xl">
        <Link href="/student">student</Link>
      </div>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

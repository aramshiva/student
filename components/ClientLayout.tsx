"use client";
import { usePathname } from "next/navigation";
import { AppSidebar } from "./AppSidebar";
import { SidebarProvider, SidebarTrigger } from "./ui/sidebar";
export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const showSidebar = pathname !== "/" && pathname !== "/privacy";
  return showSidebar ? (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="p-2 border-b flex items-center gap-2 bg-white/60 backdrop-blur supports-[backdrop-filter]:bg-white/50 sticky top-0 z-10">
            <SidebarTrigger />
          </header>
          <main className="flex-1 w-full min-w-0">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  ) : (
    <main>{children}</main>
  );
}

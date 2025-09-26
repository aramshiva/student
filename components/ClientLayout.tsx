"use client";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showSidebar = pathname !== "/";
  return (
    <div className="flex min-h-screen">
      {showSidebar && <Sidebar />}
      <main className={showSidebar ? "ml-48 flex-1" : "flex-1"}>{children}</main>
    </div>
  );
}

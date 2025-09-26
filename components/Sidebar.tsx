"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();
  const navItems = [
    { name: "Gradebook", href: "/gradebook" },
    { name: "Schedule", href: "/schedule" },
  ];
  return (
    <aside className="h-screen w-48 bg-gray-50 border-r flex flex-col py-8 px-4 fixed top-0 left-0 z-20">
      <div className="font-bold pb-5">Student</div>
      <nav className="flex flex-col gap-2">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className="px-1 py-2">
            {item.name}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

"use client";
import Link from "next/link";
import { useState } from "react";

export default function Sidebar() {
  const [showWarning, setShowWarning] = useState(true);
  
  const navItems = [
    { name: "Gradebook", href: "/gradebook" },
    { name: "Schedule", href: "/schedule" },
  ];
  
  return (
    <aside className="h-screen w-48 bg-gray-50 border-r flex flex-col py-8 px-4 fixed top-0 left-0 z-20">
      <div className="font-bold font-[Gosha] pb-5 text-xl">student</div>
      {showWarning && (
        <div className="text-red p-3 border border-dotted border-red-800 dotted bg-orange-100 rounded-xl relative">
          <button 
            className="absolute top-1 right-1 text-red-800 hover:text-red-900"
            onClick={() => setShowWarning(false)}
          >
            ×
          </button>
          use at your own risk! alpha version, everything to change
        </div>
      )}
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

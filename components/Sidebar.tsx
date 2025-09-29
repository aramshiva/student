"use client";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { BookUser, Calendar, CalendarClock, File, Mail } from "lucide-react";
export default function Sidebar() {
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hidden = localStorage.getItem("hideSidebarWarning") === "true";
      if (!hidden) {
        setShowWarning(true);
      }
    }
  }, []);

  const navItems = [
    { name: "Gradebook", href: "/gradebook", icon: BookUser },
    { name: "Schedule", href: "/schedule", icon: Calendar },
    { name: "Attendance", href: "/attendance", icon: CalendarClock },
    { name: "Documents", href: "/documents", icon: File },
    { name: "Mail", href: "/mail", icon: Mail },
  ];

  let photoBase64 = "";
  let permId = "";
  let school = "";
  if (typeof window !== "undefined") {
    photoBase64 = localStorage.getItem("studentPhoto") || "";
    permId = localStorage.getItem("studentPermId") || "";
    school = localStorage.getItem("studentSchool") || "";
  }

  return (
    <aside className="h-screen w-48 bg-gray-50 border-r flex flex-col py-8 px-4 fixed top-0 left-0 z-20">
      <div className="font-bold font-[Gosha] pb-5 text-xl"><Link href="/student">student</Link></div>
      {showWarning && (
        <div className="text-red p-3 border border-dotted border-red-800 dotted bg-orange-100 rounded-xl relative">
          <button
            className="absolute top-1 right-1 text-red-800 hover:text-red-900"
            onClick={() => {
              setShowWarning(false);
              try {
                localStorage.setItem("hideSidebarWarning", "true");
              } catch {}
            }}
          >
            ×
          </button>
          use at your own risk! alpha version, everything to change
        </div>
      )}
      <nav className="flex flex-col gap-2 flex-1">
        {navItems.map(({ name, href, icon: Icon }) => (
          <Link key={href} href={href} className="px-1 py-2 text-sm flex items-center gap-2">
            <Icon className="w-4 h-4" />
            {name}
          </Link>
        ))}
      </nav>
      {photoBase64 && (
        <div className="flex items-center justify-center mt-auto mb-2">
          <Image
            src={`data:image/png;base64,${photoBase64}`}
            alt="Student Photo"
            width={52}
            height={52}
            className="rounded-full aspect-square mask-center shadow object-cover"
          />
          <div className="flex flex-col ml-3">
            <p className="text-sm">{permId}</p>
            <p className="text-xs text-gray-400">{school}</p>
          </div>
        </div>
      )}
    </aside>
  );
}

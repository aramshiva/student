"use client";

import { useEffect, useState } from "react";
import Landing from "@/components/Landing";
import StudentDashboard from "@/app/student/page";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("Student.creds"));
  }, []);

  if (isLoggedIn === null) return null;
  if (isLoggedIn) return <StudentDashboard />;
  return <Landing />;
}

"use client";

import { Button } from "@/components/ui/button";
import { SiGithub } from "react-icons/si";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "next-themes";
import { useEffect, useRef } from "react";
import { Computer } from "lucide-react";
import { Typewriter } from "react-simple-typewriter";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";

export default function Landing() {
  const { setTheme } = useTheme();

  useEffect(() => {
    setTheme("light");
  }, [setTheme]);

  const cardRef = useRef<HTMLDivElement>(null);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, { stiffness: 150, damping: 20 });
  const y = useSpring(rawY, { stiffness: 150, damping: 20 });
  const rotateX = useTransform(y, [-0.5, 0.5], [12, -12]);
  const rotateY = useTransform(x, [-0.5, 0.5], [-12, 12]);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    rawX.set((e.clientX - rect.left) / rect.width - 0.5);
    rawY.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  function handleMouseLeave() {
    rawX.set(0);
    rawY.set(0);
  }

  return (
    <div className="bg-white">
      <div className="h-screen w-screen p-20 relative bg-white flex items-center">
        <div className="grid grid-cols-[minmax(18rem,28rem)_1fr] gap-10 items-center w-full">
          <div className="max-w-lg">
            <p className="text-4xl font-medium pb-1">
              <Typewriter
                words={[
                  "Upgrade your StudentVUE® experience.",
                  "Empower your academia",
                  "Enable your academic potential.",
                  "Analyze your grades like never before.",
                  "Unlock insights into your student performance.",
                ]}
                loop={true}
                cursor={true}
              />{" "}
              <Badge variant="outline">EARLY ACCESS</Badge>
            </p>
            <p className="text-xl pb-5 wrap-normal">
              Student is a clean, minimalist, powerful, open-source StudentVUE®
              client. Built by students, for students.
            </p>
            <div className="flex flex-wrap gap-2 pb-6">
              <Link href="/login">
                <Button className="cursor-pointer bg-zinc-950 hover:bg-zinc-800 p-[18px] text-white">
                  <Image
                    src="/studentvue.png"
                    alt="StudentVUE® logo"
                    width="16"
                    height="16"
                  />{" "}
                  Log in with StudentVUE®
                </Button>
              </Link>
              <Link href="https://github.com/aramshiva/student">
                <Button className="cursor-pointer p-[18px]" variant="outline">
                  <SiGithub /> View Source Code
                </Button>
              </Link>
              <Link href="/gradebook/mock">
                <Button className="cursor-pointer p-[18px]" variant="outline">
                  <Computer /> View Mock Data
                </Button>
              </Link>
            </div>
            <p className="text-xs text-gray-600">
              District or Teacher?{" "}
              <Link href="mailto:inquires@aram.sh" className="underline">
                Email us for info and security details.
              </Link>
            </p>
          </div>
          <motion.div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ rotateX, rotateY, transformPerspective: 1000 }}
            className="relative w-full flex justify-end"
          >
            <Image
              src="/screenshots/gradebook.png"
              alt="Gradebook screenshot"
              width={2500}
              height={2500}
              className="relative z-10 h-auto"
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
}

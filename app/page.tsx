"use client";

import { Button } from "@/components/ui/button";
import { SiGithub } from "react-icons/si";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "next-themes";
import { useEffect } from "react";
import Tilt from 'react-parallax-tilt';
import { Computer } from "lucide-react";


export default function Home() {
  const { setTheme } = useTheme();

  useEffect(() => {
    setTheme("light");
  }, [setTheme]);

  return (
    <>
      <div className="bg-white">
        <div className="h-screen w-screen p-20 relative bg-white flex items-center">
          <div className="grid grid-cols-[minmax(18rem,28rem)_1fr] gap-10 items-center w-full">
            <div className="max-w-lg">
              <p className="text-4xl font-medium pb-1">
                Empower your academia.{" "}
                <Badge variant="outline">EARLY ACCESS</Badge>
              </p>
              <p className="text-xl pb-5 wrap-normal">
                Student is a clean, minimalist, powerful, open-source
                StudentVUE® client. Built by students, for students.
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
            <Tilt glareEnable>
            <div className="relative w-full flex justify-end">
              <Image
                src="/screenshots/gradebook.png"
                alt="Gradebook screenshot"
                width={2500}
                height={2500}
                className="relative z-10 h-auto"
              />
            </div>
            </Tilt>
          </div>
        </div>
        {/* 
        {/* <div className="bg-zinc-900 text-white w-screen relative">
          <div className="grid grid-cols-2 gap-10 items-start">
            <div className="relative p-10 w-full flex justify-start">
              <Image
                src="/screenshots/class.png"
                alt="Class screenshot"
                width={1600}
                height={1600}
                className="relative z-10 w-full h-auto max-w-5xl"
                priority
              />
            </div>
            <div className="p-20 w-full min-w-[50%] relative z-20">
              <p className="text-2xl">Clean, minimalistic UI</p>
              <p>
                Student features an ultra slick, clean interface. It{"'"}s miles
                ahead of StudentVUE®{"'"}s clunky old interface.
              </p>
            </div>
          </div>
        </div>

        <div className="p-20">
          <div className="grid grid-cols-2 grid-rows-1">
            <div />
            <div className="w-[30rem] text-right wrap-normal">
              <p className="text-2xl inline-flex items-center gap-x-2">
                <Lock className="w-5" /> Secure, and <EyeOff className="w-5" />{" "}
                Private
              </p>
              <p>
                Student was made with privacy and security in mind. Your
                credientials and grades are stored locally and is never seen,
                stored, or saved by us.{" "}
                <Link href="/privacy" className="underline">
                  Read our privacy policy.
                </Link>
              </p>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 text-white w-screen">
          <div className="p-20 w-[30rem]">
            <p className="text-2xl">
              Powerful features that make you go{" "}
              <span className="font-bold">wow</span>.
            </p>
            <p>
              Student gives clear fast analytics for your grades: per-assignment
              impact, progress bars, category breakdowns, and GPA stats. All
              computed locally and privately.
            </p>
          </div>
        </div>

        <div className="p-20">
          <p className="text-2xl pb-5 font-medium inline-flex items-center gap-x-2">
            Ready to power up your academics? <Rocket />{" "}
          </p>
          <div className="grid grid-cols-2 grid-rows-1">
            <div className="pr-10">
              <p className="text-xl pb-1">Students</p>
              <p className="pb-5">
                Log in today to experience a better StudentVUE® experience.
                Fast, Clean and more powerful than ever.
              </p>
              <Link href="/login">
                <Button className="cursor-pointer bg-zinc-950 hover:bg-zinc-800 p-[18px]">
                  <Image
                    src="/studentvue.png"
                    alt="StudentVUE® logo"
                    width="16"
                    height="16"
                  />{" "}
                  Log in with StudentVUE®
                </Button>
              </Link>
            </div>
            <div>
              <p className="text-xl">Districts or Teachers</p>
              <p className="pb-5">
                Contact us with questions, concerns or how we can integrate
                Student into your district. Student is{" "}
                <Link
                  href="https://github.com/aramshiva/student"
                  className="underline"
                >
                  open-source
                </Link>{" "}
                (meaning the code is avaliable for anyone to audit, or read!)
                and built by a student that cares about privacy.
              </p>
              <Link className="underline" href="mailto:inquires@aram.sh">
                <p>Reach out via email</p>
              </Link>
            </div>
          </div>
        </div> */}
      </div>
    </>
  );
}

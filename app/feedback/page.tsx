import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Mail } from "lucide-react";
import Link from "next/link";
import { SiGithub } from "react-icons/si";

export default function Feedback() {
  return (
    <>
      <div className="p-9 min-h-screen dark:bg-zinc-900">
        <div className="grid grid-cols-2 gap-4">
          <Link
            href="https://github.com/aramshiva/student/issues/new"
            target="_blank"
          >
            <Card className="pl-5">
              <CardTitle className="flex items-center gap-2 text-xl">
                <SiGithub className="text-2xl" /> GitHub
              </CardTitle>
              <CardDescription>
                Report bugs, provide suggestions or feedback through GitHub
                Issues!
              </CardDescription>
            </Card>
          </Link>
          <Link href="mailto:student@aram.sh" target="_blank">
            <Card className="pl-5">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Mail className="text-2xl" /> Email
              </CardTitle>
              <CardDescription>
                Email your feedback, suggestions, or issues to us at
                student@aram.sh
              </CardDescription>
            </Card>
          </Link>
        </div>
      </div>
    </>
  );
}

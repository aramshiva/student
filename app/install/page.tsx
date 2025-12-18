import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { SiAndroid, SiIos } from "react-icons/si";

export default function InstallPage() {
  return (
    <div className="max-w-screen dark:bg-zinc-900">
      <div className="max-w-4xl mx-auto p-6 min-h-screen">
        <div>
          <p className="text-xl font-medium pb-2">Mobile App</p>
          <p>
            Student uses{" "}
            <Link href="https://en.wikipedia.org/wiki/Progressive_web_app">
              PWAs
            </Link>{" "}
            to provide a seamless mobile app experience.
          </p>
          <p>
            To install Student, follow the instructions below for your device.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8 pt-5">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SiIos className="text-2xl" /> iPhone/iPad
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-3 text-zinc-500">
                <li>Open Safari and navigate to the Student website.</li>
                <li>
                  Tap the {'"'}Share{'"'} button (the square with an arrow
                  pointing up).
                </li>
                <li>
                  Scroll down and tap {'"'}Add to Home Screen{'"'}.
                </li>
                <li>
                  Tap {'"'}Add{'"'} in the top-right corner.
                </li>
              </ol>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SiAndroid className="text-2xl" /> Android
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-3 text-zinc-500">
                <li>Open Chrome and navigate to the Student website.</li>
                <li>Tap the three-dot menu in the top-right corner.</li>
                <li>
                  Select {'"'}Add to Home screen{'"'}.
                </li>
                <li>
                  Tap {'"'}Add{'"'} to confirm.
                </li>
              </ol>
            </CardContent>
          </Card>
        </div>
        <p className="text-zinc-500 text-xs">
          iOS, iPhone and iPad are registered trademarks of Apple Inc. Android
          is a trademark of Google LLC.
        </p>
      </div>
    </div>
  );
}

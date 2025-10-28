import Link from "next/link";

export default function PrivacyPage() {
  return (
    <>
      <div className="p-20">
        <div className="text-xl pb-9">
          <p>Privacy</p>
          <p className="text-gray-500">
            Student was built with security and privacy in mind. Student never
            stores or sees your credentials or grades.
          </p>
        </div>
        <div className="space-y-3">
          <div>
            <p>Zero Knowledge</p>
            <p className="text-gray-500">
              We can{"'"}t see your passwords, grades, or any other personal
              information! Your credentials are encrypted with AES-256-GCM and
              only decrypted temporarily when needed to communicate with
              StudentVUE.{" "}
            </p>
          </div>
          <div>
            <p>Direct Communication</p>
            <p className="text-gray-500">
              Student directly connects to your school{"'"}s official Synergy
              servers. Data isn{"'"}t passed to external services, third parties
              or stored by us.
            </p>
          </div>
          <div>
            <p>Open Source</p>
            <p className="text-gray-500">
              Student{"'"}s codebase is fully public on{" "}
              <Link
                href="https://github.com/aramshiva/student"
                target="_blank"
                className="underline"
              >
                GitHub
              </Link>{" "}
              (which means anyone can view, read, change, self host or audit the
              code).
            </p>
          </div>
          <div>
            <p>How It Works</p>
            <div className="text-gray-500">
              <p>How Student works:</p>
              <p>
                1. When you log in, your credentials are encrypted on the server
                using AES-256-GCM encryption.
              </p>
              <p>2. The encrypted data is stored in a secure https cookie.</p>
              <p>
                3. Credentials are decrypted only when making requests to your
                school
              </p>
              <p>
                4. We send the request to your school district{"'"}s synergy
                server.
              </p>
              <p>
                5. We return the result, and discard the decrypted credentials
              </p>
            </div>
          </div>
          <div className="pt-5">
            <p className="text-gray-600">
              Student was created as a passion project to provide a better, more
              clean, and more powerful alternative to StudentVUE. One of my main
              priorities were privacy. If you have any questions/concerns about
              how Student works, email me at{" "}
              <Link href="mailto:student@aram.sh" className="underline">
                student@aram.sh
              </Link>{" "}
              or open a{" "}
              <Link
                href="https://github.com/aramshiva/student/discussions/new?category=general"
                className="underline"
              >
                GitHub Discussion
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

import Link from "next/link";

export default function Privacy() {
  return (
    <>
      <div className="bg-white text-zinc-900 p-20 prose dark:bg-zinc-900 dark:text-zinc-200 min-h-screen [&_a]:underline">
        <h1 className="font-bold">Privacy Policy</h1>
        <h3 className="font-medium">Effective December 20th, 2025</h3>
        <p>
          Student was created by a privacy-minded teenager who wants a better
          alternative to StudentVUE. We promise to never sell, share or see your
          student information.
        </p>
        <br/>
        <h2 className="font-bold">Who we are</h2>
        <p>
          Student (“we,” “us,” “our”) is a third-party alternative client for
          StudentVUE. We are not affiliated with Edupoint Educational Systems,
          LLC, StudentVUE (a product of Edupoint), or any school district.
        </p>
        <p>
          We operate in the state of Washington, in the United States.
          StudentVUE is a trademark of Edupoint Educational Systems, LLC.
        </p>
        <br/>
        <h2 className="font-bold">What information we collect about you.</h2>
        <p>
          We will never store the user{"'"}s StudentVUE data or log in information
          on our servers. We do not operate any user accounts.
        </p>
        <p>
          <strong>Credentials and student records</strong> including any data
          returned by StudentVUE (grades, test history, schedule, attendance)
          are <strong>not stored</strong> by us.
        </p>
        <p>
          The user{"'"} data may be saved in browser storage (<strong>local storage or
          cookies</strong>) to keep the user signed in, remember the user{"'"}s preferences
          and caching. This data is not stored by us.
        </p>
        <p>
          Our hosting provider (Vercel, their privacy policy can be read{" "}
          <Link href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">here</Link>) may process{" "}
          <strong>standard technical data</strong> (anonymized IP address, user agent,
          timestamps, request metadata) in connection with delivering the
          Service, performance monitoring, and security. Again, no student
          records or credentials are included in this.
        </p>
        <p>
          We use <Link href="https://umami.is/"><strong>Umami Analytics</strong></Link> (Their privacy policy
          can be read <Link href="https://umami.is/privacy" target="_blank" rel="noopener noreferrer">here</Link>) to understand anonymized
          and aggregated usage of the service. Vercel Speed Analytics is also
          used to understand user experience statistics. These tools may collect
          device and user information such as pages viewed, approximate location
          (derived from IP), and device/browser characteristics. We do not use
          analytics to access your StudentVUE credentials or student records.
        </p>
        <br/>
        <h2 className="font-bold">How we interact with StudentVUE</h2>
        <p>
          When the user enters district information and sign in information, the
          Service sends the user{"'"}s credentials to the user{"'"}s school district{"'"}s
          Synergy (a product of Edupoint, and the server powering StudentVUE)
          server. <strong>The user{"'"}s credentials are used only for this purpose</strong>.
          Data flows from the User to the Service to the Synergy server and back
          to the user to display the user{"'"}s information.
        </p>
        <br/>
        <h2 className="font-bold">What we do not do</h2>
        <ul className="list-disc pl-5">
          <li>
            We <strong>do not</strong> sell or share the user{"'"}s information
          </li>
          <li>
            We <strong>do not</strong> collect student credentials or records in
            our own database.
          </li>
        </ul>
        <br/>
        <h2 className="font-bold">What Subprocessers touch your data</h2>
        <p>
          Student may share limited information to select subprocessers to
          deliver the Service and improve the service.
        </p>
        <ul className="list-disc pl-5">
          <li>
            With the user{"'"}s district{"'"}s Edupoint server (operating as StudentVUE)
            when the user use the service to provide student records to display
            to the user.
          </li>
          <li>
            With infrastructure providers (Vercel) to host and deliver the
            service.
          </li>
          <li>
            With analytics providers (Umami Analytics; Vercel Speed Insights)
            for usage and performance improvement to help improve user
            experience.
          </li>
          <li>
            For legal reasons if required to comply with law or valid legal
            process.
          </li>
        </ul>
        <br/>
        <h2 className="font-bold">How we store your data</h2>
        <p>
          Our server and database do not store the user{"'"}s data. The service may
          use browser storage and cookies to improve the user{"'"}s experience, this
          is only visible to the user, not us. The user can clear stored data at
          any time by clearing site data for the service in the browser
          settings.
        </p>
        <br/>
        <h2 className="font-bold">How long we retain your data</h2>
        <p>
          StudentVUE data is not stored on our servers. Analytics and
          operational logs are retained <strong>anonymized</strong> for the
          operational lifetime of the service to improve the user{"'"}s experience
        </p>
        <br/>
        <h2 className="font-bold">Exercising your rights</h2>
        <p>
          As we do not collect user data, we cannot delete data we do not
          collect. Local laws may require different requirements (for example
          GDPR or CCPA), so requests (like deletion of email inquiries) can be
          sent to inquiries@aram.sh, and we will try doing our best.
        </p>
        <br/>
        <h2 className="font-bold">How we protect your data</h2>
        <p>
          We use Hypertext Transfer Protocol Secure (HTTPS), HTTP Strict
          Transport Security (HSTS) and Transport Layer Security (TLS) and take
          reasonable measures to protect the service. No method of transmission
          or storage is completely secure.
        </p>
        <br/>
        <h2 className="font-bold">Children{"'"}s privacy</h2>
        <p>
          Student is intended for use by students, including those under 18, who
          have access to StudentVUE through their school or district. We do not
          knowingly collect or store StudentVUE credentials or student records
          on our server. If a parent/guardian believes we have received personal
          information directly (for example, through an email inquiry), please
          contact us at inquiries@aram.sh and we will delete it.
        </p>
        <p>
          We act as a third party tool authorized at student/family discretion,
          and don{"'"}t maintain educational records. Children under 13 should
          opt-out analytics in the settings page and receive parental consent to
          use the service.
        </p>
        <br/>
        <h2 className="font-bold">Changes to this policy</h2>
        <p>
          This policy may be changed at any time. We will post a new updated
          version with a new effective date.
        </p>
        <br/>
        <h2 className="font-bold">How to contact us</h2>
        <p>
          Thanks for reading! If you would like to contact us with inquiries
          (especially regarding your data), you can reach out to us at
          inquiries@aram.sh. If you have a general concern or comment about the
          service, you can reach out to us at student@aram.sh
        </p>
      </div>
    </>
  );
}

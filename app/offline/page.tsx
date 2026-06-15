import Link from "next/link";

export const metadata = {
  title: "Offline — Student",
};

export default function OfflinePage() {
  return (
    <div className="p-9 space-y-3">
      <p className="text-lg">You're offline.</p>
      <p className="text-sm text-muted-foreground">
        We haven't cached this page yet. Reconnect to the internet and try again.
      </p>
      <Link href="/" className="text-sm underline">
        Go back home
      </Link>
    </div>
  );
}

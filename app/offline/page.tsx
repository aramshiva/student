import Link from "next/link";

export const metadata = {
  title: "Offline — Student",
};

export default function OfflinePage() {
  return (
    <div className="p-9">
    <p className="text-lg">
      Your offline.
    </p>
    <p>
      <p>We haven't cached this page yet. Please try reconnecting to the internet and trying again.</p>
    </p>
    </div>
  );
}

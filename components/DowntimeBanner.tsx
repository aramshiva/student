"use client";
import * as React from "react";
import { AlertCircle, X } from "lucide-react";
import { Button } from "./ui/button";

interface DowntimeBannerProps {
  districtUrl: string;
}

const AFFECTED_DISTRICTS: Record<string, { name: string; message: string }> = {
  "wa-nor-psv.edupoint.com": {
    name: "Northshore School District",
    message:
    "NSD's StudentVUE servers are currently down due to an expired certificate. During this downtime, Student will also be down. We appreciate your patience." 
  },
};

export function DowntimeBanner({ districtUrl }: DowntimeBannerProps) {
  const [isDismissed, setIsDismissed] = React.useState(false);
  const districtInfo = AFFECTED_DISTRICTS[districtUrl];

  if (!districtInfo || isDismissed) {
    return null;
  }

  return (
    <div className="w-full bg-yellow-50 dark:bg-yellow-950 border-b border-yellow-200 dark:border-yellow-800 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
            Service Status Update
          </p>
          <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
            {districtInfo.message}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsDismissed(true)}
          className="flex-shrink-0 h-6 w-6 p-0 hover:bg-yellow-100 dark:hover:bg-yellow-900"
          aria-label="Dismiss banner"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

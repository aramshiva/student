import type { NextConfig } from "next";

const legacyApiPaths: Record<string, string> = {
  "/api/synergy/mail-read": "/api/synergy/mail/read",
  "/api/synergy/mail-delete": "/api/synergy/mail/move",
  "/api/synergy/mail-recipient": "/api/synergy/mail/recipient",
  "/api/synergy/attendance-day": "/api/synergy/attendance/day",
  "/api/synergy/school-info": "/api/synergy/school/info",
  "/api/synergy/document": "/api/synergy/documents/get",
  "/api/synergy/childlist": "/api/synergy/children",
  "/api/synergy/name": "/api/synergy/student/name",
  "/api/synergy/summary": "/api/synergy/student/summary",
};

const nextConfig: NextConfig = {
  async rewrites() {
    return Object.entries(legacyApiPaths).map(([source, destination]) => ({
      source,
      destination,
    }));
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

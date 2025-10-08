import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Student",
    short_name: "Student",
    description:
      "A alternative client for StudentVUE, with a refreshed UI and more powerful features to help maintain academics.",
    start_url: "/student",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      {
        src: "/brand/favicon/web-app-manifest-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/brand/favicon/web-app-manifest-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}

import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "HaloAI",
    short_name: "HaloAI",
    description: "Team and AI collaboration workspace",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f7fb",
    theme_color: "#6759ff",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}

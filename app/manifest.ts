import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sellora – The Creator Operating System",
    short_name: "Sellora",
    description:
      "Build portfolios, launch crowdfunding campaigns, sell products, and grow your audience, all in one platform built for creators.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#3b9ded",
    icons: [
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any" },
    ],
  };
}

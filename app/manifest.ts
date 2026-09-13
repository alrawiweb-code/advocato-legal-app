import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Advocato — Intelligence-Driven Legal Counsel",
    short_name: "Advocato",
    description: "Connect with verified, specialized attorneys through intelligent AI legal intake.",
    start_url: "/",
    display: "standalone",
    background_color: "#FAF9F6",
    theme_color: "#000A24",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}

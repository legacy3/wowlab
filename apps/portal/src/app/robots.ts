import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/account/",
        "/auth/",
        "/api/",
        "/rotations/editor/",
        "/simulate/results/",
      ],
    },
    sitemap: `${env.APP_URL}/sitemap.xml`,
  };
}

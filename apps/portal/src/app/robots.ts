import type { MetadataRoute } from "next";

import { env } from "@/lib/env";
import { getDisallowedPaths } from "@/lib/routing";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      allow: "/",
      disallow: [...getDisallowedPaths(), "/api/"],
      userAgent: "*",
    },
    sitemap: `${env.APP_URL}/sitemap.xml`,
  };
}

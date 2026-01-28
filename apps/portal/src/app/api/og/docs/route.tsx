import type { NextRequest } from "next/server";

import { getDoc } from "@/lib/content/docs";
import { createArticleOgImage, createSectionOgImage } from "@/lib/og";
import { routes } from "@/lib/routing";

export function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug");
  if (!slug) {
    return createSectionOgImage({
      description: routes.dev.docs.index.description,
      section: routes.dev.docs.index.label,
    });
  }

  const doc = getDoc(slug);
  if (!doc) {
    return createSectionOgImage({
      description: "Document not found",
      section: routes.dev.docs.index.label,
    });
  }

  return createArticleOgImage({
    description: doc.description ?? "",
    section: routes.dev.docs.index.label,
    title: doc.title,
  });
}

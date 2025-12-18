import { format, parseISO } from "date-fns";
import { createArticleOgImage, createSectionOgImage, ogSize } from "@/lib/og";
import { getBlogEntry } from "@/lib/blog";

export const alt = "WoW Lab Blog";
export const size = ogSize;
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = getBlogEntry(slug);

  if (!entry) {
    return createSectionOgImage({
      section: "Blog",
      description: "Post not found",
    });
  }

  const formattedDate = format(parseISO(entry.publishedAt), "MMMM d, yyyy");

  return createArticleOgImage({
    section: "Blog",
    title: entry.title,
    description: entry.description,
    author: entry.author,
    date: formattedDate,
    tag: entry.tags?.[0],
  });
}

import { format, parseISO } from "date-fns";

import { getBlogPost } from "@/lib/content/blog";
import { createArticleOgImage, createSectionOgImage, ogSize } from "@/lib/og";
import { routes } from "@/lib/routing";

export const alt = "WoW Lab Blog";
export const size = ogSize;
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    return createSectionOgImage({
      description: "Post not found",
      section: routes.blog.index.label,
    });
  }

  const formattedDate = format(parseISO(post.publishedAt), "MMMM d, yyyy");

  return createArticleOgImage({
    author: post.author,
    date: formattedDate,
    description: post.description ?? "",
    section: routes.blog.index.label,
    tag: post.tags?.[0],
    title: post.title,
  });
}

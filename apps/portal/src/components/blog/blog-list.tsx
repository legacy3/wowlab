"use client";

import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { useIntlayer } from "next-intlayer";
import { Box, Stack } from "styled-system/jsx";

import type { BlogPost } from "@/lib/content/blog";

import { Empty, Link, Text } from "@/components/ui";
import { href, routes } from "@/lib/routing";

type BlogListProps = {
  posts: BlogPost[];
};

export function BlogList({ posts }: BlogListProps) {
  const { blogList: content } = useIntlayer("blog");

  const virtualizer = useWindowVirtualizer({
    count: posts.length,
    estimateSize: () => 80,
    overscan: 5,
  });

  if (posts.length === 0) {
    return (
      <Empty.Root size="md" variant="plain">
        <Empty.Content>
          <Empty.Title>{content.noPostsYet}</Empty.Title>
        </Empty.Content>
      </Empty.Root>
    );
  }

  return (
    <Box h={`${virtualizer.getTotalSize()}px`} position="relative">
      {virtualizer.getVirtualItems().map((virtualRow) => {
        const post = posts[virtualRow.index];
        const slug = post.slug.replace(/^blog\//, "");

        return (
          <Box
            key={slug}
            position="absolute"
            top="0"
            left="0"
            w="full"
            style={{ transform: `translateY(${virtualRow.start}px)` }}
          >
            <Stack gap="1" pb="6">
              <Link href={href(routes.blog.post, { slug })}>{post.title}</Link>
              <Text color="fg.muted" textStyle="sm">
                {post.description}
              </Text>
              <Text
                as="time"
                color="fg.subtle"
                textStyle="xs"
                fontVariantNumeric="tabular-nums"
              >
                {new Intl.DateTimeFormat("en", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                }).format(new Date(post.publishedAt))}
              </Text>
            </Stack>
          </Box>
        );
      })}
    </Box>
  );
}

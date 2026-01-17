"use client";

import { useExtracted, useFormatter } from "next-intl";
import { Stack, VStack } from "styled-system/jsx";

import type { BlogPost } from "@/lib/content/blog";

import { Empty, Link, Text } from "@/components/ui";
import { href, routes } from "@/lib/routing";

type BlogListProps = {
  posts: BlogPost[];
};

export function BlogList({ posts }: BlogListProps) {
  const t = useExtracted();
  const format = useFormatter();

  if (posts.length === 0) {
    return (
      <Empty.Root size="md" variant="plain">
        <Empty.Content>
          <Empty.Title>{t("No posts yet")}</Empty.Title>
        </Empty.Content>
      </Empty.Root>
    );
  }

  return (
    <VStack alignItems="stretch" gap="6">
      {posts.map((post) => {
        const slug = post.slug.replace(/^blog\//, "");

        return (
          <Stack key={slug} gap="1">
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
              {format.dateTime(new Date(post.publishedAt), {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </Text>
          </Stack>
        );
      })}
    </VStack>
  );
}

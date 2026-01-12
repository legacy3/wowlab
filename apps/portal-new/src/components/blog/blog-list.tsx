"use client";

import { Stack, VStack } from "styled-system/jsx";

import type { BlogEntry } from "@/lib/blog/types";

import { Empty, Link, Text } from "@/components/ui";
import { href, routes } from "@/lib/routing";
import { formatDate } from "@/lib/utils/date";

type BlogListProps = {
  posts: BlogEntry[];
};

export function BlogList({ posts }: BlogListProps) {
  if (posts.length === 0) {
    return (
      <Empty.Root size="md" variant="plain">
        <Empty.Content>
          <Empty.Title>No posts yet</Empty.Title>
        </Empty.Content>
      </Empty.Root>
    );
  }

  return (
    <VStack alignItems="stretch" gap="6">
      {posts.map((post) => (
        <Stack key={post.slug} gap="1">
          <Link href={href(routes.blog.post, { slug: post.slug })}>
            {post.title}
          </Link>
          <Text color="fg.muted" textStyle="sm">
            {post.description}
          </Text>
          <Text
            as="time"
            color="fg.subtle"
            textStyle="xs"
            fontVariantNumeric="tabular-nums"
          >
            {formatDate(post.publishedAt)}
          </Text>
        </Stack>
      ))}
    </VStack>
  );
}

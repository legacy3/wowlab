"use client";

import NextLink from "next/link";
import { Box, Flex, VStack } from "styled-system/jsx";

import type { BlogEntry } from "@/lib/blog/types";

import { Empty } from "@/components/ui";
import { Link } from "@/components/ui/link";
import { Text } from "@/components/ui/text";
import { formatDate } from "@/lib/utils/date";

type BlogListProps = {
  posts: BlogEntry[];
};

export function BlogList({ posts }: BlogListProps) {
  if (posts.length === 0) {
    return (
      <Empty.Root size="md" variant="plain">
        <Empty.Content>
          <Empty.Title>No posts found</Empty.Title>
        </Empty.Content>
      </Empty.Root>
    );
  }

  return (
    <VStack alignItems="stretch" gap="0">
      {posts.map((post) => (
        <BlogListItem key={post.slug} post={post} />
      ))}
    </VStack>
  );
}

function BlogListItem({ post }: { post: BlogEntry }) {
  const formattedDate = formatDate(post.publishedAt);

  return (
    <Box
      as="article"
      borderBottomWidth="1px"
      borderColor="border.default/50"
      _hover={{ bg: "bg.subtle/30" }}
      transition="background-color"
    >
      <Link asChild variant="plain" textDecoration="none">
        <NextLink href={`/blog/${post.slug}`}>
          <Flex alignItems="center" gap="3" py="3">
            <VStack flex="1" minW="0" alignItems="flex-start" gap="0.5">
              <Text
                as="h3"
                fontWeight="medium"
                color="fg.default"
                overflow="hidden"
                textOverflow="ellipsis"
                whiteSpace="nowrap"
                w="full"
              >
                {post.title}
              </Text>
              <Text
                color="fg.muted"
                overflow="hidden"
                textOverflow="ellipsis"
                whiteSpace="nowrap"
                w="full"
                textStyle="xs"
              >
                {post.description}
              </Text>
            </VStack>
            <Text
              as="time"
              color="fg.muted"
              whiteSpace="nowrap"
              fontVariantNumeric="tabular-nums"
              flexShrink={0}
              textStyle="xs"
            >
              {formattedDate}
            </Text>
          </Flex>
        </NextLink>
      </Link>
    </Box>
  );
}

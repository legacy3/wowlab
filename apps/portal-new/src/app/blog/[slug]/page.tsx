import { Box, Flex, VStack } from "styled-system/jsx";

import { ArticleMeta } from "@/components/content/article-meta";
import { ArticleSidebar } from "@/components/content/article-sidebar";
import { ContentArticle } from "@/components/content/content-article";
import { ContentNav } from "@/components/content/content-nav";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { blogSlugs } from "@/lib/blog";
import { getBlogPageData } from "@/lib/blog/data";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const { Content, entry, next, prev } = await getBlogPageData(slug);

  return (
    <Flex gap="8">
      <Box flex="1" minW="0" maxW="3xl">
        <ContentArticle
          footer={<ContentNav prev={prev} next={next} showSubtitle />}
        >
          <VStack
            gap="3"
            alignItems="flex-start"
            mb="6"
            pb="6"
            borderBottomWidth="1px"
            borderColor="border.muted"
          >
            <Heading as="h1" size="4xl">
              {entry.title}
            </Heading>
            {entry.description && (
              <Text color="fg.muted" mt="-1">
                {entry.description}
              </Text>
            )}
            <ArticleMeta
              date={entry.publishedAt}
              author={entry.author}
              readingTime={entry.readingTime?.minutes ?? 0}
            />
          </VStack>
          <Content />
        </ContentArticle>
      </Box>

      <ArticleSidebar toc={entry.tableOfContents} />
    </Flex>
  );
}

export function generateStaticParams() {
  return blogSlugs.map((slug) => ({ slug }));
}

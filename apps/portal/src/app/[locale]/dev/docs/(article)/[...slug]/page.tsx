import { Box, Flex, VStack } from "styled-system/jsx";

import { ArticleMeta } from "@/components/content/article-meta";
import { ArticleSidebar } from "@/components/content/article-sidebar";
import { ContentArticle } from "@/components/content/content-article";
import { ContentNav } from "@/components/content/content-nav";
import { MDXContent } from "@/components/content/mdx-content";
import { NextSteps } from "@/components/content/next-steps";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { docsIndex, docSlugs, getDocPageData } from "@/lib/content/docs";

type Props = {
  params: Promise<{ slug: string[] }>;
};

export default async function DocPage({ params }: Props) {
  const { slug } = await params;
  const {
    body,
    description,
    fullSlug,
    next,
    nextSteps,
    prev,
    title,
    toc,
    updatedAt,
  } = await getDocPageData(slug);

  return (
    <Flex gap="8">
      <Box flex="1" minW="0" maxW="3xl">
        <ContentArticle footer={<ContentNav prev={prev} next={next} />}>
          <VStack gap="3" alignItems="flex-start" mb="8">
            <Heading as="h1" size="4xl">
              {title}
            </Heading>
            {description && (
              <Text color="fg.muted" mt="-1">
                {description}
              </Text>
            )}
            <ArticleMeta
              date={updatedAt}
              editPath={`apps/portal/src/content/docs/${fullSlug}.mdx`}
            />
          </VStack>
          <MDXContent code={body} />
          <NextSteps items={nextSteps} />
        </ContentArticle>
      </Box>

      <ArticleSidebar
        toc={toc}
        nav={{
          currentSlug: fullSlug,
          items: docsIndex,
        }}
      />
    </Flex>
  );
}

export function generateStaticParams() {
  return docSlugs.map((slug) => ({ slug: slug.split("/") }));
}

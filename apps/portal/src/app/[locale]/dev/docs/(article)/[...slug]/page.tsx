import { Box, Flex, VStack } from "styled-system/jsx";

import { ArticleMeta } from "@/components/content/article-meta";
import { ArticleSidebar } from "@/components/content/article-sidebar";
import { ContentArticle } from "@/components/content/content-article";
import { ContentNav } from "@/components/content/content-nav";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { docsIndex, docSlugs } from "@/lib/docs";
import { getDocPageData } from "@/lib/docs/data";

type Props = {
  params: Promise<{ slug: string[] }>;
};

export default async function DocPage({ params }: Props) {
  const { slug } = await params;
  const { Content, fullSlug, meta, next, prev, tableOfContents } =
    await getDocPageData(slug);

  return (
    <Flex gap="8">
      <Box flex="1" minW="0" maxW="3xl">
        <ContentArticle footer={<ContentNav prev={prev} next={next} />}>
          <VStack gap="3" alignItems="flex-start" mb="8">
            <Heading as="h1" size="4xl">
              {meta.title}
            </Heading>
            {meta.description && (
              <Text color="fg.muted" mt="-1">
                {meta.description}
              </Text>
            )}
            <ArticleMeta
              date={meta.updatedAt}
              editPath={`apps/portal/src/content/docs/${fullSlug}.md`}
            />
          </VStack>
          <Content />
        </ContentArticle>
      </Box>

      <ArticleSidebar
        toc={tableOfContents}
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

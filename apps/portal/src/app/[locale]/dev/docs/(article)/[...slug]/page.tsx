import type { Metadata } from "next";

import { ArticleJsonLd } from "next-seo";
import { Box, Flex, VStack } from "styled-system/jsx";

import { ArticleMeta } from "@/components/content/article-meta";
import { ArticleSidebar } from "@/components/content/article-sidebar";
import { ContentArticle } from "@/components/content/content-article";
import { ContentNav } from "@/components/content/content-nav";
import { MDXContent } from "@/components/content/mdx-content";
import { NextSteps } from "@/components/content/next-steps";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import {
  docsIndex,
  docSlugs,
  getDoc,
  getDocPageData,
} from "@/lib/content/docs";
import { env } from "@/lib/env";

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
    sortKey,
    title,
    toc,
    updatedAt,
  } = await getDocPageData(slug);

  return (
    <>
      <ArticleJsonLd
        type="Article"
        url={`${env.APP_URL}/dev/docs/${fullSlug}`}
        headline={title}
        description={description}
        dateModified={updatedAt}
        author="WoW Lab"
        isAccessibleForFree
      />
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
                editPath={`apps/portal/src/content/docs/${sortKey}.mdx`}
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
    </>
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const fullSlug = slug.join("/");

  const doc = getDoc(fullSlug);
  if (!doc) {
    return {};
  }

  return {
    description: doc.description,
    openGraph: {
      images: [
        {
          alt: doc.title,
          height: 630,
          url: `/api/og/docs?slug=${encodeURIComponent(fullSlug)}`,
          width: 1200,
        },
      ],
      modifiedTime: doc.updatedAt,
      type: "article",
    },
    title: doc.title,
  };
}

export function generateStaticParams() {
  return docSlugs.map((slug) => ({ slug: slug.split("/") }));
}

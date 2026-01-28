import type { Metadata } from "next";

import { ArticleJsonLd } from "next-seo";
import { Box, Flex, VStack } from "styled-system/jsx";

import { ArticleMeta } from "@/components/content/article-meta";
import { ArticleSidebar } from "@/components/content/article-sidebar";
import { ContentArticle } from "@/components/content/content-article";
import { ContentNav } from "@/components/content/content-nav";
import { MDXContent } from "@/components/content/mdx-content";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { blogSlugs, getBlogPageData, getBlogPost } from "@/lib/content/blog";
import { env } from "@/lib/env";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const { next, post, prev } = await getBlogPageData(slug);

  return (
    <>
      <ArticleJsonLd
        type="BlogPosting"
        url={`${env.APP_URL}/blog/${slug}`}
        headline={post.title}
        description={post.description}
        datePublished={post.publishedAt}
        author={post.author || "WoW Lab"}
        isAccessibleForFree
      />
      <Flex gap="8">
        <Box flex="1" minW="0" maxW="3xl">
          <ContentArticle
            footer={<ContentNav prev={prev} next={next} showSubtitle />}
          >
            <VStack gap="3" alignItems="flex-start" mb="8">
              <Heading as="h1" size="4xl">
                {post.title}
              </Heading>
              {post.description && (
                <Text color="fg.muted" mt="-1">
                  {post.description}
                </Text>
              )}
              <ArticleMeta
                date={post.publishedAt}
                author={post.author}
                readingTime={post.metadata.readingTime}
              />
            </VStack>
            <MDXContent code={post.body} />
          </ContentArticle>
        </Box>

        <ArticleSidebar toc={post.toc} />
      </Flex>
    </>
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  const post = getBlogPost(slug);
  if (!post) {
    return {};
  }

  return {
    description: post.description,
    openGraph: {
      authors: post.author ? [post.author] : undefined,
      publishedTime: post.publishedAt,
      type: "article",
    },
    title: post.title,
  };
}

export function generateStaticParams() {
  return blogSlugs.map((slug) => ({ slug }));
}

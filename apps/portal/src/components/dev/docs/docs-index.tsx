import { Flex, HStack, Stack } from "styled-system/jsx";

import { Button, Card } from "@/components/ui";
import { docsIndex, getFirstSlug } from "@/lib/content/docs";
import { href, routes } from "@/lib/routing";

import { DocTree } from "./doc-tree";
import { DocsSearchButton } from "./docs-search-button";

export function DocsIndex() {
  const sections = docsIndex.filter((item) => item.children);

  return (
    <Stack gap="6">
      <Card.Root px="5" py="4">
        <Flex justify="space-between" align="center" gap="4" flexWrap="wrap">
          <Card.Header p="0">
            <Card.Title>Get Started</Card.Title>
            <Card.Description>Introduction to WoW Lab</Card.Description>
          </Card.Header>
          <HStack gap="3">
            <DocsSearchButton />
            <Button asChild size="sm">
              <a href={href(routes.dev.docs.page, { slug: getFirstSlug() })}>
                Read the Introduction
              </a>
            </Button>
          </HStack>
        </Flex>
      </Card.Root>
      <DocTree items={sections} />
    </Stack>
  );
}

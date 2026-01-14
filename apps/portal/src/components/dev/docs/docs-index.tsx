import { Stack } from "styled-system/jsx";

import { Button, Card } from "@/components/ui";
import { docsIndex, getFirstSlug } from "@/lib/docs";
import { href, routes } from "@/lib/routing";

import { DocTree } from "./doc-tree";

export function DocsIndex() {
  const sections = docsIndex.filter((item) => item.children);

  return (
    <Stack gap="6">
      <Card.Root>
        <Card.Header>
          <Card.Title>Get Started</Card.Title>
          <Card.Description>Introduction to WoW Lab</Card.Description>
        </Card.Header>
        <Card.Footer>
          <Button asChild>
            <a href={href(routes.dev.docs.page, { slug: getFirstSlug() })}>
              Read the Overview
            </a>
          </Button>
        </Card.Footer>
      </Card.Root>
      <DocTree items={sections} />
    </Stack>
  );
}

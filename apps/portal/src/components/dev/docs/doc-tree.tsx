"use client";

import { Flex, VStack } from "styled-system/jsx";

import type { DocEntry } from "@/lib/content";

import * as Accordion from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/components/ui/link";
import { Text } from "@/components/ui/text";
import { href, routes } from "@/lib/routing";

type DocTreeProps = {
  items: DocEntry[];
  activeSlug?: string;
};

export function DocTree({ activeSlug, items }: DocTreeProps) {
  const sections = items.filter((item) => item.children);
  const defaultOpen = sections
    .filter((s) => s.children?.some((c) => c.slug === activeSlug))
    .map((s) => s.slug);

  return (
    <Accordion.Root defaultValue={defaultOpen} multiple>
      <VStack alignItems="stretch" gap="0">
        {sections.map((section) => (
          <DocSection
            key={section.slug}
            section={section}
            activeSlug={activeSlug}
          />
        ))}
      </VStack>
    </Accordion.Root>
  );
}

function DocLink({ isActive, item }: { item: DocEntry; isActive: boolean }) {
  const number = extractNumber(item.slug);

  return (
    <Link
      href={href(routes.dev.docs.page, { slug: item.slug })}
      variant="plain"
      textDecoration="none"
    >
      <Flex
        align="center"
        gap="3"
        py="1.5"
        px="3"
        borderRadius="md"
        bg={isActive ? "colorPalette.subtle.bg" : undefined}
        color={isActive ? "fg.default" : "fg.muted"}
        _hover={{ bg: "gray.subtle.bg/50", color: "fg.default" }}
        transition="colors"
        colorPalette="amber"
      >
        {number && (
          <Text
            color="fg.subtle"
            fontFamily="mono"
            textStyle="xs"
            fontVariantNumeric="tabular-nums"
            w="3"
            textAlign="right"
          >
            {number}
          </Text>
        )}
        <Text textStyle="sm">{item.title}</Text>
      </Flex>
    </Link>
  );
}

function DocSection({
  activeSlug,
  section,
}: {
  section: DocEntry;
  activeSlug?: string;
}) {
  const count = section.children?.length ?? 0;

  return (
    <Accordion.Item
      value={section.slug}
      borderTopWidth="1px"
      borderColor="border.subtle"
      _last={{ borderBottomWidth: "1px" }}
    >
      <Accordion.ItemTrigger py="3">
        <Flex align="center" gap="3" flex="1">
          <Text fontWeight="semibold">{section.title}</Text>
          <Badge variant="outline" size="sm">
            {count}
          </Badge>
        </Flex>
        <Accordion.ItemIndicator />
      </Accordion.ItemTrigger>
      <Accordion.ItemContent>
        <VStack alignItems="stretch" gap="0.5" pb="3">
          {section.children?.map((child) => (
            <DocLink
              key={child.slug}
              item={child}
              isActive={child.slug === activeSlug}
            />
          ))}
        </VStack>
      </Accordion.ItemContent>
    </Accordion.Item>
  );
}

function extractNumber(slug: string): string | null {
  const lastSegment = slug.split("/").pop() ?? slug;
  const match = lastSegment.match(/^(\d+)-/);
  return match ? String(parseInt(match[1], 10) + 1) : null;
}

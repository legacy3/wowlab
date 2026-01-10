"use client";

import { FileText } from "lucide-react";
import NextLink from "next/link";
import { Flex, VStack } from "styled-system/jsx";

import type { DocEntry } from "@/lib/docs/types";

import * as Accordion from "@/components/ui/accordion";
import { Icon } from "@/components/ui/icon";
import { Link } from "@/components/ui/link";
import { Text } from "@/components/ui/text";

type DocTreeProps = {
  items: DocEntry[];
  basePath?: string;
  activeSlug?: string;
};

export function DocTree({
  activeSlug,
  basePath = "/docs",
  items,
}: DocTreeProps) {
  const defaultOpenGroups = items
    .filter((item) => {
      if (!item.children) return false;
      return item.children.some((child) => child.slug === activeSlug);
    })
    .map((item) => item.slug);

  return (
    <VStack alignItems="stretch" gap="1">
      {items.map((item) => {
        if (item.children) {
          return (
            <Accordion.Root
              key={item.slug}
              defaultValue={defaultOpenGroups}
              multiple
            >
              <DocGroup
                item={item}
                basePath={basePath}
                activeSlug={activeSlug}
              />
            </Accordion.Root>
          );
        }

        const isActive = item.slug === activeSlug;
        return (
          <DocLeaf
            key={item.slug}
            item={item}
            basePath={basePath}
            isActive={isActive}
          />
        );
      })}
    </VStack>
  );
}

function DocGroup({
  activeSlug,
  basePath,
  item,
}: {
  item: DocEntry;
  basePath: string;
  activeSlug?: string;
}) {
  if (!item.children) return null;

  return (
    <Accordion.Item value={item.slug}>
      <Accordion.ItemTrigger>
        <Text fontWeight="medium" textStyle="sm">
          {item.title}
        </Text>
        <Accordion.ItemIndicator />
      </Accordion.ItemTrigger>
      <Accordion.ItemContent>
        <VStack alignItems="stretch" gap="1" pl="2">
          {item.children.map((child) => {
            const isActive = child.slug === activeSlug;
            return child.children ? (
              <DocGroup
                key={child.slug}
                item={child}
                basePath={basePath}
                activeSlug={activeSlug}
              />
            ) : (
              <DocLeaf
                key={child.slug}
                item={child}
                basePath={basePath}
                isActive={isActive}
              />
            );
          })}
        </VStack>
      </Accordion.ItemContent>
    </Accordion.Item>
  );
}

function DocLeaf({
  basePath,
  isActive,
  item,
}: {
  item: DocEntry;
  basePath: string;
  isActive: boolean;
}) {
  const href = `${basePath}/${item.slug}`;

  return (
    <Link asChild variant="plain" textDecoration="none">
      <NextLink href={href}>
        <Flex
          alignItems="center"
          gap="2"
          py="1.5"
          px="2"
          borderRadius="md"
          bg={isActive ? "gray.subtle.bg" : undefined}
          color={isActive ? "fg.default" : "fg.muted"}
          _hover={{ bg: "gray.subtle.bg/50" }}
          transition="colors"
        >
          <ItemNumber slug={item.slug} />
          <Text fontWeight="medium" textStyle="sm">
            {item.title}
          </Text>
        </Flex>
      </NextLink>
    </Link>
  );
}

function extractNumber(slug: string): string | null {
  const lastSegment = slug.split("/").pop() ?? slug;
  const match = lastSegment.match(/^(\d+)-/);
  return match ? String(parseInt(match[1], 10) + 1) : null;
}

function ItemNumber({ slug }: { slug: string }) {
  const number = extractNumber(slug);

  if (number) {
    return (
      <Text
        color="fg.muted"
        fontFamily="mono"
        textStyle="xs"
        fontVariantNumeric="tabular-nums"
        w="4"
        textAlign="right"
        flexShrink={0}
      >
        {number}.
      </Text>
    );
  }

  return (
    <Icon size="sm" color="fg.muted" flexShrink={0}>
      <FileText />
    </Icon>
  );
}

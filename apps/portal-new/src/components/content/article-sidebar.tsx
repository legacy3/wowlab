"use client";

import { CalendarIcon, ChevronDown, ChevronRight, Clock } from "lucide-react";
import NextLink from "next/link";
import { useState } from "react";
import { Box, Flex, VStack } from "styled-system/jsx";

import type { TocHeading } from "@/lib/content/toc";
import type { TocEntry } from "@/lib/content/types";

import { Heading } from "@/components/ui/heading";
import { Icon } from "@/components/ui/icon";
import { Link } from "@/components/ui/link";
import { Text } from "@/components/ui/text";
import { useActiveHeading } from "@/hooks/use-active-heading";
import { flattenToc } from "@/lib/content/toc";
import { formatDate } from "@/lib/utils/date";

type ArticleMeta = {
  date?: string;
  readingTime?: number;
};

type ArticleSidebarProps = {
  toc?: TocEntry[];
  meta?: ArticleMeta;
  nav?: {
    items: SidebarNavItem[];
    currentSlug: string;
    basePath: string;
  };
};

type SidebarNavItem = {
  slug: string;
  title: string;
  children?: SidebarNavItem[];
};

export function ArticleSidebar({ meta, nav, toc }: ArticleSidebarProps) {
  const headings = flattenToc(toc ?? []);
  const headingIds = headings.map((h) => h.id);
  const activeId = useActiveHeading(headingIds);

  const hasMeta = meta && (meta.date || meta.readingTime);
  const hasToc = headings.length > 0;
  const hasNav = nav && nav.items.length > 0;

  if (!hasMeta && !hasToc && !hasNav) {
    return null;
  }

  return (
    <Box
      as="aside"
      display={{ base: "none", xl: "block" }}
      w="52"
      flexShrink={0}
    >
      <VStack
        position="sticky"
        top="24"
        gap="6"
        alignItems="stretch"
        borderLeftWidth="1px"
        borderColor="border.muted"
        pl="4"
        maxH="calc(100vh - 8rem)"
        overflowY="auto"
      >
        {hasMeta && <Meta meta={meta} />}
        {hasNav && (
          <Navigation
            items={nav.items}
            currentSlug={nav.currentSlug}
            basePath={nav.basePath}
          />
        )}
        {hasToc && <TableOfContents headings={headings} activeId={activeId} />}
      </VStack>
    </Box>
  );
}

function Meta({ meta }: { meta: ArticleMeta }) {
  return (
    <VStack alignItems="flex-start" gap="1.5">
      {meta.date && (
        <Flex alignItems="center" gap="2" color="fg.muted">
          <Icon size="xs">
            <CalendarIcon />
          </Icon>
          <Text as="time" textStyle="xs">
            {formatDate(meta.date)}
          </Text>
        </Flex>
      )}
      {meta.readingTime && meta.readingTime > 0 && (
        <Flex alignItems="center" gap="2" color="fg.muted">
          <Icon size="xs">
            <Clock />
          </Icon>
          <Text textStyle="xs">{meta.readingTime} min read</Text>
        </Flex>
      )}
    </VStack>
  );
}

function NavGroup({
  basePath,
  currentSlug,
  defaultOpen,
  item,
}: {
  item: SidebarNavItem;
  currentSlug: string;
  basePath: string;
  defaultOpen: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (!item.children) {
    return null;
  }

  return (
    <Box>
      <Flex
        alignItems="center"
        gap="1"
        py="0.5"
        cursor="pointer"
        color="fg.muted"
        _hover={{ color: "fg.default" }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Icon size="xs">{isOpen ? <ChevronDown /> : <ChevronRight />}</Icon>
        <Text textStyle="xs" fontWeight="medium">
          {item.title}
        </Text>
      </Flex>
      {isOpen && (
        <VStack alignItems="stretch" gap="0.5" pl="4" mt="1">
          {item.children.map((child) => {
            const isActive = child.slug === currentSlug;
            return (
              <Link
                key={child.slug}
                asChild
                variant="plain"
                textStyle="xs"
                color={isActive ? "fg.default" : "fg.muted"}
                fontWeight={isActive ? "medium" : "normal"}
                _hover={{ color: "fg.default" }}
                py="0.5"
              >
                <NextLink href={`${basePath}/${child.slug}`}>
                  {child.title}
                </NextLink>
              </Link>
            );
          })}
        </VStack>
      )}
    </Box>
  );
}

function Navigation({
  basePath,
  currentSlug,
  items,
}: {
  items: SidebarNavItem[];
  currentSlug: string;
  basePath: string;
}) {
  return (
    <Box>
      <Heading
        as="h4"
        textStyle="xs"
        textTransform="uppercase"
        letterSpacing="wider"
        color="fg.muted"
        mb="3"
      >
        Navigation
      </Heading>
      <VStack alignItems="stretch" gap="1">
        {items.map((item) => {
          if (item.children) {
            const containsActive = item.children.some(
              (child) => child.slug === currentSlug,
            );
            return (
              <NavGroup
                key={item.slug}
                item={item}
                currentSlug={currentSlug}
                basePath={basePath}
                defaultOpen={containsActive}
              />
            );
          }

          const isActive = item.slug === currentSlug;
          return (
            <Link
              key={item.slug}
              asChild
              variant="plain"
              textStyle="xs"
              color={isActive ? "fg.default" : "fg.muted"}
              fontWeight={isActive ? "medium" : "normal"}
              _hover={{ color: "fg.default" }}
              py="0.5"
            >
              <NextLink href={`${basePath}/${item.slug}`}>
                {item.title}
              </NextLink>
            </Link>
          );
        })}
      </VStack>
    </Box>
  );
}

function TableOfContents({
  activeId,
  headings,
}: {
  headings: TocHeading[];
  activeId: string;
}) {
  if (headings.length === 0) {
    return null;
  }

  return (
    <Box>
      <Heading
        as="h4"
        textStyle="xs"
        textTransform="uppercase"
        letterSpacing="wider"
        color="fg.muted"
        mb="3"
      >
        On this page
      </Heading>
      <VStack
        as="nav"
        alignItems="stretch"
        gap="1"
        aria-label="Table of contents"
      >
        {headings.map((heading) => (
          <Link
            key={heading.id}
            href={`#${heading.id}`}
            variant="plain"
            textStyle="xs"
            pl={heading.level === 3 ? "3" : "0"}
            color={activeId === heading.id ? "fg.default" : "fg.muted"}
            fontWeight={activeId === heading.id ? "medium" : "normal"}
            _hover={{ color: "fg.default" }}
            lineHeight="snug"
            py="0.5"
          >
            {heading.text}
          </Link>
        ))}
      </VStack>
    </Box>
  );
}

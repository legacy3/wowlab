"use client";

import { useMemo } from "react";
import { Box, Flex, Stack, styled } from "styled-system/jsx";

import { Card, Code, ErrorBox, Heading, Skeleton, Text } from "@/components/ui";
import { useActiveHeading } from "@/hooks/use-active-heading";

// =============================================================================
// Demo Components
// =============================================================================

export function DemoBox({ children }: { children: React.ReactNode }) {
  return (
    <Box
      bg="bg.subtle"
      borderColor="border.subtle"
      borderRadius="l2"
      borderWidth="1px"
      p="4"
    >
      {children}
    </Box>
  );
}

export function DemoDescription({ children }: { children: React.ReactNode }) {
  return (
    <Text color="fg.muted" textStyle="sm" mb="4">
      {children}
    </Text>
  );
}

export function DemoLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text textStyle="xs" color="fg.subtle" mb="3">
      {children}
    </Text>
  );
}

// =============================================================================
// Layout
// =============================================================================

export const NavLink = styled("a", {
  base: {
    _hover: { bg: "gray.3", color: "fg.default" },
    color: "fg.muted",
    display: "block",
    fontSize: "sm",
    px: "3",
    py: "1.5",
    rounded: "l2",
    transition: "colors",
  },
  variants: {
    active: {
      true: {
        bg: "gray.3",
        color: "fg.default",
        fontWeight: "medium",
      },
    },
  },
});

interface PageLayoutProps {
  children: React.ReactNode;
  nav: Array<{ id: string; label: string }>;
}

export function ComponentCard({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <Card.Root>
      <Card.Header>
        <Card.Title>{title}</Card.Title>
      </Card.Header>
      <Card.Body>{children}</Card.Body>
    </Card.Root>
  );
}

// =============================================================================
// Sections
// =============================================================================

export function DataCard({
  children,
  description,
  title,
}: {
  children: React.ReactNode;
  description?: string;
  title: string;
}) {
  return (
    <Card.Root>
      <Card.Header>
        <Card.Title fontFamily="mono">{title}</Card.Title>
        {description && <Card.Description>{description}</Card.Description>}
      </Card.Header>
      <Card.Body>{children}</Card.Body>
    </Card.Root>
  );
}

export function ImportPath({ path }: { path: string }) {
  return (
    <>
      Import from <Code>{path}</Code>
    </>
  );
}

// =============================================================================
// Cards
// =============================================================================

export function JsonOutput({
  data,
  error,
  isLoading,
}: {
  data: unknown;
  error: Error | null;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <Stack gap="2">
        <Skeleton h="4" w="80%" />
        <Skeleton h="4" w="60%" />
        <Skeleton h="4" w="70%" />
        <Skeleton h="4" w="50%" />
      </Stack>
    );
  }

  if (error) {
    return <ErrorBox>Error: {error.message}</ErrorBox>;
  }

  if (data === null || data === undefined) {
    return (
      <Text color="fg.muted" fontStyle="italic">
        No data
      </Text>
    );
  }

  return (
    <Box overflow="auto" maxH="400px">
      <Code language="json">{JSON.stringify(data, null, 2)}</Code>
    </Box>
  );
}

export function PageLayout({ children, nav }: PageLayoutProps) {
  const headingIds = useMemo(() => nav.map((item) => item.id), [nav]);
  const activeId = useActiveHeading(headingIds);

  return (
    <Flex gap="8">
      <Box flex="1" minW="0">
        {children}
      </Box>

      <Box
        as="nav"
        position="sticky"
        top="20"
        w="44"
        flexShrink={0}
        display={{ base: "none", xl: "block" }}
        alignSelf="flex-start"
      >
        <Text
          fontSize="xs"
          fontWeight="semibold"
          color="fg.subtle"
          mb="3"
          px="3"
        >
          On this page
        </Text>
        <Stack gap="0.5">
          {nav.map((item) => (
            <NavLink
              key={item.id}
              href={`#${item.id}`}
              active={activeId === item.id}
            >
              {item.label}
            </NavLink>
          ))}
        </Stack>
      </Box>
    </Flex>
  );
}

// =============================================================================
// Data Display
// =============================================================================

export function Section({
  children,
  id,
  title,
}: {
  children: React.ReactNode;
  id: string;
  title: string;
}) {
  return (
    <styled.section id={id} mb="12" scrollMarginTop="24">
      <Heading
        as="h2"
        size="xl"
        mb="6"
        pb="2"
        borderBottomWidth="1px"
        borderColor="border"
      >
        {title}
      </Heading>
      {children}
    </styled.section>
  );
}

export function Subsection({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <styled.div mb="8">
      <Text
        fontWeight="semibold"
        color="fg.muted"
        mb="4"
        textTransform="uppercase"
        letterSpacing="wide"
        textStyle="xs"
      >
        {title}
      </Text>
      {children}
    </styled.div>
  );
}

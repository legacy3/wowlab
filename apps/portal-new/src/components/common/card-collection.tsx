"use client";

import NextLink from "next/link";
import { Stack, styled } from "styled-system/jsx";

import { Card, Link } from "@/components/ui";

const StyledCard = styled(Card.Root, {
  base: {
    _hover: { bg: "gray.2", borderColor: "border.emphasized" },
    cursor: "pointer",
    flex: 1,
    transition: "all",
    transitionDuration: "fast",
  },
});

export interface CardItem {
  description: string;
  href: string;
  title: string;
}

interface CardCollectionProps {
  items: CardItem[];
}

export function CardCollection({ items }: CardCollectionProps) {
  return (
    <Stack direction={{ base: "column", md: "row" }} gap="4">
      {items.map((item) => (
        <Link key={item.href} asChild variant="plain" flex="1">
          <NextLink href={item.href}>
            <StyledCard h="full">
              <Card.Header>
                <Card.Title>{item.title}</Card.Title>
                <Card.Description>{item.description}</Card.Description>
              </Card.Header>
            </StyledCard>
          </NextLink>
        </Link>
      ))}
    </Stack>
  );
}

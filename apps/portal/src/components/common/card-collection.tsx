"use client";

import { Stack, styled } from "styled-system/jsx";

import { Card, Link } from "@/components/ui";
import { href, type RouteDef } from "@/lib/routing";

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
  route: RouteDef;
  title: string;
}

interface CardCollectionProps {
  items: CardItem[];
}

export function CardCollection({ items }: CardCollectionProps) {
  return (
    <Stack direction={{ base: "column", md: "row" }} gap="4">
      {items.map((item) => (
        <Link
          key={href(item.route)}
          href={href(item.route)}
          variant="plain"
          textDecoration="none"
          flex="1"
        >
          <StyledCard h="full">
            <Card.Header>
              <Card.Title>{item.title}</Card.Title>
              <Card.Description>{item.description}</Card.Description>
            </Card.Header>
          </StyledCard>
        </Link>
      ))}
    </Stack>
  );
}

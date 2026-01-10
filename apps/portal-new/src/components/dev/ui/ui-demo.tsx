"use client";

import { Box, Flex, Stack, styled } from "styled-system/jsx";

import { Heading, Text } from "@/components/ui";

import {
  AccordionSection,
  AvatarSection,
  BadgesSection,
  ButtonsSection,
  CardsSection,
  CollapsibleSection,
  ColorsSection,
  LoadersSection,
  MenuSection,
  SkeletonsSection,
  TypographySection,
} from "./sections";

const sections = [
  { id: "loaders", label: "Loaders" },
  { id: "buttons", label: "Buttons" },
  { id: "typography", label: "Typography" },
  { id: "badges", label: "Badges" },
  { id: "cards", label: "Cards" },
  { id: "avatar", label: "Avatar" },
  { id: "menu", label: "Menu" },
  { id: "accordion", label: "Accordion" },
  { id: "collapsible", label: "Collapsible" },
  { id: "skeletons", label: "Skeletons" },
  { id: "colors", label: "Colors" },
];

const NavLink = styled("a", {
  base: {
    _hover: {
      bg: "gray.3",
      color: "fg.default",
    },
    color: "fg.muted",
    display: "block",
    fontSize: "sm",
    px: "3",
    py: "1.5",
    rounded: "l2",
  },
});

export function UiDemo() {
  return (
    <Flex gap="8">
      <Box flex="1" minW="0">
        <styled.header mb="12">
          <Heading as="h1" size="3xl" mb="2">
            UI Components
          </Heading>
          <Text color="fg.muted" textStyle="lg">
            Component reference for contributors. Import from{" "}
            <code>@/components/ui</code>.
          </Text>
        </styled.header>

        <LoadersSection />
        <ButtonsSection />
        <TypographySection />
        <BadgesSection />
        <CardsSection />
        <AvatarSection />
        <MenuSection />
        <AccordionSection />
        <CollapsibleSection />
        <SkeletonsSection />
        <ColorsSection />
      </Box>

      <SideNav />
    </Flex>
  );
}

function SideNav() {
  return (
    <Box
      as="nav"
      position="sticky"
      top="20"
      w="44"
      flexShrink={0}
      display={{ base: "none", xl: "block" }}
      alignSelf="flex-start"
    >
      <Text fontSize="xs" fontWeight="semibold" color="fg.subtle" mb="3" px="3">
        On this page
      </Text>
      <Stack gap="0.5">
        {sections.map((s) => (
          <NavLink key={s.id} href={`#${s.id}`}>
            {s.label}
          </NavLink>
        ))}
      </Stack>
    </Box>
  );
}

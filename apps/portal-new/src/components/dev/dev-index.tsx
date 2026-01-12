import { Box, styled } from "styled-system/jsx";

import { CardCollection } from "@/components/common";
import { Heading, Text } from "@/components/ui";
import { routes } from "@/lib/routes";

const sections = [
  {
    description: "Park UI components with Panda CSS recipes",
    href: routes.dev.ui,
    title: "UI Components",
  },
  {
    description: "Game data hooks for spells, items, classes, and specs",
    href: routes.dev.data,
    title: "Game Data",
  },
];

export function DevIndex() {
  return (
    <Box>
      <styled.header mb="8">
        <Heading as="h1" size="3xl" mb="2">
          Developer Tools
        </Heading>
        <Text color="fg.muted" textStyle="lg">
          Component showcases and data inspection tools
        </Text>
      </styled.header>

      <CardCollection items={sections} />
    </Box>
  );
}

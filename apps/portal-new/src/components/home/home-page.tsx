"use client";

import { Stack } from "styled-system/jsx";

import { CardCollection } from "@/components/common";
import { Button, Heading, Text } from "@/components/ui";
import { routes } from "@/lib/routes";

const features = [
  {
    description: "Run quick simulations for your character",
    href: routes.simulate,
    title: "Simulate",
  },
  {
    description: "Build and share rotation priority lists",
    href: routes.rotations.index,
    title: "Rotations",
  },
  {
    description: "Explore game data and inspect spells",
    href: routes.dev.data,
    title: "Data Lab",
  },
];

export function HomePage() {
  return (
    <Stack gap="8" maxW="6xl">
      <Stack gap="2">
        <Heading as="h1" fontSize="3xl">
          WoW Lab
        </Heading>
        <Text color="fg.muted" fontSize="lg">
          Simulation and theorycrafting tools for World of Warcraft
        </Text>
      </Stack>

      <Stack direction="row" gap="4">
        <Button>Get Started</Button>
        <Button variant="outline">Documentation</Button>
      </Stack>

      <CardCollection items={features} />
    </Stack>
  );
}

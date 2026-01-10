"use client";

import { Button, Card, Heading, Text } from "@/components/ui";
import { Box, Container, Stack } from "styled-system/jsx";

export default function HomePage() {
  return (
    <Box bg="bg.canvas" minH="100vh">
      <Container maxW="6xl" py="8">
        <Stack gap="8">
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

          <Stack direction={{ base: "column", md: "row" }} gap="4">
            <Card.Root flex="1">
              <Card.Header>
                <Card.Title>Simulate</Card.Title>
                <Card.Description>
                  Run quick simulations for your character
                </Card.Description>
              </Card.Header>
            </Card.Root>

            <Card.Root flex="1">
              <Card.Header>
                <Card.Title>Optimize</Card.Title>
                <Card.Description>
                  Find the best gear and talents for your build
                </Card.Description>
              </Card.Header>
            </Card.Root>

            <Card.Root flex="1">
              <Card.Header>
                <Card.Title>Lab</Card.Title>
                <Card.Description>
                  Explore game data and inspect spells
                </Card.Description>
              </Card.Header>
            </Card.Root>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}

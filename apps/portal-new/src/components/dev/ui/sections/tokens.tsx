"use client";

import { FlameIcon, SettingsIcon, UserIcon } from "lucide-react";
import { Box, Grid, HStack, Stack } from "styled-system/jsx";

import {
  AbsoluteCenter,
  Badge,
  Button,
  Card,
  Group,
  Heading,
  Icon,
  Link,
  Loader,
  Text,
} from "@/components/ui";

import { Section, Subsection } from "../../shared";

export function TokensSection() {
  return (
    <Section id="tokens" title="Tokens">
      <Stack gap="8">
        {/* Typography */}
        <Subsection title="Typography">
          <Grid columns={{ base: 1, md: 2 }} gap="6">
            <Stack gap="3">
              {(["3xl", "2xl", "xl", "lg", "md", "sm"] as const).map((size) => (
                <Heading key={size} size={size}>
                  Heading {size}
                </Heading>
              ))}
            </Stack>
            <Stack gap="3">
              {(["lg", "md", "sm", "xs"] as const).map((size) => (
                <Text key={size} textStyle={size}>
                  Text {size}
                </Text>
              ))}
              <Stack gap="1" mt="2">
                <Text color="fg.default">fg.default</Text>
                <Text color="fg.muted">fg.muted</Text>
                <Text color="fg.subtle">fg.subtle</Text>
              </Stack>
              <HStack gap="4" mt="2">
                <Link href="#">Link</Link>
                <Link href="#" colorPalette="amber">
                  Amber
                </Link>
                <Link href="#" colorPalette="red">
                  Red
                </Link>
              </HStack>
            </Stack>
          </Grid>
        </Subsection>

        {/* Color Palettes */}
        <Subsection title="Color Palettes">
          <Grid columns={{ base: 1, lg: 4, sm: 2 }} gap="6">
            {(["amber", "green", "red", "gray"] as const).map((color) => (
              <Card.Root key={color}>
                <Card.Header>
                  <Card.Title textTransform="capitalize">{color}</Card.Title>
                </Card.Header>
                <Card.Body>
                  <Stack gap="3">
                    <Button colorPalette={color} size="sm">
                      Button
                    </Button>
                    <Button colorPalette={color} variant="outline" size="sm">
                      Outline
                    </Button>
                    <Badge colorPalette={color}>Badge</Badge>
                    <Box color={`${color}.solid.bg`}>
                      <Loader size="sm" />
                    </Box>
                  </Stack>
                </Card.Body>
              </Card.Root>
            ))}
          </Grid>
        </Subsection>

        {/* Icon */}
        <Subsection title="Icon">
          <Stack gap="4">
            <Text color="fg.muted">
              Wrapper for lucide-react icons with consistent sizing.
            </Text>
            <HStack gap="4" alignItems="end">
              {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
                <Stack key={size} gap="1" alignItems="center">
                  <Icon size={size}>
                    <FlameIcon />
                  </Icon>
                  <Text textStyle="xs" color="fg.muted">
                    {size}
                  </Text>
                </Stack>
              ))}
            </HStack>
            <HStack gap="4">
              <Icon size="lg" color="amber.solid.bg">
                <FlameIcon />
              </Icon>
              <Icon size="lg" color="green.solid.bg">
                <UserIcon />
              </Icon>
              <Icon size="lg" color="red.solid.bg">
                <SettingsIcon />
              </Icon>
            </HStack>
          </Stack>
        </Subsection>

        {/* Group */}
        <Subsection title="Group">
          <Stack gap="4">
            <Text color="fg.muted">
              Groups elements together with consistent spacing and optional
              attached styling.
            </Text>
            <HStack gap="6" flexWrap="wrap">
              <Stack gap="2">
                <Text textStyle="sm" fontWeight="medium">
                  Default
                </Text>
                <Group>
                  <Button variant="outline">One</Button>
                  <Button variant="outline">Two</Button>
                  <Button variant="outline">Three</Button>
                </Group>
              </Stack>
              <Stack gap="2">
                <Text textStyle="sm" fontWeight="medium">
                  Attached
                </Text>
                <Group attached>
                  <Button variant="outline">One</Button>
                  <Button variant="outline">Two</Button>
                  <Button variant="outline">Three</Button>
                </Group>
              </Stack>
            </HStack>
          </Stack>
        </Subsection>

        {/* AbsoluteCenter */}
        <Subsection title="AbsoluteCenter">
          <Stack gap="4">
            <Text color="fg.muted">
              Centers content absolutely within a relative parent.
            </Text>
            <HStack gap="6">
              <Box position="relative" w="32" h="32" bg="gray.3" rounded="lg">
                <AbsoluteCenter>
                  <Loader size="md" />
                </AbsoluteCenter>
              </Box>
              <Box position="relative" w="32" h="32" bg="gray.3" rounded="lg">
                <AbsoluteCenter axis="horizontal">
                  <Badge>Centered X</Badge>
                </AbsoluteCenter>
              </Box>
              <Box position="relative" w="32" h="32" bg="gray.3" rounded="lg">
                <AbsoluteCenter axis="vertical">
                  <Badge>Centered Y</Badge>
                </AbsoluteCenter>
              </Box>
            </HStack>
          </Stack>
        </Subsection>
      </Stack>
    </Section>
  );
}

"use client";

import { FlameIcon, SettingsIcon, UserIcon } from "lucide-react";
import { Box, HStack, Stack, VStack } from "styled-system/jsx";

import {
  AbsoluteCenter,
  Badge,
  Button,
  Group,
  Heading,
  Icon,
  Link,
  Loader,
  Text,
} from "@/components/ui";
import { href, routes } from "@/lib/routing";

import {
  DemoBox,
  DemoDescription,
  DemoLabel,
  Section,
  Subsection,
} from "../../shared";

export function TokensSection() {
  return (
    <Section id="tokens" title="Tokens">
      <Stack gap="10">
        <TypographyDemo />
        <ColorPalettesDemo />
        <IconDemo />
        <GroupDemo />
        <AbsoluteCenterDemo />
      </Stack>
    </Section>
  );
}

function AbsoluteCenterDemo() {
  return (
    <Subsection title="AbsoluteCenter">
      <DemoDescription>Center content absolutely.</DemoDescription>
      <Stack gap="4">
        <DemoBox>
          <DemoLabel>Both Axes</DemoLabel>
          <Box position="relative" h="24" bg="gray.3" rounded="md">
            <AbsoluteCenter>
              <Loader size="md" />
            </AbsoluteCenter>
          </Box>
        </DemoBox>
        <DemoBox>
          <DemoLabel>Horizontal / Vertical</DemoLabel>
          <HStack gap="4">
            <Box position="relative" h="24" flex="1" bg="gray.3" rounded="md">
              <AbsoluteCenter axis="horizontal">
                <Badge>Centered X</Badge>
              </AbsoluteCenter>
            </Box>
            <Box position="relative" h="24" flex="1" bg="gray.3" rounded="md">
              <AbsoluteCenter axis="vertical">
                <Badge>Centered Y</Badge>
              </AbsoluteCenter>
            </Box>
          </HStack>
        </DemoBox>
      </Stack>
    </Subsection>
  );
}

function ColorPalettesDemo() {
  return (
    <Subsection title="Color Palettes">
      <DemoDescription>Available color palettes.</DemoDescription>
      <DemoBox>
        <HStack gap="6" flexWrap="wrap" justify="center">
          {(["amber", "green", "red", "gray"] as const).map((color) => (
            <VStack key={color} gap="3" alignItems="center">
              <Text textStyle="xs" fontWeight="medium" color="fg.muted">
                {color}
              </Text>
              <Button colorPalette={color} size="sm">
                Button
              </Button>
              <Button colorPalette={color} variant="outline" size="sm">
                Outline
              </Button>
              <HStack gap="2">
                <Badge colorPalette={color}>Badge</Badge>
                <Box color={`${color}.solid.bg`}>
                  <Loader size="sm" />
                </Box>
              </HStack>
            </VStack>
          ))}
        </HStack>
      </DemoBox>
    </Subsection>
  );
}

function GroupDemo() {
  return (
    <Subsection title="Group">
      <DemoDescription>Group elements together.</DemoDescription>
      <Stack gap="4">
        <DemoBox>
          <DemoLabel>Default (spaced)</DemoLabel>
          <Group>
            <Button variant="outline">One</Button>
            <Button variant="outline">Two</Button>
            <Button variant="outline">Three</Button>
          </Group>
        </DemoBox>
        <DemoBox>
          <DemoLabel>Attached</DemoLabel>
          <Group attached>
            <Button variant="outline">One</Button>
            <Button variant="outline">Two</Button>
            <Button variant="outline">Three</Button>
          </Group>
        </DemoBox>
      </Stack>
    </Subsection>
  );
}

function IconDemo() {
  return (
    <Subsection title="Icon">
      <DemoDescription>Icon wrapper with sizing.</DemoDescription>
      <Stack gap="4">
        <DemoBox>
          <DemoLabel>Sizes</DemoLabel>
          <HStack gap="4" alignItems="end" justify="center" py="2">
            {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
              <VStack key={size} gap="1" alignItems="center">
                <Icon size={size}>
                  <FlameIcon />
                </Icon>
                <Text textStyle="xs" color="fg.muted">
                  {size}
                </Text>
              </VStack>
            ))}
          </HStack>
        </DemoBox>
        <DemoBox>
          <DemoLabel>Colors</DemoLabel>
          <HStack gap="4" justify="center" py="2">
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
        </DemoBox>
      </Stack>
    </Subsection>
  );
}

function TypographyDemo() {
  return (
    <Subsection title="Typography">
      <DemoDescription>
        Text styles, heading sizes, and semantic colors.
      </DemoDescription>
      <Stack gap="4">
        <DemoBox>
          <DemoLabel>Heading Sizes</DemoLabel>
          <VStack gap="2" alignItems="stretch">
            {(["3xl", "2xl", "xl", "lg", "md", "sm"] as const).map((size) => (
              <HStack key={size} justify="space-between" py="0.5">
                <Heading size={size}>Heading</Heading>
                <Text color="fg.muted" textStyle="xs">
                  {size}
                </Text>
              </HStack>
            ))}
          </VStack>
        </DemoBox>
        <DemoBox>
          <DemoLabel>Text Sizes</DemoLabel>
          <VStack gap="2" alignItems="stretch">
            {(["lg", "md", "sm", "xs"] as const).map((size) => (
              <HStack key={size} justify="space-between" py="0.5">
                <Text textStyle={size}>Text {size}</Text>
                <Text color="fg.muted" textStyle="xs">
                  {size}
                </Text>
              </HStack>
            ))}
          </VStack>
        </DemoBox>
        <DemoBox>
          <DemoLabel>Semantic Colors</DemoLabel>
          <Stack gap="0" divideY="1px" divideColor="border.muted">
            <HStack justify="space-between" py="1.5">
              <Text color="fg.default">fg.default</Text>
              <Text color="fg.muted" textStyle="xs">
                default
              </Text>
            </HStack>
            <HStack justify="space-between" py="1.5">
              <Text color="fg.muted">fg.muted</Text>
              <Text color="fg.muted" textStyle="xs">
                muted
              </Text>
            </HStack>
            <HStack justify="space-between" py="1.5">
              <Text color="fg.subtle">fg.subtle</Text>
              <Text color="fg.muted" textStyle="xs">
                subtle
              </Text>
            </HStack>
          </Stack>
        </DemoBox>
        <DemoBox>
          <DemoLabel>Links</DemoLabel>
          <VStack gap="2" alignItems="stretch">
            <HStack justify="space-between" py="0.5">
              <Link href={href(routes.dev.ui)}>Default Link</Link>
              <Text color="fg.muted" textStyle="xs">
                default
              </Text>
            </HStack>
            <HStack justify="space-between" py="0.5">
              <Link href={href(routes.dev.ui)} colorPalette="amber">
                Amber Link
              </Link>
              <Text color="fg.muted" textStyle="xs">
                amber
              </Text>
            </HStack>
            <HStack justify="space-between" py="0.5">
              <Link href={href(routes.dev.ui)} colorPalette="red">
                Red Link
              </Link>
              <Text color="fg.muted" textStyle="xs">
                red
              </Text>
            </HStack>
          </VStack>
        </DemoBox>
      </Stack>
    </Subsection>
  );
}

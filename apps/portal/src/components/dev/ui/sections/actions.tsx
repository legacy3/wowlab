"use client";

import { useBoolean } from "ahooks";
import { MoreHorizontalIcon, SettingsIcon, UserIcon } from "lucide-react";
import { HStack, Stack, VStack } from "styled-system/jsx";

import { Button, IconButton, Text } from "@/components/ui";

import {
  DemoBox,
  DemoDescription,
  DemoLabel,
  Section,
  Subsection,
} from "../../shared";

export function ActionsSection() {
  return (
    <Section id="actions" title="Actions">
      <Stack gap="10">
        <ButtonDemo />
        <IconButtonDemo />
      </Stack>
    </Section>
  );
}

function ButtonDemo() {
  const [loading, { setFalse: stopLoading, setTrue: startLoading }] =
    useBoolean(false);

  const handleClick = () => {
    startLoading();
    setTimeout(stopLoading, 2000);
  };

  return (
    <Subsection title="Button">
      <DemoDescription>Variants, sizes, and loading states.</DemoDescription>
      <Stack gap="4">
        <DemoBox>
          <DemoLabel>Variants</DemoLabel>
          <HStack gap="2" flexWrap="wrap">
            <Button variant="solid" size="sm">
              Solid
            </Button>
            <Button variant="surface" size="sm">
              Surface
            </Button>
            <Button variant="subtle" size="sm">
              Subtle
            </Button>
            <Button variant="outline" size="sm">
              Outline
            </Button>
            <Button variant="plain" size="sm">
              Plain
            </Button>
          </HStack>
        </DemoBox>
        <DemoBox>
          <DemoLabel>Sizes</DemoLabel>
          <HStack gap="2" flexWrap="wrap" alignItems="center">
            {(["2xs", "xs", "sm", "md", "lg"] as const).map((size) => (
              <VStack key={size} gap="1" alignItems="center">
                <Button size={size}>{size}</Button>
              </VStack>
            ))}
          </HStack>
        </DemoBox>
        <DemoBox>
          <DemoLabel>Colors</DemoLabel>
          <HStack gap="2" flexWrap="wrap">
            <Button colorPalette="amber" size="sm">
              Amber
            </Button>
            <Button colorPalette="green" size="sm">
              Green
            </Button>
            <Button colorPalette="red" size="sm">
              Red
            </Button>
            <Button colorPalette="gray" size="sm">
              Gray
            </Button>
          </HStack>
        </DemoBox>
        <DemoBox>
          <DemoLabel>Loading States</DemoLabel>
          <HStack gap="2" flexWrap="wrap">
            <Button loading size="sm">
              Loading
            </Button>
            <Button loading loadingText="Simulating..." size="sm">
              Simulate
            </Button>
            <Button loading={loading} onClick={handleClick} size="sm">
              {loading ? "Processing..." : "Click to load"}
            </Button>
          </HStack>
        </DemoBox>
      </Stack>
    </Subsection>
  );
}

function IconButtonDemo() {
  return (
    <Subsection title="IconButton">
      <DemoDescription>Icon-only buttons.</DemoDescription>
      <Stack gap="4">
        <DemoBox>
          <DemoLabel>Variants</DemoLabel>
          <HStack gap="3">
            <VStack gap="1" alignItems="center">
              <IconButton aria-label="Settings" variant="solid">
                <SettingsIcon />
              </IconButton>
              <Text textStyle="xs" color="fg.muted">
                solid
              </Text>
            </VStack>
            <VStack gap="1" alignItems="center">
              <IconButton aria-label="Settings" variant="outline">
                <SettingsIcon />
              </IconButton>
              <Text textStyle="xs" color="fg.muted">
                outline
              </Text>
            </VStack>
            <VStack gap="1" alignItems="center">
              <IconButton aria-label="More" variant="subtle">
                <MoreHorizontalIcon />
              </IconButton>
              <Text textStyle="xs" color="fg.muted">
                subtle
              </Text>
            </VStack>
            <VStack gap="1" alignItems="center">
              <IconButton aria-label="User" variant="plain">
                <UserIcon />
              </IconButton>
              <Text textStyle="xs" color="fg.muted">
                plain
              </Text>
            </VStack>
          </HStack>
        </DemoBox>
        <DemoBox>
          <DemoLabel>Sizes</DemoLabel>
          <HStack gap="3" alignItems="end">
            {(["xs", "sm", "md", "lg"] as const).map((size) => (
              <VStack key={size} gap="1" alignItems="center">
                <IconButton aria-label="Settings" size={size}>
                  <SettingsIcon />
                </IconButton>
                <Text textStyle="xs" color="fg.muted">
                  {size}
                </Text>
              </VStack>
            ))}
          </HStack>
        </DemoBox>
      </Stack>
    </Subsection>
  );
}

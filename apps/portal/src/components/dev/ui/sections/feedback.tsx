"use client";

import { Cpu, Inbox, Search } from "lucide-react";
import { HStack, Stack, VStack } from "styled-system/jsx";

import {
  Button,
  CardLoader,
  Empty,
  ErrorBox,
  InlineLoader,
  Loader,
  Skeleton,
  SkeletonCircle,
  SkeletonText,
  Text,
} from "@/components/ui";

import {
  DemoBox,
  DemoDescription,
  DemoLabel,
  fixtures,
  Section,
  Subsection,
} from "../../shared";

export function FeedbackSection() {
  return (
    <Section id="feedback" title="Feedback" lazy minHeight={2590}>
      <Stack gap="10">
        <LoaderDemo />
        <SkeletonDemo />
        <EmptyDemo />
        <ErrorBoxDemo />
      </Stack>
    </Section>
  );
}

function EmptyDemo() {
  return (
    <Subsection title="Empty">
      <DemoDescription>Empty state placeholders.</DemoDescription>
      <Stack gap="4">
        <DemoBox>
          <DemoLabel>Variants</DemoLabel>
          <HStack gap="4" flexWrap="wrap" alignItems="start">
            <Empty.Root variant="outline" size="sm">
              <Empty.Icon>
                <Inbox />
              </Empty.Icon>
              <Empty.Content>
                <Empty.Title>outline</Empty.Title>
                <Empty.Description>Add items to get started</Empty.Description>
              </Empty.Content>
            </Empty.Root>
            <Empty.Root variant="subtle" size="sm">
              <Empty.Icon>
                <Search />
              </Empty.Icon>
              <Empty.Content>
                <Empty.Title>subtle</Empty.Title>
                <Empty.Description>Try a different search</Empty.Description>
              </Empty.Content>
            </Empty.Root>
            <Empty.Root variant="plain" size="sm">
              <Empty.Icon>
                <Cpu />
              </Empty.Icon>
              <Empty.Content>
                <Empty.Title>plain</Empty.Title>
                <Empty.Description>Run one to see results</Empty.Description>
              </Empty.Content>
            </Empty.Root>
          </HStack>
        </DemoBox>
        <DemoBox>
          <DemoLabel>With Action</DemoLabel>
          <Empty.Root size="sm">
            <Empty.Icon>
              <Inbox />
            </Empty.Icon>
            <Empty.Content>
              <Empty.Title>No rotations</Empty.Title>
              <Empty.Description>Create one to start</Empty.Description>
            </Empty.Content>
            <Empty.Action>
              <Button size="xs">Create</Button>
            </Empty.Action>
          </Empty.Root>
        </DemoBox>
        <DemoBox>
          <DemoLabel>Sizes</DemoLabel>
          <HStack gap="4" alignItems="start">
            {(["sm", "md"] as const).map((size) => (
              <Empty.Root key={size} variant="outline" size={size}>
                <Empty.Content>
                  <Empty.Title>{size}</Empty.Title>
                </Empty.Content>
              </Empty.Root>
            ))}
          </HStack>
        </DemoBox>
      </Stack>
    </Subsection>
  );
}

function ErrorBoxDemo() {
  return (
    <Subsection title="ErrorBox">
      <DemoDescription>Error message display.</DemoDescription>
      <Stack gap="4">
        <DemoBox>
          <DemoLabel>Default</DemoLabel>
          <ErrorBox>{fixtures.error.simple}</ErrorBox>
        </DemoBox>
        <DemoBox>
          <DemoLabel>Subtle (for stack traces)</DemoLabel>
          <ErrorBox variant="subtle">{fixtures.error.stackTrace}</ErrorBox>
        </DemoBox>
      </Stack>
    </Subsection>
  );
}

function LoaderDemo() {
  return (
    <Subsection title="Loader">
      <DemoDescription>Flask loading indicator.</DemoDescription>
      <Stack gap="4">
        <DemoBox>
          <DemoLabel>Sizes</DemoLabel>
          <HStack gap="4" alignItems="end" justify="center" py="2">
            {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
              <VStack key={size} gap="1" alignItems="center">
                <Loader size={size} />
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
            {(["amber", "green", "red", "gray"] as const).map((color) => (
              <VStack key={color} gap="1" color={`${color}.solid.bg`}>
                <Loader size="lg" />
                <Text textStyle="xs" color="fg.muted">
                  {color}
                </Text>
              </VStack>
            ))}
          </HStack>
        </DemoBox>
        <DemoBox>
          <DemoLabel>CardLoader & InlineLoader</DemoLabel>
          <Stack gap="4">
            <CardLoader message="Loading character..." />
            <HStack gap="3" justify="center" py="2">
              <InlineLoader />
              <InlineLoader variant="processing" />
              <Text textStyle="sm" color="fg.muted">
                For buttons
              </Text>
            </HStack>
          </Stack>
        </DemoBox>
      </Stack>
    </Subsection>
  );
}

function SkeletonDemo() {
  return (
    <Subsection title="Skeleton">
      <DemoDescription>Loading placeholders.</DemoDescription>
      <Stack gap="4">
        <DemoBox>
          <DemoLabel>Basic Lines</DemoLabel>
          <Stack gap="3">
            <Skeleton h="4" w="75%" />
            <Skeleton h="4" w="50%" />
            <Skeleton h="4" w="90%" />
          </Stack>
        </DemoBox>
        <DemoBox>
          <DemoLabel>Text & Circle</DemoLabel>
          <HStack gap="6">
            <Stack gap="2" flex="1">
              <SkeletonText noOfLines={3} />
            </Stack>
            <HStack gap="2">
              <SkeletonCircle w="8" h="8" />
              <SkeletonCircle w="12" h="12" />
            </HStack>
          </HStack>
        </DemoBox>
        <DemoBox>
          <DemoLabel>Card Pattern</DemoLabel>
          <HStack gap="4">
            <SkeletonCircle w="12" h="12" />
            <Stack gap="2" flex="1">
              <Skeleton h="4" w="40%" />
              <Skeleton h="3" w="70%" />
            </Stack>
          </HStack>
        </DemoBox>
      </Stack>
    </Subsection>
  );
}

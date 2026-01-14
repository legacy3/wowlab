"use client";

import { Cpu, Inbox, Search } from "lucide-react";
import { Grid, HStack, Stack, VStack } from "styled-system/jsx";

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

import { ComponentCard, fixtures, Section, Subsection } from "../../shared";

export function FeedbackSection() {
  return (
    <Section id="feedback" title="Feedback">
      <Stack gap="8">
        <Subsection title="ErrorBox">
          <Grid columns={{ base: 1, md: 2 }} gap="4">
            <ComponentCard title="default">
              <ErrorBox>{fixtures.error.simple}</ErrorBox>
            </ComponentCard>
            <ComponentCard title="subtle">
              <ErrorBox variant="subtle">{fixtures.error.stackTrace}</ErrorBox>
            </ComponentCard>
          </Grid>
        </Subsection>

        <Subsection title="Loader">
          <Grid columns={{ base: 1, md: 2 }} gap="4">
            <ComponentCard title="sizes">
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
            </ComponentCard>
            <ComponentCard title="colors">
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
            </ComponentCard>
            <ComponentCard title="CardLoader">
              <CardLoader message="Loading data..." />
            </ComponentCard>
            <ComponentCard title="InlineLoader">
              <HStack gap="3" justify="center" py="4">
                <InlineLoader />
                <InlineLoader variant="processing" />
                <Text textStyle="sm" color="fg.muted">
                  For buttons
                </Text>
              </HStack>
            </ComponentCard>
          </Grid>
        </Subsection>

        <Subsection title="Skeleton">
          <Grid columns={{ base: 1, md: 2 }} gap="4">
            <ComponentCard title="basic">
              <Stack gap="3">
                <Skeleton h="4" w="75%" />
                <Skeleton h="4" w="50%" />
                <Skeleton h="4" w="90%" />
              </Stack>
            </ComponentCard>
            <ComponentCard title="text">
              <SkeletonText noOfLines={3} />
            </ComponentCard>
            <ComponentCard title="circle">
              <HStack gap="4">
                <SkeletonCircle w="8" h="8" />
                <SkeletonCircle w="12" h="12" />
                <SkeletonCircle w="16" h="16" />
              </HStack>
            </ComponentCard>
            <ComponentCard title="card pattern">
              <HStack gap="4">
                <SkeletonCircle w="12" h="12" />
                <Stack gap="2" flex="1">
                  <Skeleton h="4" w="40%" />
                  <Skeleton h="3" w="70%" />
                </Stack>
              </HStack>
            </ComponentCard>
          </Grid>
        </Subsection>

        <Subsection title="Empty">
          <Grid columns={{ base: 1, md: 3 }} gap="4">
            <ComponentCard title="outline">
              <Empty.Root variant="outline" size="sm">
                <Empty.Icon>
                  <Inbox />
                </Empty.Icon>
                <Empty.Content>
                  <Empty.Title>No items</Empty.Title>
                  <Empty.Description>
                    Add items to get started
                  </Empty.Description>
                </Empty.Content>
              </Empty.Root>
            </ComponentCard>
            <ComponentCard title="subtle">
              <Empty.Root variant="subtle" size="sm">
                <Empty.Icon>
                  <Search />
                </Empty.Icon>
                <Empty.Content>
                  <Empty.Title>No results</Empty.Title>
                  <Empty.Description>Try a different search</Empty.Description>
                </Empty.Content>
              </Empty.Root>
            </ComponentCard>
            <ComponentCard title="plain">
              <Empty.Root variant="plain" size="sm">
                <Empty.Icon>
                  <Cpu />
                </Empty.Icon>
                <Empty.Content>
                  <Empty.Title>No simulations</Empty.Title>
                  <Empty.Description>Run one to see results</Empty.Description>
                </Empty.Content>
              </Empty.Root>
            </ComponentCard>
            <ComponentCard title="with action">
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
            </ComponentCard>
            <ComponentCard title="sizes">
              <HStack gap="2" alignItems="start">
                {(["sm", "md"] as const).map((size) => (
                  <Empty.Root key={size} variant="outline" size={size}>
                    <Empty.Content>
                      <Empty.Title>{size}</Empty.Title>
                    </Empty.Content>
                  </Empty.Root>
                ))}
              </HStack>
            </ComponentCard>
          </Grid>
        </Subsection>
      </Stack>
    </Section>
  );
}

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
        {/* ErrorBox */}
        <Subsection title="ErrorBox">
          <Stack gap="4">
            <ErrorBox>{fixtures.error.simple}</ErrorBox>
            <ErrorBox variant="subtle">{fixtures.error.stackTrace}</ErrorBox>
          </Stack>
        </Subsection>

        {/* Loaders */}
        <Subsection title="Loaders">
          <Stack gap="6">
            <HStack gap="8" flexWrap="wrap" alignItems="end">
              {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
                <VStack key={size} gap="2">
                  <Loader size={size} />
                  <Text textStyle="xs" color="fg.muted">
                    {size}
                  </Text>
                </VStack>
              ))}
            </HStack>
            <HStack gap="8" flexWrap="wrap" alignItems="end">
              {(["amber", "green", "red", "gray"] as const).map((color) => (
                <VStack key={color} gap="2" color={`${color}.solid.bg`}>
                  <Loader size="lg" />
                  <Text textStyle="xs" color="fg.muted">
                    {color}
                  </Text>
                </VStack>
              ))}
            </HStack>
            <Grid columns={{ base: 1, md: 2 }} gap="6">
              <ComponentCard title="CardLoader">
                <CardLoader message="Loading data..." />
              </ComponentCard>
              <ComponentCard title="InlineLoader">
                <HStack gap="4" justifyContent="center" py="8">
                  <InlineLoader />
                  <Text textStyle="sm" color="fg.muted">
                    For buttons
                  </Text>
                </HStack>
              </ComponentCard>
            </Grid>
          </Stack>
        </Subsection>

        {/* Skeletons */}
        <Subsection title="Skeletons">
          <Grid columns={{ base: 1, md: 2 }} gap="6">
            <ComponentCard title="Basic">
              <Stack gap="4">
                <Skeleton h="4" w="75%" />
                <Skeleton h="4" w="50%" />
                <Skeleton h="4" w="90%" />
              </Stack>
            </ComponentCard>
            <ComponentCard title="Text">
              <SkeletonText noOfLines={3} />
            </ComponentCard>
            <ComponentCard title="Circle">
              <HStack gap="4">
                <SkeletonCircle w="8" h="8" />
                <SkeletonCircle w="12" h="12" />
                <SkeletonCircle w="16" h="16" />
              </HStack>
            </ComponentCard>
            <ComponentCard title="Card Pattern">
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

        {/* Empty States */}
        <Subsection title="Empty States">
          <Stack gap="6">
            <Grid columns={{ base: 1, md: 3 }} gap="6">
              <ComponentCard title="Outline (default)">
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
              <ComponentCard title="Subtle">
                <Empty.Root variant="subtle" size="sm">
                  <Empty.Icon>
                    <Search />
                  </Empty.Icon>
                  <Empty.Content>
                    <Empty.Title>No results</Empty.Title>
                    <Empty.Description>
                      Try a different search
                    </Empty.Description>
                  </Empty.Content>
                </Empty.Root>
              </ComponentCard>
              <ComponentCard title="Plain">
                <Empty.Root variant="plain" size="sm">
                  <Empty.Icon>
                    <Cpu />
                  </Empty.Icon>
                  <Empty.Content>
                    <Empty.Title>No simulations</Empty.Title>
                    <Empty.Description>
                      Run one to see results
                    </Empty.Description>
                  </Empty.Content>
                </Empty.Root>
              </ComponentCard>
            </Grid>
            <Grid columns={{ base: 1, md: 2 }} gap="6">
              <ComponentCard title="With Action">
                <Empty.Root size="md">
                  <Empty.Icon>
                    <Inbox />
                  </Empty.Icon>
                  <Empty.Content>
                    <Empty.Title>No rotations yet</Empty.Title>
                    <Empty.Description>
                      Create your first rotation to get started
                    </Empty.Description>
                  </Empty.Content>
                  <Empty.Action>
                    <Button size="sm">Create rotation</Button>
                  </Empty.Action>
                </Empty.Root>
              </ComponentCard>
              <ComponentCard title="Sizes">
                <HStack gap="4" alignItems="start">
                  {(["sm", "md", "lg"] as const).map((size) => (
                    <Empty.Root key={size} variant="outline" size={size}>
                      <Empty.Content>
                        <Empty.Title>{size}</Empty.Title>
                      </Empty.Content>
                    </Empty.Root>
                  ))}
                </HStack>
              </ComponentCard>
            </Grid>
          </Stack>
        </Subsection>
      </Stack>
    </Section>
  );
}

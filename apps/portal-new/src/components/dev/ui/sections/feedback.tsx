"use client";

import { Grid, HStack, Stack, VStack } from "styled-system/jsx";

import {
  CardLoader,
  InlineLoader,
  Loader,
  Skeleton,
  SkeletonCircle,
  SkeletonText,
  Text,
} from "@/components/ui";

import { ComponentCard, Section, Subsection } from "../../shared";

export function FeedbackSection() {
  return (
    <Section id="feedback" title="Feedback">
      <Stack gap="8">
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
      </Stack>
    </Section>
  );
}

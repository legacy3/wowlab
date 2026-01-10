import { Grid, HStack, Stack } from "styled-system/jsx";

import { Skeleton, SkeletonCircle, SkeletonText } from "@/components/ui";

import { ComponentCard, Section } from "../shared";

export function SkeletonsSection() {
  return (
    <Section id="skeletons" title="Skeletons">
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
    </Section>
  );
}

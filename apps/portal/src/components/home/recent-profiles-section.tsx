"use client";

import { useIntlayer } from "next-intlayer";
import { css } from "styled-system/css";
import { Box, Flex, Grid, HStack, VStack } from "styled-system/jsx";

import { GameIcon } from "@/components/game";
import { Heading, Link, Text } from "@/components/ui";
import { hashString } from "@/lib/hash";
import { href, routes } from "@/lib/routing";
import { type RecentProfile, useRecentProfiles } from "@/lib/sim";
import { useClassesAndSpecs } from "@/lib/state";

const profileCardStyles = css({
  _hover: { bg: "bg.subtle", borderColor: "border.emphasized" },
  bg: "bg.default",
  borderRadius: "lg",
  borderWidth: "1px",
  cursor: "pointer",
  p: "4",
  transition: "all",
  transitionDuration: "fast",
});

export function RecentProfilesSection() {
  const { recentProfiles: content } = useIntlayer("home");
  const recent = useRecentProfiles((s) => s.recent);

  if (recent.length === 0) {
    return null;
  }

  return (
    <Flex direction="column" gap="4">
      <Flex direction="column" gap="1">
        <Heading as="h2" size="md">
          {content.title}
        </Heading>
        <Text textStyle="sm" color="fg.muted">
          {content.description}
        </Text>
      </Flex>
      <Grid
        gridTemplateColumns={{
          base: "1fr",
          lg: "repeat(3, 1fr)",
          sm: "repeat(2, 1fr)",
          xl: "repeat(4, 1fr)",
        }}
        gap="3"
      >
        {recent.slice(0, 8).map((r) => (
          <RecentProfileCard key={hashString(r.simc)} recent={r} />
        ))}
      </Grid>
    </Flex>
  );
}

function RecentProfileCard({ recent }: { recent: RecentProfile }) {
  const { character } = recent.profile;
  const { getClassColor, specs } = useClassesAndSpecs();

  const spec = character.spec
    ? specs.find((s) => s.name.toLowerCase() === character.spec?.toLowerCase())
    : null;

  const specIcon = spec?.file_name ?? null;
  const classColor = spec ? getClassColor(spec.id) : null;
  const server = character.server ?? "Unknown";
  const region = character.region?.toUpperCase() ?? "";

  return (
    <Link
      href={href(routes.simulate.index)}
      variant="plain"
      textDecoration="none"
    >
      <Box className={profileCardStyles}>
        <HStack gap="3">
          <GameIcon iconName={specIcon} size="lg" />
          <VStack alignItems="start" gap="0.5" minW="0">
            <Text
              fontWeight="semibold"
              truncate
              style={classColor ? { color: classColor } : undefined}
            >
              {character.name}
            </Text>
            <Text textStyle="sm" color="fg.muted" truncate>
              {character.spec ?? character.class}
            </Text>
            <Text textStyle="xs" color="fg.subtle" truncate>
              {server}
              {region && `-${region}`}
            </Text>
          </VStack>
        </HStack>
      </Box>
    </Link>
  );
}

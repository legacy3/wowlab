"use client";

import { useIntlayer } from "next-intlayer";
import { css } from "styled-system/css";
import { Grid, Stack } from "styled-system/jsx";

import { Card, Heading, Link } from "@/components/ui";
import { href, type RouteDef, routes } from "@/lib/routing";

import { RecentProfilesSection } from "./recent-profiles-section";

const featureCardStyles = css({
  _hover: { bg: "gray.2", borderColor: "border.emphasized" },
  cursor: "pointer",
  h: "full",
  transition: "all",
  transitionDuration: "fast",
});

interface FeatureItem {
  description: string;
  route: RouteDef;
  title: string;
}

export function HomePage() {
  const { homePage: content } = useIntlayer("home");

  const features: FeatureItem[] = [
    {
      description: content.simulateDescription,
      route: routes.simulate.index,
      title: content.simulateTitle,
    },
    {
      description: content.rotationsDescription,
      route: routes.rotations.index,
      title: content.rotationsTitle,
    },
    {
      description: content.hooksDescription,
      route: routes.dev.hooks,
      title: content.hooksTitle,
    },
  ];

  return (
    <Stack gap="8">
      <RecentProfilesSection />

      <Stack gap="4">
        <Heading as="h2" size="md">
          {content.toolsTitle}
        </Heading>
        <Grid
          gridTemplateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }}
          gap="4"
        >
          {features.map((item) => (
            <FeatureLink key={href(item.route)} item={item} />
          ))}
        </Grid>
      </Stack>
    </Stack>
  );
}

function FeatureLink({ item }: { item: FeatureItem }) {
  return (
    <Link href={href(item.route)} variant="plain" textDecoration="none">
      <Card.Root className={featureCardStyles}>
        <Card.Header>
          <Card.Title>{item.title}</Card.Title>
          <Card.Description>{item.description}</Card.Description>
        </Card.Header>
      </Card.Root>
    </Link>
  );
}

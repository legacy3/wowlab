"use client";

import { useExtracted } from "next-intl";

import { CardCollection } from "@/components/common";
import { routes } from "@/lib/routing";

export function HomePage() {
  const t = useExtracted();

  const features = [
    {
      description: t("Run quick simulations for your character"),
      route: routes.simulate.index,
      title: t("Simulate"),
    },
    {
      description: t("Build and share rotation priority lists"),
      route: routes.rotations.index,
      title: t("Rotations"),
    },
    {
      description: t("Explore game data hooks for spells and items"),
      route: routes.dev.hooks,
      title: t("Hooks"),
    },
  ];

  return <CardCollection items={features} />;
}

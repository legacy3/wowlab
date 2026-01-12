"use client";

import { CardCollection } from "@/components/common";
import { routes } from "@/lib/routes";

const features = [
  {
    description: "Run quick simulations for your character",
    href: routes.simulate,
    title: "Simulate",
  },
  {
    description: "Build and share rotation priority lists",
    href: routes.rotations.index,
    title: "Rotations",
  },
  {
    description: "Explore game data and inspect spells",
    href: routes.dev.data,
    title: "Data Lab",
  },
];

export function HomePage() {
  return <CardCollection items={features} />;
}

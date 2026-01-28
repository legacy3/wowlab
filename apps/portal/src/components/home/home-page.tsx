"use client";

import { useIntlayer } from "next-intlayer";

import { CardCollection } from "@/components/common";
import { routes } from "@/lib/routing";

export function HomePage() {
  const { homePage: content } = useIntlayer("home");

  const features = [
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

  return <CardCollection items={features} />;
}

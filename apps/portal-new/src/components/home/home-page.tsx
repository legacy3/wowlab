"use client";

import { useTranslations } from "next-intl";

import { CardCollection } from "@/components/common";
import { routes } from "@/lib/routing";

export function HomePage() {
  const t = useTranslations("Home");

  const features = [
    {
      description: t("simulate.description"),
      route: routes.simulate.index,
      title: t("simulate.title"),
    },
    {
      description: t("rotations.description"),
      route: routes.rotations.index,
      title: t("rotations.title"),
    },
    {
      description: t("dataLab.description"),
      route: routes.dev.data,
      title: t("dataLab.title"),
    },
  ];

  return <CardCollection items={features} />;
}

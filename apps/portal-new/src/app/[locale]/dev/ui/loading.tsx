"use client";

import { useExtracted } from "next-intl";

import { PageLoader } from "@/components/ui";

export default function DevUiLoading() {
  const t = useExtracted();

  return <PageLoader message={t("Loading...")} />;
}

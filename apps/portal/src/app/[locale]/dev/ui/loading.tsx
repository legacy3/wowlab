"use client";

import { useIntlayer } from "next-intlayer";

import { PageLoader } from "@/components/ui";

export default function DevUiLoading() {
  const content = useIntlayer("loading");

  return <PageLoader message={content.loading} />;
}

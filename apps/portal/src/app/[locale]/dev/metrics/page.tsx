"use client";

import dynamic from "next/dynamic";

import { PageLoader } from "@/components/ui";

const MetricsContent = dynamic(
  () =>
    import("@/components/dev/metrics/metrics-content").then(
      (m) => m.MetricsContent,
    ),
  { loading: () => <PageLoader message="Loading WASM..." />, ssr: false },
);

export default function DevMetricsPage() {
  return <MetricsContent />;
}

"use client";

import dynamic from "next/dynamic";

import { PageLoader } from "@/components/ui";

const SimulateContent = dynamic(
  () =>
    import("@/components/simulate/simulate-content").then(
      (m) => m.SimulateContent,
    ),
  { loading: () => <PageLoader message="Loading WASM..." />, ssr: false },
);

export default function SimulatePage() {
  return <SimulateContent />;
}

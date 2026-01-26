"use client";

import dynamic from "next/dynamic";

import { PageLoader } from "@/components/ui";

const EngineContent = dynamic(
  () =>
    import("@/components/dev/engine/engine-content").then(
      (m) => m.EngineContent,
    ),
  { loading: () => <PageLoader message="Loading WASM..." />, ssr: false },
);

export default function DevEnginePage() {
  return <EngineContent />;
}

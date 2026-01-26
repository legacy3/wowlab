"use client";

import dynamic from "next/dynamic";

import { PageLoader } from "@/components/ui";

const UiDemo = dynamic(
  () => import("@/components/dev/ui/ui-demo").then((m) => m.UiDemo),
  { loading: () => <PageLoader message="Loading WASM..." />, ssr: false },
);

export default function DevUiPage() {
  return <UiDemo />;
}

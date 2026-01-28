"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";

import { PageLoader } from "@/components/ui";
import { extractSpecId } from "@/lib/trait";

const TraitsContent = dynamic(
  () =>
    import("@/components/plan/traits/traits-content").then(
      (m) => m.TraitsContent,
    ),
  { loading: () => <PageLoader message="Loading WASM..." />, ssr: false },
);

export default function Page() {
  const searchParams = useSearchParams();
  const loadout = searchParams.get("loadout");

  if (!loadout) {
    return <TraitsContent type="start" />;
  }

  const specId = extractSpecId(loadout);

  if (!specId) {
    return <TraitsContent type="invalid" />;
  }

  return <TraitsContent type="calculator" specId={specId} />;
}

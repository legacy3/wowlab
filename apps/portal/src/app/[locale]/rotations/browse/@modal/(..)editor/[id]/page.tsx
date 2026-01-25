"use client";

import { useParams } from "next/navigation";

import type { RotationsRow } from "@/lib/engine";

import { RotationPreviewDrawer } from "@/components/rotations";
import { Loader } from "@/components/ui";
import { rotations, useResource } from "@/lib/refine";
import { useClassesAndSpecs } from "@/lib/state";

export default function RotationPreviewModal() {
  const params = useParams<{ id: string }>();
  const { getClassColor, getSpecLabel } = useClassesAndSpecs();

  const { data: rotation, isLoading } = useResource<RotationsRow>({
    ...rotations,
    id: params.id,
  });

  if (isLoading || !rotation) {
    return (
      <div
        style={{
          alignItems: "center",
          display: "flex",
          inset: 0,
          justifyContent: "center",
          position: "fixed",
        }}
      >
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <RotationPreviewDrawer
      rotation={rotation}
      getClassColor={getClassColor}
      getSpecLabel={getSpecLabel}
    />
  );
}

"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";

import type { RotationsRow } from "@/lib/engine";

import { RotationPreviewDrawer } from "@/components/rotations";
import { Loader } from "@/components/ui";
import { useClassesAndSpecs } from "@/lib/state";
import { createClient } from "@/lib/supabase";

export default function RotationPreviewModal() {
  const params = useParams<{ id: string }>();
  const { getClassColor, getSpecLabel } = useClassesAndSpecs();
  const supabase = createClient();

  const { data: rotation, isLoading } = useQuery({
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rotations")
        .select("*")
        .eq("id", params.id)
        .single();
      if (error) throw error;
      return data as RotationsRow;
    },
    queryKey: ["rotations", params.id],
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

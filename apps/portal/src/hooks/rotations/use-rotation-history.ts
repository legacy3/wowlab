"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { RotationHistory } from "@/lib/supabase/types";

export function useRotationHistory(rotationId: string | undefined) {
  return useQuery({
    queryKey: ["rotation-history", rotationId],
    queryFn: async () => {
      if (!rotationId) {
        return [];
      }
      const supabase = createClient();
      const { data, error } = await supabase
        .from("rotations_history")
        .select("id, version, createdAt, message, createdBy")
        .eq("rotationId", rotationId)
        .order("version", { ascending: false });

      if (error) throw error;
      return data as Pick<
        RotationHistory,
        "id" | "version" | "createdAt" | "message" | "createdBy"
      >[];
    },
    enabled: !!rotationId,
  });
}

export function useRotationHistoryVersion(
  rotationId: string | undefined,
  version: number | undefined,
) {
  return useQuery({
    queryKey: ["rotation-history-version", rotationId, version],
    queryFn: async () => {
      if (!rotationId || version === undefined) {
        return null;
      }
      const supabase = createClient();
      const { data, error } = await supabase
        .from("rotations_history")
        .select("script")
        .eq("rotationId", rotationId)
        .eq("version", version)
        .single();

      if (error) throw error;
      return data?.script ?? null;
    },
    enabled: !!rotationId && version !== undefined,
  });
}

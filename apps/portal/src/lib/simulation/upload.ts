import { createClient } from "@/lib/supabase/client";
import type { Json } from "@/lib/supabase/database.types";

import type { SimulationResult, RotationDefinition } from "./types";

export interface UploadParams {
  result: SimulationResult;
  rotation: RotationDefinition;
  rotationDbId?: string; // UUID from rotations table if linked
}

/**
 * Uploads simulation result to Supabase.
 * Returns the created record ID, or null if upload is skipped/fails.
 *
 * Note: rotationId has a FK constraint to rotations table.
 * If no rotationDbId is provided, upload is skipped.
 */
export async function uploadSimulationResult(
  params: UploadParams,
): Promise<string | null> {
  const { result, rotation, rotationDbId } = params;

  // Skip upload if no valid rotation ID (FK constraint would fail)
  if (!rotationDbId) {
    console.warn(
      "Skipping result upload: no rotationDbId provided (FK constraint)",
    );
    return null;
  }

  const supabase = createClient();

  const { data, error } = await supabase
    .from("rotation_sim_results")
    .insert({
      rotationId: rotationDbId,
      duration: result.durationMs / 1000,
      iterations: 1,
      fightType: "patchwerk", // TODO
      meanDps: result.dps,
      minDps: result.dps,
      maxDps: result.dps,
      stdDev: 0,
      timeline: result.events as unknown as Json,
      simVersion: "0.1.0", // TODO
      patch: "11.1.0", // TODO
      // Store rotation name for display even without DB link
      scenario: JSON.stringify({ rotationName: rotation.name }),
    })
    .select("id")
    .single();

  if (error) {
    console.error("Failed to upload simulation result:", error);
    // Don't throw - just return null so simulation still completes
    return null;
  }

  return data.id;
}

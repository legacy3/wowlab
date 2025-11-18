import type { SupabaseClient } from "@supabase/supabase-js";
import * as Layers from "@packages/innocent-bootstrap/Layers";
import { createSupabaseMetadataService } from "./supabase-metadata-service";

export const createSupabaseAppLayer = (supabase: SupabaseClient) => {
  return Layers.AppLayer.create(createSupabaseMetadataService(supabase));
};

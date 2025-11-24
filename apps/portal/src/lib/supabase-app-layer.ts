import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Placeholder app layer factory for Supabase-backed metadata.
 * Callers should provide their own wiring when simulation support returns.
 */
export const createSupabaseAppLayer = (supabase: SupabaseClient) => ({
  supabase,
});

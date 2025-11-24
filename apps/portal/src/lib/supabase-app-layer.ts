import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Placeholder app layer factory for Supabase-backed metadata.
 * The legacy innocent bootstrap layer has been removed; callers should
 * provide their own wiring when simulation support returns.
 */
export const createSupabaseAppLayer = (supabase: SupabaseClient) => ({
  supabase,
});

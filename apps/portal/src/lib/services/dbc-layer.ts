import type { SupabaseClient } from "@supabase/supabase-js";

import { SupabaseDbcService } from "./SupabaseDbcService";

/**
 * Creates a DbcService layer backed by Supabase for the Portal app.
 * Use this with Effect.provide() when running transformSpell/transformItem.
 *
 * @example
 * ```ts
 * // Server Component
 * const supabase = await createClient();
 * const dbcLayer = createPortalDbcLayer(supabase);
 * const spell = await Effect.runPromise(
 *   transformSpell(spellId).pipe(Effect.provide(dbcLayer))
 * );
 *
 * // Client Component
 * const supabase = createBrowserClient();
 * const dbcLayer = createPortalDbcLayer(supabase);
 * ```
 */
export const createPortalDbcLayer = (supabase: SupabaseClient) =>
  SupabaseDbcService(supabase);

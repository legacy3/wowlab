import type { DataProvider } from "@refinedev/core";

import { RefineDbcService } from "./RefineDbcService";

/**
 * Creates a DbcService layer backed by Refine's DataProvider.
 * All caching is handled by Refine's React Query + IndexedDB persistence (60-day cache).
 *
 * @example
 * ```tsx
 * // In a React component
 * const dataProvider = useDataProvider()();
 * const dbcLayer = createPortalDbcLayer(dataProvider);
 * const spell = await Effect.runPromise(
 *   transformSpell(spellId).pipe(Effect.provide(dbcLayer))
 * );
 * ```
 */
export const createPortalDbcLayer = (dataProvider: DataProvider) =>
  RefineDbcService(dataProvider);

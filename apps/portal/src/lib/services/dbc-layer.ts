import type { DataProvider } from "@refinedev/core";
import type { QueryClient } from "@tanstack/react-query";

import { RefineDbcService } from "./RefineDbcService";

/**
 * Creates a DbcService layer backed by React Query's caching.
 * All data is cached in React Query and persisted to IndexedDB (60-day cache).
 *
 * @example
 * ```tsx
 * // In a React component
 * const dataProvider = useDataProvider()();
 * const queryClient = useQueryClient();
 * const dbcLayer = createPortalDbcLayer(queryClient, dataProvider);
 * const spell = await Effect.runPromise(
 *   transformSpell(spellId).pipe(Effect.provide(dbcLayer))
 * );
 * ```
 */
export const createPortalDbcLayer = (
  queryClient: QueryClient,
  dataProvider: DataProvider,
) => RefineDbcService(queryClient, dataProvider);

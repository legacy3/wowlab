import type { DataProvider } from "@refinedev/core";
import type { QueryClient } from "@tanstack/react-query";
import * as Layer from "effect/Layer";

import { DbcService } from "@wowlab/services/Data";
import { ExtractorService } from "@wowlab/services/Data";
import { RefineDbcService } from "./RefineDbcService";

/**
 * Creates the DBC layer for the portal using Refine's data provider.
 *
 * All queries support automatic batching when used with Effect.forEach({ batching: true }).
 * Multiple requests are combined into single SQL queries with WHERE ID IN (...).
 */
export const createPortalDbcLayer = (
  queryClient: QueryClient,
  dataProvider: DataProvider,
) => {
  const dbcLayer = RefineDbcService(queryClient, dataProvider);
  const extractorLayer = Layer.provide(dbcLayer)(ExtractorService.Default);

  return Layer.mergeAll(dbcLayer, extractorLayer);
};

export type PortalDbcLayerContext = DbcService | ExtractorService;

import type { DataProvider } from "@refinedev/core";
import type { QueryClient } from "@tanstack/react-query";
import type * as Effect from "effect/Effect";

import { DbcService, ExtractorService } from "@wowlab/services/Data";
import * as Layer from "effect/Layer";

import { createDbcFetcher } from "./fetcher";

export type DbcContext = DbcService | ExtractorService;

export type TransformFn<T> = (
  id: number,
) => Effect.Effect<T, unknown, DbcContext>;

export const createDbcLayer = (
  queryClient: QueryClient,
  dataProvider: DataProvider,
) => {
  const dbcLayer = createDbcFetcher(queryClient, dataProvider);
  const extractorLayer = Layer.provide(dbcLayer)(ExtractorService.Default);

  return Layer.mergeAll(dbcLayer, extractorLayer);
};

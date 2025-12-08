import type { DataProvider } from "@refinedev/core";
import type { QueryClient } from "@tanstack/react-query";
import * as Layer from "effect/Layer";

import { ExtractorService } from "@wowlab/services/Data";
import { RefineDbcService } from "./RefineDbcService";

export const createPortalDbcLayer = (
  queryClient: QueryClient,
  dataProvider: DataProvider,
) => {
  const dbcLayer = RefineDbcService(queryClient, dataProvider);
  const extractorLayer = Layer.provide(dbcLayer)(ExtractorService.Default);

  return Layer.mergeAll(dbcLayer, extractorLayer);
};

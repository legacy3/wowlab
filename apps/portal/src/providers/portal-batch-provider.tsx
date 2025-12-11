"use client";

import {
  type PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
} from "react";
import { useDataProvider } from "@refinedev/core";
import { useQueryClient } from "@tanstack/react-query";
import * as Effect from "effect/Effect";

import { createPortalDbcLayer } from "@/lib/services";
import { EntityBatcher } from "@/lib/batching/entity-batcher";

type TransformEffect<T> = (id: number) => Effect.Effect<T, unknown, unknown>;
type BatchLoader<T> = (id: number) => Promise<T>;

interface PortalDbcBatchContextValue {
  getLoader<T>(type: string, transform: TransformEffect<T>): BatchLoader<T>;
}

const PortalDbcBatchContext = createContext<PortalDbcBatchContextValue | null>(
  null,
);

export function PortalDbcBatchProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const dataProviderFactory = useDataProvider();
  const dataProvider = dataProviderFactory();
  const batchersRef = useRef(new Map<string, EntityBatcher<unknown>>());

  const getLoader = useCallback(
    <T,>(type: string, transform: TransformEffect<T>): BatchLoader<T> => {
      const existing = batchersRef.current.get(type) as
        | EntityBatcher<T>
        | undefined;

      if (existing) {
        return (id: number) => existing.load(id);
      }

      const batcher = new EntityBatcher<T>({
        type,
        transform,
        createLayer: () => createPortalDbcLayer(queryClient, dataProvider),
      });

      batchersRef.current.set(type, batcher as EntityBatcher<unknown>);

      return (id: number) => batcher.load(id);
    },
    [queryClient, dataProvider],
  );

  const value = useMemo<PortalDbcBatchContextValue>(
    () => ({
      getLoader,
    }),
    [getLoader],
  );

  return (
    <PortalDbcBatchContext.Provider value={value}>
      {children}
    </PortalDbcBatchContext.Provider>
  );
}

export function usePortalDbcBatch<T>(
  type: string,
  transform: TransformEffect<T>,
): BatchLoader<T> {
  const context = useContext(PortalDbcBatchContext);

  if (!context) {
    throw new Error(
      "usePortalDbcBatch must be used within a PortalDbcBatchProvider.",
    );
  }

  return useMemo(
    () => context.getLoader(type, transform),
    [context, type, transform],
  );
}

"use client";

import {
  type PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { useDataProvider } from "@refinedev/core";
import { useQueryClient } from "@tanstack/react-query";
import * as Effect from "effect/Effect";
import * as ManagedRuntime from "effect/ManagedRuntime";

import {
  createPortalDbcLayer,
  type PortalDbcLayerContext,
} from "@/lib/services";
import { EntityBatcher } from "@/lib/batching/entity-batcher";

type TransformEffect<T> = (
  id: number,
) => Effect.Effect<T, unknown, PortalDbcLayerContext>;
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
  const batchersRef = useRef(
    new Map<string, EntityBatcher<unknown, PortalDbcLayerContext>>(),
  );

  const runtimeRef = useRef<ManagedRuntime.ManagedRuntime<
    PortalDbcLayerContext,
    unknown
  > | null>(null);

  if (runtimeRef.current == null) {
    const layer = createPortalDbcLayer(queryClient, dataProvider);
    runtimeRef.current = ManagedRuntime.make(layer);
  }

  useEffect(() => {
    return () => {
      runtimeRef.current?.dispose();
    };
  }, []);

  const getLoader = useCallback(
    <T,>(type: string, transform: TransformEffect<T>): BatchLoader<T> => {
      const existing = batchersRef.current.get(type) as
        | EntityBatcher<T, PortalDbcLayerContext>
        | undefined;

      if (existing) {
        return (id: number) => existing.load(id);
      }

      const batcher = new EntityBatcher<T, PortalDbcLayerContext>({
        type,
        transform,
        runtime: runtimeRef.current!,
      });

      batchersRef.current.set(
        type,
        batcher as EntityBatcher<unknown, PortalDbcLayerContext>,
      );

      return (id: number) => batcher.load(id);
    },
    [],
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

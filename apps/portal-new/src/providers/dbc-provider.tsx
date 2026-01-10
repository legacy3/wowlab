"use client";

import { useDataProvider } from "@refinedev/core";
import { useQueryClient } from "@tanstack/react-query";
import * as ManagedRuntime from "effect/ManagedRuntime";
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";

import {
  createDbcLayer,
  type DbcContext,
  EntityBatcher,
  type TransformFn,
} from "@/lib/dbc";

interface DbcContextValue {
  getLoader<T>(type: string, transform: TransformFn<T>): LoadFn<T>;
}

type LoadFn<T> = (id: number) => Promise<T>;

const DbcReactContext = createContext<DbcContextValue | null>(null);

export function DbcProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const dataProviderFactory = useDataProvider();
  const dataProvider = dataProviderFactory();
  const batchersRef = useRef(
    new Map<string, EntityBatcher<unknown, DbcContext>>(),
  );

  const runtimeRef = useRef<ManagedRuntime.ManagedRuntime<
    DbcContext,
    unknown
  > | null>(null);

  if (runtimeRef.current == null) {
    const layer = createDbcLayer(queryClient, dataProvider);
    runtimeRef.current = ManagedRuntime.make(layer);
  }

  useEffect(() => {
    return () => {
      runtimeRef.current?.dispose();
    };
  }, []);

  const getLoader = useCallback(
    <T,>(type: string, transform: TransformFn<T>): LoadFn<T> => {
      let batcher = batchersRef.current.get(type) as
        | EntityBatcher<T, DbcContext>
        | undefined;

      if (!batcher) {
        batcher = new EntityBatcher<T, DbcContext>({
          runtime: runtimeRef.current!,
          transform,
          type,
        });

        batchersRef.current.set(
          type,
          batcher as EntityBatcher<unknown, DbcContext>,
        );
      }

      return (id: number) => batcher.load(id);
    },
    [],
  );

  return (
    <DbcReactContext.Provider value={{ getLoader }}>
      {children}
    </DbcReactContext.Provider>
  );
}

export function useDbcLoader<T>(
  type: string,
  transform: TransformFn<T>,
): LoadFn<T> {
  const context = useContext(DbcReactContext);
  if (!context) {
    throw new Error("useDbcLoader must be used within a DbcProvider.");
  }

  return useMemo(
    () => context.getLoader(type, transform),
    [context, type, transform],
  );
}

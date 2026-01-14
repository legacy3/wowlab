"use client";

import { useCallback, useRef } from "react";
import { useAtom, useAtomValue, useStore } from "jotai";
import { useDataProvider } from "@refinedev/core";
import { useQueryClient } from "@tanstack/react-query";
import { createPortalDbcLayer } from "@/lib/services";
import {
  transformSpell,
  transformItem,
  transformAura,
} from "@wowlab/services/Data";
import * as Effect from "effect/Effect";
import {
  queryHistoryAtom,
  queryIdAtom,
  queryTypeAtom,
  queryLoadingAtom,
  queryErrorAtom,
  transformedDataAtom,
  type DataType,
  type HistoryEntry,
  type TransformedData,
} from "@/atoms/lab";

function appendHistoryEntry(
  prev: HistoryEntry[],
  id: number,
  type: DataType,
): HistoryEntry[] {
  if (prev.some((e) => e.id === id && e.type === type)) {
    return prev;
  }

  return [{ id, type, timestamp: Date.now() }, ...prev];
}

export interface UseDataInspectorResult {
  id: number;
  setId: (id: number) => void;
  type: DataType;
  setType: (type: DataType) => void;
  loading: boolean;
  error: string | null;
  data: TransformedData | null;
  history: HistoryEntry[];
  query: () => Promise<void>;
}

export function useDataInspector(): UseDataInspectorResult {
  const store = useStore();
  const dataProvider = useDataProvider()();
  const queryClient = useQueryClient();

  // Race condition handling: track the latest request
  const requestIdRef = useRef(0);

  const [id, setId] = useAtom(queryIdAtom);
  const [type, setType] = useAtom(queryTypeAtom);
  const loading = useAtomValue(queryLoadingAtom);
  const error = useAtomValue(queryErrorAtom);
  const data = useAtomValue(transformedDataAtom);
  const history = useAtomValue(queryHistoryAtom);

  const query = useCallback(async () => {
    const currentId = store.get(queryIdAtom);
    const currentType = store.get(queryTypeAtom);

    const thisRequestId = ++requestIdRef.current;

    store.set(queryLoadingAtom, true);
    store.set(queryErrorAtom, null);
    store.set(transformedDataAtom, null);

    try {
      const appLayer = createPortalDbcLayer(queryClient, dataProvider);

      let result: TransformedData;

      if (currentType === "spell") {
        result = await Effect.runPromise(
          transformSpell(currentId).pipe(Effect.provide(appLayer)),
        );
      } else if (currentType === "aura") {
        result = await Effect.runPromise(
          transformAura(currentId).pipe(Effect.provide(appLayer)),
        );
      } else {
        result = await Effect.runPromise(
          transformItem(currentId).pipe(Effect.provide(appLayer)),
        );
      }

      if (thisRequestId === requestIdRef.current) {
        store.set(transformedDataAtom, result);
        store.set(queryHistoryAtom, (prev) =>
          appendHistoryEntry(prev, currentId, currentType),
        );
      }
    } catch (e) {
      if (thisRequestId === requestIdRef.current) {
        store.set(queryErrorAtom, e instanceof Error ? e.message : String(e));
      }
    } finally {
      if (thisRequestId === requestIdRef.current) {
        store.set(queryLoadingAtom, false);
      }
    }
  }, [store, queryClient, dataProvider]);

  return {
    id,
    setId,
    type,
    setType,
    loading,
    error,
    data,
    history,
    query,
  };
}

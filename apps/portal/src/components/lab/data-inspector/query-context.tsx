"use client";

import { createContext, useContext, useCallback, type ReactNode } from "react";
import { useStore } from "jotai";
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
} from "@/atoms/data-inspector";

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

type QueryContextValue = {
  query: () => Promise<void>;
};

const QueryContext = createContext<QueryContextValue | null>(null);

export function useQuery() {
  const ctx = useContext(QueryContext);
  if (!ctx) {
    throw new Error("useQuery must be used within QueryProvider");
  }

  return ctx.query;
}

export function QueryProvider({ children }: { children: ReactNode }) {
  const store = useStore();
  const dataProvider = useDataProvider()();
  const queryClient = useQueryClient();

  const query = useCallback(async () => {
    const id = store.get(queryIdAtom);
    const dataType = store.get(queryTypeAtom);

    store.set(queryLoadingAtom, true);
    store.set(queryErrorAtom, null);
    store.set(transformedDataAtom, null);

    try {
      const appLayer = createPortalDbcLayer(queryClient, dataProvider);

      if (dataType === "spell") {
        const spell = await Effect.runPromise(
          transformSpell(id).pipe(Effect.provide(appLayer)),
        );

        store.set(transformedDataAtom, spell);
        store.set(queryHistoryAtom, (prev) =>
          appendHistoryEntry(prev, id, "spell"),
        );
      } else if (dataType === "aura") {
        const aura = await Effect.runPromise(
          transformAura(id).pipe(Effect.provide(appLayer)),
        );

        store.set(transformedDataAtom, aura);
        store.set(queryHistoryAtom, (prev) =>
          appendHistoryEntry(prev, id, "aura"),
        );
      } else {
        const item = await Effect.runPromise(
          transformItem(id).pipe(Effect.provide(appLayer)),
        );

        store.set(transformedDataAtom, item);
        store.set(queryHistoryAtom, (prev) =>
          appendHistoryEntry(prev, id, "item"),
        );
      }
    } catch (e) {
      store.set(queryErrorAtom, e instanceof Error ? e.message : String(e));
    } finally {
      store.set(queryLoadingAtom, false);
    }
  }, [store, queryClient, dataProvider]);

  return (
    <QueryContext.Provider value={{ query }}>{children}</QueryContext.Provider>
  );
}

"use client";

import { createContext, useContext, useCallback, type ReactNode } from "react";
import { useStore } from "jotai";
import { useDataProvider } from "@refinedev/core";
import { useQueryClient } from "@tanstack/react-query";
import { createPortalDbcLayer } from "@/lib/services";
import {
  DbcService,
  ExtractorService,
  transformSpell,
  transformItem,
} from "@wowlab/services/Data";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import {
  queryHistoryAtom,
  queryIdAtom,
  queryTypeAtom,
  queryLoadingAtom,
  queryErrorAtom,
  rawDataAtom,
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
    store.set(rawDataAtom, null);
    store.set(transformedDataAtom, null);

    try {
      const dbcLayer = createPortalDbcLayer(queryClient, dataProvider);
      const extractorWithDeps = Layer.provide(dbcLayer)(
        ExtractorService.Default,
      );
      const appLayer = Layer.mergeAll(dbcLayer, extractorWithDeps);

      if (dataType === "spell") {
        const rawProgram = Effect.gen(function* () {
          const dbc = yield* DbcService;

          // TODO Actually return the affected dbc files
          const [name, misc, effects, cooldowns, power] = yield* Effect.all([
            dbc.getSpellName(id),
            dbc.getSpellMisc(id),
            dbc.getSpellEffects(id),
            dbc.getSpellCooldowns(id),
            dbc.getSpellPower(id),
          ]);

          return { name, misc, effects, cooldowns, power };
        });

        const raw = await Effect.runPromise(
          rawProgram.pipe(Effect.provide(dbcLayer)),
        );
        store.set(rawDataAtom, raw);

        const spell = await Effect.runPromise(
          transformSpell(id).pipe(Effect.provide(appLayer)),
        );
        store.set(transformedDataAtom, spell);
        store.set(queryHistoryAtom, (prev) =>
          appendHistoryEntry(prev, id, "spell"),
        );
      } else {
        const rawProgram = Effect.gen(function* () {
          const dbc = yield* DbcService;
          const [item, sparse, effects] = yield* Effect.all([
            dbc.getItem(id),
            dbc.getItemSparse(id),
            dbc.getItemXItemEffects(id),
          ]);

          return { item, sparse, effects };
        });

        const raw = await Effect.runPromise(
          rawProgram.pipe(Effect.provide(dbcLayer)),
        );
        store.set(rawDataAtom, raw);

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

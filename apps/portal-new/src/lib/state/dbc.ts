"use client";

import type { Item, Spell } from "@wowlab/core/Schemas";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { transformItem, transformSpell } from "@wowlab/services/Data";

import type { TransformFn } from "@/lib/dbc";

import { useDbcLoader } from "@/providers/dbc-provider";

import type { StateResult } from "./types";

function createDbcHook<T>(
  type: string,
  transform: TransformFn<T>,
): (id: number | null | undefined) => StateResult<T> {
  return function useDbcEntity(id: number | null | undefined): StateResult<T> {
    const queryClient = useQueryClient();
    const load = useDbcLoader(type, transform);
    const queryKey = [type, "transformed", id];

    const query = useQuery({
      enabled: id != null,
      meta: { persist: true },
      queryFn: async (): Promise<T> => {
        if (id == null) {
          throw new Error(`${type} ID is required`);
        }
        return load(id);
      },
      queryKey,
    });

    return {
      data: query.data ?? null,
      error: query.error ?? null,
      isLoading: query.isLoading,
      refresh: async () => {
        await query.refetch();
      },
      set: (value) => {
        queryClient.setQueryData(queryKey, value);
      },
    };
  };
}

export const useSpell = createDbcHook<Spell.SpellDataFlat>(
  "spell",
  transformSpell,
);

export const useItem = createDbcHook<Item.ItemDataFlat>("item", transformItem);

"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { StateResult } from "./types";

interface Config<T> {
  initial: T;
  persist?: string;
}

type Updater<T> = T | ((prev: T | null) => T | null);

const applyUpdate = <T>(current: T, update: Updater<T>): T =>
  (typeof update === "function"
    ? (update as (p: T) => T)(current)
    : update) as T;

const DEFAULT_KEY = "_";
const PERSIST_PREFIX = "wowlab-";

export function createClientState<T>(
  config: Config<T>,
): (key?: string) => StateResult<T> {
  type Store = { values: Record<string, T> };

  const init = (): Store => ({ values: {} });
  const useStore = config.persist
    ? create<Store>()(persist(init, { name: PERSIST_PREFIX + config.persist }))
    : create<Store>()(init);

  return (key: string = DEFAULT_KEY) => {
    const value = useSyncExternalStore(
      useStore.subscribe,
      () => useStore.getState().values[key] ?? config.initial,
      () => config.initial,
    );

    const set = useCallback(
      (update: Updater<T>) => {
        const current = useStore.getState().values[key] ?? config.initial;

        useStore.setState((s) => ({
          values: { ...s.values, [key]: applyUpdate(current, update) },
        }));
      },
      [key],
    );

    return useMemo(
      () => ({ data: value, error: null, isLoading: false, set }),
      [value, set],
    );
  };
}

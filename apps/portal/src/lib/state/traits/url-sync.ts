"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect } from "react";

import { useTraitStore } from "./store";

const LOADOUT_PARAM = "loadout";

export function useLoadoutParam(): string | null {
  const searchParams = useSearchParams();
  return searchParams.get(LOADOUT_PARAM);
}

export function useTraitUrlSync() {
  const searchParams = useSearchParams();
  const exportLoadout = useTraitStore((state) => state.exportLoadout);
  const importLoadout = useTraitStore((state) => state.importLoadout);
  const treeData = useTraitStore((state) => state.treeData);

  useEffect(() => {
    const loadout = searchParams.get(LOADOUT_PARAM);
    if (loadout && treeData) {
      importLoadout(loadout);
    }
  }, [searchParams, treeData, importLoadout]);

  const getExportUrl = useCallback(() => {
    const loadout = exportLoadout();
    const url = new URL(window.location.href);
    url.searchParams.set(LOADOUT_PARAM, loadout);
    return url.toString();
  }, [exportLoadout]);

  const updateUrl = useCallback(() => {
    const loadout = exportLoadout();
    const url = new URL(window.location.href);
    url.searchParams.set(LOADOUT_PARAM, loadout);
    window.history.replaceState({}, "", url.toString());
  }, [exportLoadout]);

  return { getExportUrl, updateUrl };
}

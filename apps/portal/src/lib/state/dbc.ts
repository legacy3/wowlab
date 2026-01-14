"use client";

import type { Schemas } from "@wowlab/core";
import type { Class, Item, Spec, Spell } from "@wowlab/core/Schemas";

import { useList } from "@refinedev/core";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  transformClass,
  transformItem,
  transformSpec,
  transformSpell,
} from "@wowlab/services/Data";
import { useCallback, useMemo } from "react";

import type { TransformFn } from "@/lib/dbc";

import { useDbcLoader } from "@/providers/dbc-provider";

import type { StateResult } from "./types";

type ManifestInterfaceData = Schemas.Dbc.ManifestInterfaceDataRow;

function createDbcHook<T>(
  type: string,
  transform: TransformFn<T>,
): (id: number | null | undefined) => StateResult<T> {
  return function useDbcEntity(id: number | null | undefined): StateResult<T> {
    const queryClient = useQueryClient();
    const load = useDbcLoader(type, transform);
    const queryKey = useMemo(() => [type, "transformed", id], [id]);

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

export const useClass = createDbcHook<Class.ClassDataFlat>(
  "class",
  transformClass,
);

export const useItem = createDbcHook<Item.ItemDataFlat>("item", transformItem);

export const useSpec = createDbcHook<Spec.SpecDataFlat>("spec", transformSpec);

export const useSpell = createDbcHook<Spell.SpellDataFlat>(
  "spell",
  transformSpell,
);

// --- List hooks ---

type ChrClass = Schemas.Dbc.ChrClassesRow;
type ChrSpec = Schemas.Dbc.ChrSpecializationRow;

const LIST_CONFIG = {
  meta: { idColumnName: "ID", schema: "raw_dbc" },
  pagination: { mode: "off" as const },
};

export interface ClassListItem {
  color: string;
  filename: string;
  id: number;
  label: string;
}

export interface SpecListItem {
  classId: number;
  iconName: string;
  id: number;
  label: string;
}

export function useClasses() {
  const { query, result } = useList<ChrClass>({
    resource: "chr_classes",
    ...LIST_CONFIG,
  });

  const classes = useMemo<ClassListItem[]>(() => {
    if (!result?.data) {
      return [];
    }
    return result.data
      .filter((c) => c.ID > 0 && c.ID <= 13 && c.Name_lang)
      .map((c) => ({
        color: rgbToHex(c.ClassColorR, c.ClassColorG, c.ClassColorB),
        filename: c.Filename?.toLowerCase() ?? "",
        id: c.ID,
        label: c.Name_lang ?? "",
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [result?.data]);

  return { classes, isLoading: query.isLoading };
}

export function useClassesAndSpecs() {
  const { classes, isLoading: classesLoading } = useClasses();
  const { isLoading: specsLoading, specs } = useSpecs();

  const specsByClassId = useMemo(() => {
    const map = new Map<number, SpecListItem[]>();
    for (const spec of specs) {
      const existing = map.get(spec.classId) ?? [];
      existing.push(spec);
      map.set(spec.classId, existing);
    }
    return map;
  }, [specs]);

  const getClassColor = (specId: number): string => {
    const spec = specs.find((s) => s.id === specId);
    if (!spec) {
      return "#6B7280";
    }
    const cls = classes.find((c) => c.id === spec.classId);
    return cls?.color ?? "#6B7280";
  };

  const getSpecLabel = (specId: number): string | null => {
    const spec = specs.find((s) => s.id === specId);
    if (!spec) {
      return null;
    }
    const cls = classes.find((c) => c.id === spec.classId);
    if (!cls) {
      return spec.label;
    }
    return `${cls.label} - ${spec.label}`;
  };

  const getSpecIdsForClass = (classId: number): number[] => {
    return specsByClassId.get(classId)?.map((s) => s.id) ?? [];
  };

  const getSpecIcon = (specId: number): string | null => {
    return specs.find((s) => s.id === specId)?.iconName ?? null;
  };

  return {
    classes,
    getClassColor,
    getSpecIcon,
    getSpecIdsForClass,
    getSpecLabel,
    isLoading: classesLoading || specsLoading,
    specs,
  };
}

export function useSpecs() {
  const { query, result } = useList<ChrSpec>({
    resource: "chr_specialization",
    ...LIST_CONFIG,
  });

  const filteredSpecs = useMemo(() => {
    if (!result?.data) {
      return [];
    }
    return result.data.filter(
      (s) => s.ClassID > 0 && s.Name_lang && s.Name_lang !== "Initial",
    );
  }, [result?.data]);

  const iconFileIds = useMemo(() => {
    return Array.from(
      new Set(
        filteredSpecs
          .map((s) => s.SpellIconFileID)
          .filter((id): id is number => id != null),
      ),
    );
  }, [filteredSpecs]);

  const { query: iconQuery, result: iconResult } =
    useList<ManifestInterfaceData>({
      resource: "manifest_interface_data",
      ...LIST_CONFIG,
      filters: [{ field: "ID", operator: "in", value: iconFileIds }],
      queryOptions: { enabled: iconFileIds.length > 0 },
    });

  const iconMap = useMemo(() => {
    const map = new Map<number, string>();
    for (const item of iconResult?.data ?? []) {
      if (item.ID && item.FileName) {
        map.set(item.ID, item.FileName.toLowerCase().replace(".blp", ""));
      }
    }
    return map;
  }, [iconResult?.data]);

  const specs = useMemo<SpecListItem[]>(() => {
    return filteredSpecs.map((s) => ({
      classId: s.ClassID,
      iconName: iconMap.get(s.SpellIconFileID!) ?? "inv_misc_questionmark",
      id: s.ID,
      label: s.Name_lang ?? "",
    }));
  }, [filteredSpecs, iconMap]);

  return { isLoading: query.isLoading || iconQuery.isLoading, specs };
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
